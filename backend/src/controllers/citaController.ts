import { Request, Response } from "express";
import { CitaService } from "../services/citaService";
import { CreateCitaDto } from "../dtos/Cita/CreateCita.dto";
import { UpdateCitaDto } from "../dtos/Cita/UpdateCita.dto";
import { ServicioService } from "../services/servicioService";
import { Servicio } from "../entity/servicio";
import { AppDataSource } from "../config/database";

export class CitaController {
  private citaService: CitaService;
  private servicioService: ServicioService;

  constructor() {
    this.citaService = new CitaService();
    this.servicioService = new ServicioService();
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const citas = await this.citaService.findAll();
      res.status(200).json(citas);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener citas", error });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const cita = await this.citaService.findById(id);

      if (!cita) {
        res.status(404).json({ message: "Cita no encontrada" });
        return;
      }

      res.status(200).json(cita);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener cita", error });
    }
  };

  getByCliente = async (req: Request, res: Response): Promise<void> => {
    try {
      const clienteId = parseInt(req.params.clienteId);
      const citas = await this.citaService.findByCliente(clienteId);
      res.status(200).json(citas);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener citas por cliente", error });
    }
  };

  getByEmpleado = async (req: Request, res: Response): Promise<void> => {
    try {
      const empleadoId = parseInt(req.params.empleadoId);
      const citas = await this.citaService.findByEmpleado(empleadoId);
      res.status(200).json(citas);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al obtener citas por empleado", error });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validación básica del cuerpo de la solicitud
      if (!req.body || Object.keys(req.body).length === 0) {
        throw new Error("El cuerpo de la solicitud no puede estar vacío");
      }

      // Validar campos requeridos
      const requiredFields = [
        "fecha",
        "clienteId",
        "empleadoId",
        "servicioIds",
      ];
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Campos requeridos faltantes: ${missingFields.join(", ")}`
        );
      }

      // Validar formato de fecha ISO 8601
      const isoDatePattern =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
      if (!isoDatePattern.test(req.body.fecha)) {
        throw new Error(
          "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
        );
      }

      // Calcular duración total de los servicios
      const servicioRepository = AppDataSource.getRepository(Servicio);
        const servicios = await servicioRepository.findByIds(req.body.servicioIds);
        
        if (servicios.length !== req.body.servicioIds.length) {
            throw new Error("Algunos servicios no fueron encontrados");
        }

        const duracionTotal = servicios.reduce(
            (total, servicio) => total + Number(servicio.duracion || 30),
            0
        );

        const fecha = new Date(req.body.fecha);
        const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);

        // Verificar disponibilidad del empleado (solo mismo día)
        const inicioDia = new Date(fecha);
        inicioDia.setHours(0, 0, 0, 0);
        
        const finDia = new Date(fecha);
        finDia.setHours(23, 59, 59, 999);

        const citasExistente = await this.citaService.findByEmpleadoAndFechaRange(
            req.body.empleadoId,
            inicioDia,
            finDia
        );

        // Filtrar solo citas que realmente se solapan
        const citasSolapadas = citasExistente.filter(citaExistente => {
            const serviciosCita = citaExistente.servicios || [];
            const duracionCita = serviciosCita.reduce(
                (total, s) => total + Number(s.duracion || 30), 0
            );
            const inicioExistente = new Date(citaExistente.fecha);
            const finExistente = new Date(inicioExistente.getTime() + duracionCita * 60000);

            return (
                (fecha >= inicioExistente && fecha < finExistente) ||
                (fechaFin > inicioExistente && fechaFin <= finExistente) ||
                (fecha <= inicioExistente && fechaFin >= finExistente)
            );
        });

        if (citasSolapadas.length > 0) {
            const mensajeError = citasSolapadas.map(cita => {
                const inicio = new Date(cita.fecha);
                const serviciosCita = cita.servicios || [];
                const duracionCita = serviciosCita.reduce(
                    (total, s) => total + Number(s.duracion || 30), 0
                );
                const fin = new Date(inicio.getTime() + duracionCita * 60000);
                
                return `El empleado ya tiene una cita de ${duracionCita} minutos programada de ${inicio.toLocaleTimeString()} a ${fin.toLocaleTimeString()}`;
            }).join("\n");

            throw new Error(`Conflicto de horario:\n${mensajeError}`);
        }

        if (citasSolapadas.length > 0) {
            const mensajeError = citasSolapadas.map(cita => {
                const inicio = new Date(cita.fecha);
                const serviciosCita = cita.servicios || [];
                const duracionCita = serviciosCita.reduce(
                    (total, s) => total + Number(s.duracion || 30), 0
                );
                const fin = new Date(inicio.getTime() + duracionCita * 60000);
                
                const serviciosNombres = serviciosCita.map(s => s.nombre).join(', ');
                
                return `El empleado ${cita.empleado.nombre} ya tiene una cita para ${serviciosNombres} (${duracionCita} min) programada de ${inicio.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a ${fin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            }).join('\n');
        
            throw new Error(`CONFLICTO_HORARIO:${mensajeError}`);
        }
        
      // Crear DTO y procesar
      const citaData = new CreateCitaDto(req.body);
      const cita = await this.citaService.create(citaData);

      res.status(201).json({
        success: true,
        data: cita,
        message: "Cita creada exitosamente",
        duracionTotal: `${duracionTotal} minutos`,
        horario: `${fecha.toLocaleTimeString()} - ${fechaFin.toLocaleTimeString()}`
      });
    } catch (error: any) {
      const statusCode = error.message.includes("ya tiene una cita") ||
                        error.message.includes("Conflicto de horario")
        ? 409 // Conflict
        : 400; // Bad Request
        
      res.status(statusCode).json({
        success: false,
        message: "Empleado ocupado a esa hora",
        error: error.message,
        details: error instanceof Error ? error.stack : null,
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
      try {
          const id = parseInt(req.params.id);
          
          // Validación básica del cuerpo de la solicitud
          if (!req.body || Object.keys(req.body).length === 0) {
              throw new Error("El cuerpo de la solicitud no puede estar vacío");
          }

          // Obtener la cita existente
          const citaExistente = await this.citaService.findById(id);
          
          // Calcular duración total de los servicios
          const servicioRepository = AppDataSource.getRepository(Servicio);
          const servicioIds = req.body.servicioIds || citaExistente.servicios.map(s => s.idServicio);
          const servicios = await servicioRepository.findByIds(servicioIds);
          
          if (servicios.length !== servicioIds.length) {
              throw new Error("Algunos servicios no fueron encontrados");
          }

          const duracionTotal = servicios.reduce(
              (total, servicio) => total + Number(servicio.duracion || 30),
              0
          );

          // Configurar fechas
          const fecha = req.body.fecha ? new Date(req.body.fecha) : new Date(citaExistente.fecha);
          const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);

          // Verificar disponibilidad del empleado (excluyendo esta cita)
          const empleadoId = req.body.empleadoId || citaExistente.empleado.idEmpleado;
          
          // Verificar solo citas del mismo día
          const inicioDia = new Date(fecha);
          inicioDia.setHours(0, 0, 0, 0);
          
          const finDia = new Date(fecha);
          finDia.setHours(23, 59, 59, 999);

          const citasDelDia = await this.citaService.findByEmpleadoAndFechaRange(
              empleadoId,
              inicioDia,
              finDia
          );

          // Filtrar citas que realmente se solapan (excluyendo la actual)
          const citasSolapadas = citasDelDia.filter(cita => {
              if (cita.idCita === id) return false; // Excluir la cita actual
              
              const serviciosCita = cita.servicios || [];
              const duracionCita = serviciosCita.reduce(
                  (total, s) => total + Number(s.duracion || 30), 0
              );
              const inicioExistente = new Date(cita.fecha);
              const finExistente = new Date(inicioExistente.getTime() + duracionCita * 60000);

              return (
                  (fecha >= inicioExistente && fecha < finExistente) ||
                  (fechaFin > inicioExistente && fechaFin <= finExistente) ||
                  (fecha <= inicioExistente && fechaFin >= finExistente)
              );
          });

          if (citasSolapadas.length > 0) {
              const mensajeError = citasSolapadas.map(cita => {
                  const inicio = new Date(cita.fecha);
                  const serviciosCita = cita.servicios || [];
                  const duracionCita = serviciosCita.reduce(
                      (total, s) => total + Number(s.duracion || 30), 0
                  );
                  const fin = new Date(inicio.getTime() + duracionCita * 60000);
                  
                  return `El empleado ya tiene una cita de ${duracionCita} minutos programada de ${inicio.toLocaleTimeString()} a ${fin.toLocaleTimeString()}`;
              }).join("\n");

              throw new Error(`Conflicto de horario:\n${mensajeError}`);
          }

          // Crear DTO y actualizar
          const citaData = new UpdateCitaDto(req.body);
          const cita = await this.citaService.update(id, citaData);

          res.status(200).json({
              success: true,
              data: cita,
              message: "Cita actualizada exitosamente",
              duracionTotal: `${duracionTotal} minutos`,
              horario: `${fecha.toLocaleTimeString()} - ${fechaFin.toLocaleTimeString()}`
          });
      } catch (error: any) {
          const statusCode = error.message.includes("Conflicto de horario") 
              ? 409 
              : error.message.includes("no encontrada") 
                  ? 404 
                  : 400;
          
          res.status(statusCode).json({
              success: false,
              message: "Error al actualizar cita",
              error: error.message,
              details: error instanceof Error ? error.stack : null,
          });
      }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      await this.citaService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes("no encontrada")) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Error al eliminar cita", error });
      }
    }
  };

  getCitasPorFecha = async (req: Request, res: Response): Promise<void> => {
    try {
      const { desde, hasta } = req.query;
      if (!desde || !hasta) {
        throw new Error(
          "Los parámetros desde y hasta son requeridos (ej: ?desde=2023-12-01&hasta=2023-12-31)"
        );
      }

      // Validar formato de fechas
      const fechaDesde = new Date(desde as string);
      const fechaHasta = new Date(hasta as string);

      if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
        throw new Error("Formato de fecha inválido. Use YYYY-MM-DD");
      }

      const citas = await this.citaService.getCitasPorFecha(
        desde as string,
        hasta as string
      );
      res.status(200).json(citas);
    } catch (error: any) {
      res.status(400).json({
        message: "Error al obtener citas por fecha",
        error: error.message,
      });
    }
  };
}