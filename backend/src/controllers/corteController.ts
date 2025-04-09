import { Request, Response } from 'express';
import { CorteService } from '../services/corteService';
import { CreateCorteDto } from '../dtos/Corte/CreateCorter.dto';
import * as fs from 'fs';
import { UpdateCorteDto } from '../dtos/Corte/UpdateCorte.dto';
import path from 'path';

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
            console.log("Body recibido:", req.body);
            console.log("Archivo recibido:", req.file);
    
            if (!req.body.estilo) {
                throw new Error('El campo estilo es requerido');
            }
    
            // Verifica que el archivo se recibió correctamente
            if (!req.file) {
                throw new Error('No se recibió ningún archivo de imagen');
            }
    
            const imagenUrl = `/uploads/${req.file.filename}`;
            
            // Verifica que el archivo existe físicamente
            const filePath = path.join(__dirname, '../../', imagenUrl);
            if (!fs.existsSync(filePath)) {
                throw new Error('El archivo no se guardó correctamente en el servidor');
            }
    
            const corteData = new CreateCorteDto({
                estilo: req.body.estilo,
                imagenUrl: imagenUrl // Asegúrate de incluir la URL
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
            
            // Preparar los datos de actualización (sin servicioIds)
            const updates: any = {
                estilo: req.body.estilo
            };
            
            // Si hay una nueva imagen, actualizar la URL
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
                console.error('Error en update:', error);
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
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else {
                console.error('Error en delete:', error);
                res.status(500).json({ 
                    message: 'Error al eliminar corte', 
                    error: error.message 
                });
            }
        }
    };
}