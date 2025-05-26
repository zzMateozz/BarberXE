import { Request, Response } from 'express';
import { CorteService } from '../services/corteService';
import { CreateCorteDto } from '../dtos/Corte/CreateCorter.dto';
import * as fs from 'fs';
import { UpdateCorteDto } from '../dtos/Corte/UpdateCorte.dto';
import path from 'path';
import { HttpResponse } from '../shared/response/http.response';

export class CorteController {
    private corteService: CorteService;
    private httpResponse: HttpResponse;

    constructor() {
        this.corteService = new CorteService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const cortes = await this.corteService.findAll();
            this.httpResponse.OK(res, cortes);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener cortes');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const corte = await this.corteService.findById(id);
            
            if (!corte) {
                this.httpResponse.NotFound(res, 'Corte no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, corte);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener corte');
        }
    };

    getByEstilo = async (req: Request, res: Response): Promise<void> => {
        try {
            const estilo = req.params.estilo;
            const cortes = await this.corteService.findByEstilo(estilo);
            this.httpResponse.OK(res, cortes);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al buscar cortes por estilo');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            console.log("Body recibido:", req.body);
            console.log("Archivo recibido:", req.file);

            if (!req.body.estilo) {
                this.httpResponse.BadRequest(res, 'El campo estilo es requerido');
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

            const corteData = new CreateCorteDto({
                estilo: req.body.estilo,
                imagenUrl: imagenUrl
            });

            const corte = await this.corteService.create(corteData);
            this.httpResponse.Created(res, corte);
        } catch (error: any) {
            console.error('Error en create:', error);
            this.httpResponse.Error(res, error.message || 'Error al crear corte');
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            
            const updates: any = {
                estilo: req.body.estilo
            };
            
            if (req.file) {
                updates.imagenUrl = `/uploads/${req.file.filename}`;
            }
            
            const corteData = new UpdateCorteDto(updates);
            const corte = await this.corteService.update(id, corteData);
            
            this.httpResponse.OK(res, corte);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                console.error('Error en update:', error);
                this.httpResponse.Error(res, 'Error al actualizar Corte');
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.corteService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                console.error('Error en delete:', error);
                this.httpResponse.Error(res, 'Error al eliminar corte');
            }
        }
    };
}