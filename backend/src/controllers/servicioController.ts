import { Request, Response } from 'express';
import { ServicioService } from '../services/servicioService';
import { CreateServicioDto } from '../dtos/Servicio/CreateServicio.dto';
import { UpdateServicioDto } from '../dtos/Servicio/UpdateServicio.dto';
import path from 'path';
import * as fs from 'fs';
import { HttpResponse } from '../shared/response/http.response';

export class ServicioController {
    private servicioService: ServicioService;
    private httpResponse: HttpResponse;

    constructor() {
        this.servicioService = new ServicioService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const servicios = await this.servicioService.findAll();
            this.httpResponse.OK(res, servicios);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener servicios');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const servicio = await this.servicioService.findById(id);
            
            if (!servicio) {
                this.httpResponse.NotFound(res, 'Servicio no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, servicio);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener servicio');
        }
    };

    getByNombre = async (req: Request, res: Response): Promise<void> => {
        try {
            const nombre = req.params.nombre;
            const servicios = await this.servicioService.findByNombre(nombre);
            this.httpResponse.OK(res, servicios);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al buscar servicios por nombre');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log("Body recibido:", req.body);
            console.log("Archivo recibido:", req.file);

            if (!req.body.nombre || !req.body.precio || !req.body.duracion) {
                this.httpResponse.BadRequest(res, 'Nombre, precio y duración son requeridos');
                return;
            }

            if (!req.file) {
                this.httpResponse.BadRequest(res, 'No se recibió ningún archivo de imagen');
                return;
            }

            const imagenUrl = `/uploads/${req.file.filename}`;
            
            const filePath = path.join(__dirname, '../../', imagenUrl);
            if (!fs.existsSync(filePath)) {
                this.httpResponse.Error(res, 'El archivo no se guardó correctamente en el servidor');
                return;
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
            this.httpResponse.Created(res, servicio);
        } catch (error: any) {
            console.error('Error en create:', error);
            this.httpResponse.Error(res, error.message || 'Error al crear servicio');
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            const updates: any = {
                nombre: req.body.nombre,
                precio: req.body.precio ? parseFloat(req.body.precio) : undefined,
                duracion: req.body.duracion ? parseInt(req.body.duracion) : undefined,
                estado: req.body.estado,
                corteIds: req.body.corteIds ? JSON.parse(req.body.corteIds) : undefined
            };
            
            if (req.file) {
                updates.imagenUrl = `/uploads/${req.file.filename}`;
            }
            
            const servicioData = new UpdateServicioDto(updates);
            const servicio = await this.servicioService.update(id, servicioData);
            
            this.httpResponse.OK(res, servicio);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else if (error.message.includes('Cortes no encontrados')) {
                this.httpResponse.BadRequest(res, error.message);
            } else {
                console.error('Error en update:', error);
                this.httpResponse.Error(res, 'Error al actualizar servicio');
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.servicioService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al eliminar servicio');
            }
        }
    };
}