import { Request, Response } from 'express';
import { ArqueoCajaService } from '../services/ArqueoCajaService';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';

export class ArqueoCajaController {
    private arqueoCajaService: ArqueoCajaService;

    constructor() {
        this.arqueoCajaService = new ArqueoCajaService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueos = await this.arqueoCajaService.findAll();
            res.status(200).json(arqueos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener arqueos de caja', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Validación adicional en el controlador
            if (isNaN(id)) {
                res.status(400).json({ 
                    success: false,
                    message: 'El ID debe ser un número válido'
                });
                return;
            }

            const arqueo = await this.arqueoCajaService.findById(id);
            
            res.status(200).json({
                success: true,
                data: arqueo
            });
        } catch (error: any) {
            console.error(`Error al obtener arqueo ${req.params.id}:`, error);
            
            // Manejo específico de errores
            if (error.message.includes('no encontrado')) {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else if (error.message.includes('no válido')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error interno al obtener el arqueo',
                    error: process.env.NODE_ENV === 'development' 
                        ? error.message 
                        : undefined
                });
            }
        }
    }

    getByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const arqueos = await this.arqueoCajaService.findByEmpleado(empleadoId);
            res.status(200).json(arqueos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener arqueos por empleado', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoData = new CreateArqueoCajaDto(req.body);
            const arqueo = await this.arqueoCajaService.create(arqueoData);
            res.status(201).json(arqueo);
        } catch (error: any) {
            res.status(400).json({
                message: 'Error al crear arqueo de caja',
                error: error.message
            });
        }
    };

    close = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const closeData = new CloseArqueoCajaDto(req.body);
            const arqueo = await this.arqueoCajaService.close(id, closeData);
            res.status(200).json(arqueo);
        } catch (error: any) {
            console.error('Error detallado:', error); // Agregar log para depuración
            res.status(500).json({
                message: 'Error al cerrar arqueo de caja',
                error: error.message || 'Error desconocido' // Asegurar que haya mensaje
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const arqueoData = req.body;
            
            const arqueo = await this.arqueoCajaService.update(id, arqueoData);
            
            if (!arqueo) {
                res.status(404).json({ message: 'Arqueo de caja no encontrado' });
                return;
            }
            
            res.status(200).json(arqueo);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar arqueo de caja', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.arqueoCajaService.delete(id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Error al eliminar arqueo de caja', error });
            }
        }
    };
}