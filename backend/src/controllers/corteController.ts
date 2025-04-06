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
            console.log("Body recibido:", req.body); // Debería mostrar { estilo: 'valor' }
            console.log("Archivo recibido:", req.file); // Debería mostrar info del archivo
    
            if (!req.body.estilo) {
                throw new Error('El campo estilo es requerido');
            }
    
            const imagenUrl = req.file 
                ? `/uploads/${req.file.filename}` 
                : '';
    
            const corteData = new CreateCorteDto({
                estilo: req.body.estilo, // Asegúrate de tomar el estilo del body
                imagenUrl,
                servicioIds: req.body.servicioIds || []
            });
    
            const corte = await this.corteService.create(corteData);
            res.status(201).json(corte);
        } catch (error: any) {
            console.error('Error en create:', error);
            res.status(500).json({
                message: 'Error al crear corte',
                error: error.message
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Si hay una nueva imagen, obtener su URL
            const updates: any = {...req.body};
            if (req.file) {
                updates.imagenUrl = `/uploads/${req.file.filename}`;
            }
            
            const corteData = new UpdateCorteDto(updates);
            const corte = await this.corteService.update(id, corteData);
            res.status(200).json(corte);
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