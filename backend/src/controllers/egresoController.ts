import { Request, Response } from 'express';
import { EgresoService } from '../services/egresoService';
import { CreateEgresoDto } from '../dtos/Egreso/CreateEgreso.dto';
import { ArqueoCajaService } from '../services/ArqueoCajaService';

export class EgresoController {
    private egresoService: EgresoService;
    private arqueoCajaService: ArqueoCajaService;

    constructor() {
        this.egresoService = new EgresoService();
        this.arqueoCajaService = new ArqueoCajaService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresos = await this.egresoService.findAll();
            res.status(200).json({
                success: true,
                data: egresos,
                count: egresos.length
            });
        } catch (error: any) {
            console.error('Error al obtener egresos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener egresos',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const egreso = await this.egresoService.findById(id);
            
            if (!egreso) {
                res.status(404).json({
                    success: false,
                    message: 'Egreso no encontrado'
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                data: egreso
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener egreso',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresoData = new CreateEgresoDto(req.body);
            
            // No necesitamos validar el arqueo aquí porque lo hacemos en el servicio
            const egreso = await this.egresoService.create(egresoData);
            res.status(201).json({
                success: true,
                data: egreso,
                message: 'Egreso registrado exitosamente'
            });
        } catch (error: any) {
            console.error('Error al crear egreso:', error);
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
            const egresoData = req.body;
            
            // Validar que el egreso existe primero
            const existingEgreso = await this.egresoService.findById(id);
            if (!existingEgreso) {
                res.status(404).json({
                    success: false,
                    message: 'Egreso no encontrado'
                });
                return;
            }
            
            const updatedEgreso = await this.egresoService.update(id, egresoData);
            
            res.status(200).json({
                success: true,
                data: updatedEgreso,
                message: 'Egreso actualizado exitosamente'
            });
        } catch (error: any) {
            console.error('Error al actualizar egreso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar egreso',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

    getByArqueoId = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.arqueoId);
            const egresos = await this.egresoService.findByArqueoId(arqueoId);
            
            res.status(200).json({
                success: true,
                data: {
                    count: egresos.length,
                    total: egresos.reduce((sum, e) => sum + e.monto, 0),
                    items: egresos
                }
            });
        } catch (error: any) {
            console.error('Error al obtener egresos por arqueo:', error);
            const status = error.message.includes('no encontrado') ? 404 : 500;
            res.status(status).json({
                success: false,
                message: 'Error al obtener egresos por arqueo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    };

}