import { Request, Response } from 'express';
import { EgresoService } from '../services/egresoService';

export class EgresoController {
    private egresoService: EgresoService;

    constructor() {
        this.egresoService = new EgresoService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresos = await this.egresoService.findAll();
            res.status(200).json(egresos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener egresos', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const egreso = await this.egresoService.findById(id);
            
            if (!egreso) {
                res.status(404).json({ message: 'Egreso no encontrado' });
                return;
            }
            
            res.status(200).json(egreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener Egreso', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresoData = req.body;
            const egreso = await this.egresoService.create(egresoData);
            res.status(201).json(egreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear egreso', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const egresoData = req.body;
            
            const egreso = await this.egresoService.update(id, egresoData);
            
            if (!egreso) {
                res.status(404).json({ message: 'Egreso no encontrado' });
                return;
            }
            
            res.status(200).json(egreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar egreso', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.egresoService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar egreso', error });
        }
    };
}