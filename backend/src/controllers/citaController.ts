import { Request, Response } from 'express';
import { CitaService } from '../services/citaService';
import { CreateCitaDto } from '../dtos/Cita/CreateCita.dto';
import { UpdateCitaDto } from '../dtos/Cita/UpdateCita.dto';

export class CitaController {
    private citaService: CitaService;

    constructor() {
        this.citaService = new CitaService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const citas = await this.citaService.findAll();
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const cita = await this.citaService.findById(id);
            
            if (!cita) {
                res.status(404).json({ message: 'Cita no encontrada' });
                return;
            }
            
            res.status(200).json(cita);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener cita', error });
        }
    };

    getByCliente = async (req: Request, res: Response): Promise<void> => {
        try {
            const clienteId = parseInt(req.params.clienteId);
            const citas = await this.citaService.findByCliente(clienteId);
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas por cliente', error });
        }
    };

    getByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const citas = await this.citaService.findByEmpleado(empleadoId);
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas por empleado', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            // Validación básica del cuerpo de la solicitud
            if (!req.body || Object.keys(req.body).length === 0) {
                throw new Error('El cuerpo de la solicitud no puede estar vacío');
            }
    
            // Validar campos requeridos antes de procesar
            const requiredFields = ['fecha', 'clienteId', 'empleadoId', 'servicioIds'];
            const missingFields = requiredFields.filter(field => !req.body[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
            }
    
            // Validar formato de fecha ISO 8601
            const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
            if (!isoDatePattern.test(req.body.fecha)) {
                throw new Error('Formato de fecha inválido. Use ISO 8601 (YYYY-MM-DDTHH:MM:SS)');
            }
    
            const fecha = new Date(req.body.fecha);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha no válida');
            }
    
            // Crear DTO y procesar
            const citaData = new CreateCitaDto(req.body);
            const cita = await this.citaService.create(citaData);
            
            res.status(201).json({
                success: true,
                data: cita,
                message: 'Cita creada exitosamente'
            });
        } catch (error: any) {
            const statusCode = error.message.includes('ya tiene una cita') ? 409 : 400;
            res.status(statusCode).json({
                success: false,
                message: 'Error al crear cita',
                error: error.message,
                details: error instanceof Error ? error.stack : null
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
            if (error.message.includes('no encontrada')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Error al actualizar cita', error });
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.citaService.delete(id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no encontrada')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Error al eliminar cita', error });
            }
        }
    };

    getCitasPorFecha = async (req: Request, res: Response): Promise<void> => {
        try {
            const { desde, hasta } = req.query;
            if (!desde || !hasta) {
                throw new Error('Los parámetros desde y hasta son requeridos (ej: ?desde=2023-12-01&hasta=2023-12-31)');
            }
    
            // Validar formato de fechas
            const fechaDesde = new Date(desde as string);
            const fechaHasta = new Date(hasta as string);
            
            if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
                throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
            }
    
            const citas = await this.citaService.getCitasPorFecha(desde as string, hasta as string);
            res.status(200).json(citas);
        } catch (error: any) {
            res.status(400).json({
                message: 'Error al obtener citas por fecha',
                error: error.message
            });
        }
    }
}