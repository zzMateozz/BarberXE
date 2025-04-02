import { Request, Response } from 'express';
import { CorteService } from '../services/corteService';

export class CorteController {
    private corteService: CorteService;

    constructor() {
        this.corteService = new CorteService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const cortes = await this.corteService.findAll();
            res.status(200).json(cortes);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener cortes', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const corte = await this.corteService.findById(id);
            
            if (!corte) {
                res.status(404).json({ message: 'Corte no encontrado' });
                return;
            }
            
            res.status(200).json(corte);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener corte', error });
        }
    };

    getByEstilo = async (req: Request, res: Response): Promise<void> => {
        try {
            const estilo = req.params.estilo;
            const cortes = await this.corteService.findByEstilo(estilo);
            res.status(200).json(cortes);
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar cortes por estilo', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const corteData = req.body;
            const corte = await this.corteService.create(corteData);
            res.status(201).json(corte);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear corte', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const corteData = req.body;
            
            const corte = await this.corteService.update(id, corteData);
            
            if (!corte) {
                res.status(404).json({ message: 'Corte no encontrado' });
                return;
            }
            
            res.status(200).json(corte);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar corte', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.corteService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar corte', error });
        }
    };
}