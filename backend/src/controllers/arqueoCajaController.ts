import { Request, Response } from 'express';
import { ArqueoCajaService } from '../services/ArqueoCajaService';

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
            const arqueo = await this.arqueoCajaService.findById(id);
            
            if (!arqueo) {
                res.status(404).json({ message: 'Arqueo de caja no encontrado' });
                return;
            }
            
            res.status(200).json(arqueo);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener arqueo de caja', error });
        }
    };

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
            const arqueoData = req.body;
            const arqueo = await this.arqueoCajaService.create(arqueoData);
            res.status(201).json(arqueo);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear arqueo de caja', error });
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
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar arqueo de caja', error });
        }
    };
}