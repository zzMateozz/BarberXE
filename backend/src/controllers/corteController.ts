import { Request, Response } from 'express';
import { CorteService } from '../services/corteService';
import { CreateCorteDto } from '../dtos/Corte/CreateCorter.dto';
import { UpdateCitaDto } from '../dtos/Cita/UpdateCita.dto';
import { UpdateCorteDto } from '../dtos/Corte/UpdateCorte.dto';

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
            const corteData = new CreateCorteDto(req.body);
            const corte = await this.corteService.create(corteData);
            res.status(201).json(corte);
        } catch (error: any) {
            console.error('Error detallado:', error); // Log para depuración
            res.status(500).json({
                message: 'Error al crear corte',
                error: error.message || 'Error desconocido' // Asegurar mensaje
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
            try {
                const id = parseInt(req.params.id);
                const corteData = new UpdateCorteDto(req.body);
                const empleado = await this.corteService.update(id, corteData);
                res.status(200).json(empleado);
            } catch (error: any) {
                if (error.message.includes('no encontrado')) {
                    res.status(404).json({ message: error.message });
                } else {
                    res.status(500).json({ 
                        message: 'Error al actualizar Corte',
                        error: error.message 
                    });
                }
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