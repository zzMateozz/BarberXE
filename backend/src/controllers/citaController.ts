import { Request, Response } from "express";
import { CitaService } from "../services/citaService";
import { CreateCitaDto } from "../dtos/Cita/CreateCita.dto";
import { UpdateCitaDto } from "../dtos/Cita/UpdateCita.dto";
import { ServicioService } from "../services/servicioService";
import { Servicio } from "../entity/servicio";

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

      // Validar campos requeridos antes de procesar
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

      const fecha = new Date(req.body.fecha);
      if (isNaN(fecha.getTime())) {
        throw new Error("Fecha no válida");
      }

      // Crear DTO y procesar
      const citaData = new CreateCitaDto(req.body);
      const cita = await this.citaService.create(citaData);

      res.status(201).json({
        success: true,
        data: cita,
        message: "Cita creada exitosamente",
      });
    } catch (error: any) {
      const statusCode = error.message.includes("ya tiene una cita")
        ? 409
        : 400;
      res.status(statusCode).json({
        success: false,
        message: "Error al crear cita",
        error: error.message,
        details: error instanceof Error ? error.stack : null,
      });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const citaData = new UpdateCitaDto(req.body);
      const cita = await this.citaService.update(id, citaData);
      res.status(200).json(cita);
    } catch (error: any) {
      if (error.message.includes("no encontrada")) {
        res.status(404).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Error al actualizar cita", error });
      }
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

  checkDisponibilidad = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Validar que los servicios estén inicializados
        if (!this.citaService || !this.servicioService) {
             res.status(500).json({ 
                success: false, 
                message: "Servicios no inicializados" 
            });
        }

        // 2. Extraer y validar datos del request
        const { idEmpleado, fechaHora, servicios } = req.body;
        
        if (!idEmpleado || !fechaHora || !servicios) {
             res.status(400).json({
                success: false,
                message: "Datos incompletos (se requieren idEmpleado, fechaHora y servicios)"
            });
        }

        // 3. Normalizar y validar IDs de servicios
        const idsServicios = Array.isArray(servicios) ? servicios : [servicios];
        const idsValidos = idsServicios
            .map(id => Number(id))
            .filter(id => !isNaN(id) && id > 0);

        if (idsValidos.length === 0) {
             res.status(400).json({
                success: false,
                message: "No se proporcionaron IDs de servicios válidos"
            });
        }

        // 4. Obtener servicios y verificar existencia
        const serviciosEncontrados = await this.servicioService.findByIds(idsValidos);
        
        if (serviciosEncontrados.length !== idsValidos.length) {
            const faltantes = idsValidos.filter(
                id => !serviciosEncontrados.some((s: { idServicio: number; }) => s.idServicio === id)
            );
           res.status(404).json({
                success: false,
                message: "Algunos servicios no existen",
                faltantes
            });
        }

        // 5. Calcular duración total
        const duracionTotal = serviciosEncontrados.reduce(
            (total: any, servicio: { duracion: any; }) => total + (servicio.duracion || 0), 
            0
        );

        if (duracionTotal <= 0) {
             res.status(400).json({
                success: false,
                message: "La duración total de los servicios es inválida"
            });
        }

        // 6. Verificar disponibilidad del empleado
        const fechaInicio = new Date(fechaHora);
        const fechaFin = new Date(fechaInicio.getTime() + duracionTotal * 60000);
        
        const disponible = await this.citaService.checkDisponibilidad(
            idEmpleado,
            fechaInicio,
            fechaFin
        );

        // 7. Responder
        res.status(200).json({
            success: true,
            disponible,
            duracionTotal,
            servicios: serviciosEncontrados // Opcional: enviar los servicios encontrados
        });

    } catch (error) {
        console.error("Error en checkDisponibilidad:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Error interno del servidor",
                error: error instanceof Error ? error.message : "Error desconocido"
            });
        }
    }
};
}
