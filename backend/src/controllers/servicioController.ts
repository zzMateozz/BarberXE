import { Request, Response } from 'express';
import { ServicioService } from '../services/servicioService';
import { CreateServicioDto } from '../dtos/Servicio/CreateServicio.dto';
import { UpdateServicioDto } from '../dtos/Servicio/UpdateServicio.dto';
import path from 'path';
import * as fs from 'fs';

export class ServicioController {
    private servicioService: ServicioService;

    constructor() {
        this.servicioService = new ServicioService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const servicios = await this.servicioService.findAll();
            res.status(200).json(servicios);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener servicios', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const servicio = await this.servicioService.findById(id);
            
            if (!servicio) {
                res.status(404).json({ message: 'Servicio no encontrado' });
                return;
            }
            
            res.status(200).json(servicio);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener servicio', error });
        }
    };

    getByNombre = async (req: Request, res: Response): Promise<void> => {
        try {
            const nombre = req.params.nombre;
            const servicios = await this.servicioService.findByNombre(nombre);
            res.status(200).json(servicios);
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar servicios por nombre', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log("Body recibido:", req.body);
            console.log("Archivo recibido:", req.file);

            if (!req.body.nombre || !req.body.precio || !req.body.duracion) {
                throw new Error('Nombre, precio y duración son requeridos');
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

            const servicioData = new CreateServicioDto({
                nombre: req.body.nombre,
                precio: parseFloat(req.body.precio),
                duracion: parseInt(req.body.duracion),
                estado: req.body.estado || 'activo',
                imagenUrl: imagenUrl,
                corteIds: req.body.corteIds ? JSON.parse(req.body.corteIds) : []
            });

            const servicio = await this.servicioService.create(servicioData);
            res.status(201).json(servicio);
        } catch (error: any) {
            console.error('Error en create:', error);
            res.status(500).json({
                message: 'Error al crear servicio',
                error: error.message
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            // Preparar los datos de actualización
            const updates: any = {
                nombre: req.body.nombre,
                precio: req.body.precio ? parseFloat(req.body.precio) : undefined,
                duracion: req.body.duracion ? parseInt(req.body.duracion) : undefined,
                estado: req.body.estado,
                corteIds: req.body.corteIds ? JSON.parse(req.body.corteIds) : undefined
            };
            
            // Si hay una nueva imagen, actualizar la URL
            if (req.file) {
                updates.imagenUrl = `/uploads/${req.file.filename}`;
            }
            
            const servicioData = new UpdateServicioDto(updates);
            const servicio = await this.servicioService.update(id, servicioData);
            
            res.status(200).json(servicio);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes('Cortes no encontrados')) {
                res.status(400).json({ message: error.message });
            } else {
                console.error('Error en update:', error);
                res.status(500).json({ 
                    message: 'Error al actualizar servicio',
                    error: error.message 
                });
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.servicioService.delete(id);
            res.status(204).send();
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Error al eliminar servicio', error });
            }
        }
    };
}