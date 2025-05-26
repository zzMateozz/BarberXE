import { Request, Response } from "express";
import { CitaService } from "../services/citaService";
import { CreateCitaDto } from "../dtos/Cita/CreateCita.dto";
import { UpdateCitaDto } from "../dtos/Cita/UpdateCita.dto";
import { ServicioService } from "../services/servicioService";
import { Servicio } from "../entity/servicio";
import { AppDataSource } from "../config/database";
import { HttpResponse } from "../shared/response/http.response";

export class CitaController {
    private citaService: CitaService;
    private servicioService: ServicioService;
    private httpResponse: HttpResponse;

    constructor() {
        this.citaService = new CitaService();
        this.servicioService = new ServicioService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const citas = await this.citaService.findAll();
            this.httpResponse.OK(res, citas);
        } catch (error) {
            this.httpResponse.Error(res, {
                message: "Error al obtener citas",
                error
            });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const cita = await this.citaService.findById(id);

            if (!cita) {
                this.httpResponse.NotFound(res, {
                    message: "Cita no encontrada"
                });
                return;
            }

            this.httpResponse.OK(res, cita);
        } catch (error) {
            this.httpResponse.Error(res, {
                message: "Error al obtener cita",
                error
            });
        }
    };

    getByCliente = async (req: Request, res: Response): Promise<void> => {
        try {
            const clienteId = parseInt(req.params.clienteId);
            const citas = await this.citaService.findByCliente(clienteId);
            this.httpResponse.OK(res, citas);
        } catch (error) {
            this.httpResponse.Error(res, {
                message: "Error al obtener citas por cliente",
                error
            });
        }
    };

    getByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const citas = await this.citaService.findByEmpleado(empleadoId);
            this.httpResponse.OK(res, citas);
        } catch (error) {
            this.httpResponse.Error(res, {
                message: "Error al obtener citas por empleado",
                error
            });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.body || Object.keys(req.body).length === 0) {
                this.httpResponse.BadRequest(res, {
                    message: "El cuerpo de la solicitud no puede estar vacío"
                });
                return;
            }

            const requiredFields = ["fecha", "clienteId", "empleadoId", "servicioIds"];
            const missingFields = requiredFields.filter((field) => !req.body[field]);

            if (missingFields.length > 0) {
                this.httpResponse.BadRequest(res, {
                    message: `Campos requeridos faltantes: ${missingFields.join(", ")}`
                });
                return;
            }

            const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
            if (!isoDatePattern.test(req.body.fecha)) {
                this.httpResponse.BadRequest(res, {
                    message: "Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
                });
                return;
            }

            const servicioRepository = AppDataSource.getRepository(Servicio);
            const servicios = await servicioRepository.findByIds(req.body.servicioIds);
            
            if (servicios.length !== req.body.servicioIds.length) {
                this.httpResponse.BadRequest(res, {
                    message: "Algunos servicios no fueron encontrados"
                });
                return;
            }

            const duracionTotal = servicios.reduce(
                (total, servicio) => total + Number(servicio.duracion || 30),
                0
            );

            const fecha = new Date(req.body.fecha);
            const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);

            const inicioDia = new Date(fecha);
            inicioDia.setHours(0, 0, 0, 0);
            
            const finDia = new Date(fecha);
            finDia.setHours(23, 59, 59, 999);

            const citasExistente = await this.citaService.findByEmpleadoAndFechaRange(
                req.body.empleadoId,
                inicioDia,
                finDia
            );

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
                    
                    const serviciosNombres = serviciosCita.map(s => s.nombre).join(', ');
                    
                    return `El empleado ${cita.empleado.nombre} ya tiene una cita para ${serviciosNombres} (${duracionCita} min) programada de ${inicio.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a ${fin.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }).join('\n');

                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: "Empleado ocupado a esa hora",
                    error: `CONFLICTO_HORARIO:${mensajeError}`
                });
                return;
            }
            
            const citaData = new CreateCitaDto(req.body);
            const cita = await this.citaService.create(citaData);

            this.httpResponse.Created(res, {
                success: true,
                data: cita,
                message: "Cita creada exitosamente",
                duracionTotal: `${duracionTotal} minutos`,
                horario: `${fecha.toLocaleTimeString()} - ${fechaFin.toLocaleTimeString()}`
            });
        } catch (error: any) {
            console.error('Error en create cita:', error);
            this.httpResponse.BadRequest(res, {
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
            
            if (!req.body || Object.keys(req.body).length === 0) {
                this.httpResponse.BadRequest(res, {
                    message: "El cuerpo de la solicitud no puede estar vacío"
                });
                return;
            }

            const citaExistente = await this.citaService.findById(id);
            
            const servicioRepository = AppDataSource.getRepository(Servicio);
            const servicioIds = req.body.servicioIds || citaExistente.servicios.map(s => s.idServicio);
            const servicios = await servicioRepository.findByIds(servicioIds);
            
            if (servicios.length !== servicioIds.length) {
                this.httpResponse.BadRequest(res, {
                    message: "Algunos servicios no fueron encontrados"
                });
                return;
            }

            const duracionTotal = servicios.reduce(
                (total, servicio) => total + Number(servicio.duracion || 30),
                0
            );

            const fecha = req.body.fecha ? new Date(req.body.fecha) : new Date(citaExistente.fecha);
            const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);

            const empleadoId = req.body.empleadoId || citaExistente.empleado.idEmpleado;
            
            const inicioDia = new Date(fecha);
            inicioDia.setHours(0, 0, 0, 0);
            
            const finDia = new Date(fecha);
            finDia.setHours(23, 59, 59, 999);

            const citasDelDia = await this.citaService.findByEmpleadoAndFechaRange(
                empleadoId,
                inicioDia,
                finDia
            );

            const citasSolapadas = citasDelDia.filter(cita => {
                if (cita.idCita === id) return false;
                
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

                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: "Conflicto de horario",
                    error: mensajeError
                });
                return;
            }

            const citaData = new UpdateCitaDto(req.body);
            const cita = await this.citaService.update(id, citaData);

            this.httpResponse.OK(res, {
                success: true,
                data: cita,
                message: "Cita actualizada exitosamente",
                duracionTotal: `${duracionTotal} minutos`,
                horario: `${fecha.toLocaleTimeString()} - ${fechaFin.toLocaleTimeString()}`
            });
        } catch (error: any) {
            if (error.message.includes("no encontrada")) {
                this.httpResponse.NotFound(res, {
                    success: false,
                    message: "Cita no encontrada",
                    error: error.message
                });
            } else {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: "Error al actualizar cita",
                    error: error.message,
                    details: error instanceof Error ? error.stack : null,
                });
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.citaService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error: any) {
            if (error.message.includes("no encontrada")) {
                this.httpResponse.NotFound(res, {
                    message: error.message
                });
            } else {
                this.httpResponse.Error(res, {
                    message: "Error al eliminar cita",
                    error
                });
            }
        }
    };

    getCitasPorFecha = async (req: Request, res: Response): Promise<void> => {
        try {
            const { desde, hasta } = req.query;
            if (!desde || !hasta) {
                this.httpResponse.BadRequest(res, {
                    message: "Los parámetros desde y hasta son requeridos (ej: ?desde=2023-12-01&hasta=2023-12-31)"
                });
                return;
            }

            const fechaDesde = new Date(desde as string);
            const fechaHasta = new Date(hasta as string);

            if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
                this.httpResponse.BadRequest(res, {
                    message: "Formato de fecha inválido. Use YYYY-MM-DD"
                });
                return;
            }

            const citas = await this.citaService.getCitasPorFecha(
                desde as string,
                hasta as string
            );
            this.httpResponse.OK(res, citas);
        } catch (error: any) {
            this.httpResponse.BadRequest(res, {
                message: "Error al obtener citas por fecha",
                error: error.message,
            });
        }
    };
}