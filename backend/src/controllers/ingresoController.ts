import { Request, Response } from 'express';
import { IngresoService } from '../services/ingresoService';
import { CreateIngresoDto } from '../dtos/Ingreso/CreateIngreso.dto';
import { ArqueoCajaService } from '../services/ArqueoCajaService';

export class IngresoController {
    private ingresoService: IngresoService;
    private arqueoCajaService: ArqueoCajaService;

    constructor() {
        this.ingresoService = new IngresoService();
        this.arqueoCajaService = new ArqueoCajaService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresos = await this.ingresoService.findAll();
            res.status(200).json({
                success: true,
                data: ingresos,
                count: ingresos.length
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener ingresos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingreso = await this.ingresoService.findById(id);
            
            if (!ingreso) {
                res.status(404).json({
                    success: false,
                    message: 'Ingreso no encontrado'
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                data: ingreso
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener ingreso',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    getByArqueoId = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.arqueoId);
            const ingresos = await this.ingresoService.findByArqueoId(arqueoId);
            
            res.status(200).json({
                success: true,
                data: {
                    count: ingresos.length,
                    total: ingresos.reduce((sum, i) => sum + i.monto, 0),
                    items: ingresos
                }
            });
        } catch (error: any) {
            const status = error.message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: 'Error al obtener ingresos por arqueo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresoData = new CreateIngresoDto(req.body);
            
            // No necesitamos validar el arqueo aquí porque lo hacemos en el servicio
            const ingreso = await this.ingresoService.create(ingresoData);
            res.status(201).json({
                success: true,
                data: ingreso,
                message: 'Ingreso registrado exitosamente'
            });
        } catch (error: any) {
            console.error('Error al crear ingreso:', error);
            const status = error.message.includes('no encontrado') ? 404 : 
                            error.message.includes('cerrado') ? 400 : 
                            error.message.includes('requeridos') ? 400 : 500;
            
            res.status(status).json({
                success: false,
                message: error.message,
                error: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingresoData = req.body;
            
            // Validar que el ingreso existe primero
            const existingIngreso = await this.ingresoService.findById(id);
            if (!existingIngreso) {
                res.status(404).json({
                    success: false,
                    message: 'Ingreso no encontrado'
                });
                return;
            }
            
            const updatedIngreso = await this.ingresoService.update(id, ingresoData);
            
            res.status(200).json({
                success: true,
                data: updatedIngreso,
                message: 'Ingreso actualizado exitosamente'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al actualizar ingreso',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    
}