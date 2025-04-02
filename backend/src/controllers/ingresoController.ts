import { Request, Response } from 'express';
import { IngresoService } from '../services/ingresoService';

export class IngresoController {
    private ingresoService: IngresoService;

    constructor() {
        this.ingresoService = new IngresoService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresos = await this.ingresoService.findAll();
            res.status(200).json(ingresos);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener ingresos', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingreso = await this.ingresoService.findById(id);
            
            if (!ingreso) {
                res.status(404).json({ message: 'Ingreso no encontrado' });
                return;
            }
            
            res.status(200).json(ingreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener ingreso', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresoData = req.body;
            const ingreso = await this.ingresoService.create(ingresoData);
            res.status(201).json(ingreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear ingreso', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingresoData = req.body;
            
            const ingreso = await this.ingresoService.update(id, ingresoData);
            
            if (!ingreso) {
                res.status(404).json({ message: 'Ingreso no encontrado' });
                return;
            }
            
            res.status(200).json(ingreso);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar ingreso', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.ingresoService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar ingreso', error });
        }
    };
}