import { Request, Response } from 'express';
import { ServicioService } from '../services/servicioService';
import { CreateServicioDto } from '../dtos/Servicio/CreateServicio.dto';
import { UpdateServicioDto } from '../dtos/Servicio/UpdateServicio.dto';

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
            res.status(500).json({ message: 'Error al obtener empleados', error });
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
            const servicioData = new CreateServicioDto(req.body);
            const servicio = await this.servicioService.create(servicioData);
            res.status(201).json(servicio);
        } catch (error: any) {
            res.status(400).json({
                message: 'Error al crear servicio',
                error: error.message
            });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const servicioData = new UpdateServicioDto(req.body);
            const servicio = await this.servicioService.update(id, servicioData);
            res.status(200).json(servicio);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes('Cortes no encontrados')) {
                res.status(400).json({ message: error.message });
            } else {
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