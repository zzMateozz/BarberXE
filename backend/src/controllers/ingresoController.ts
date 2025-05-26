import { Request, Response } from 'express';
import { IngresoService } from '../services/ingresoService';
import { CreateIngresoDto } from '../dtos/Ingreso/CreateIngreso.dto';
import { ArqueoCajaService } from '../services/ArqueoCajaService';
import { HttpResponse } from '../shared/response/http.response';

export class IngresoController {
    private ingresoService: IngresoService;
    private arqueoCajaService: ArqueoCajaService;
    private httpResponse: HttpResponse;

    constructor() {
        this.ingresoService = new IngresoService();
        this.arqueoCajaService = new ArqueoCajaService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresos = await this.ingresoService.findAll();
            this.httpResponse.OK(res, {
                data: ingresos,
                count: ingresos.length
            });
        } catch (error: any) {
            this.httpResponse.Error(res, 'Error al obtener ingresos');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingreso = await this.ingresoService.findById(id);
            
            if (!ingreso) {
                this.httpResponse.NotFound(res, 'Ingreso no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, ingreso);
        } catch (error: any) {
            this.httpResponse.Error(res, 'Error al obtener ingreso');
        }
    };

    getByArqueoId = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.arqueoId);
            const ingresos = await this.ingresoService.findByArqueoId(arqueoId);
            
            this.httpResponse.OK(res, {
                count: ingresos.length,
                total: ingresos.reduce((sum, i) => sum + i.monto, 0),
                items: ingresos
            });
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al obtener ingresos por arqueo');
            }
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const ingresoData = new CreateIngresoDto(req.body);
            const ingreso = await this.ingresoService.create(ingresoData);
            this.httpResponse.Created(res, ingreso);
        } catch (error: any) {
            console.error('Error al crear ingreso:', error);
            
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else if (error.message.includes('cerrado') || error.message.includes('requeridos')) {
                this.httpResponse.BadRequest(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al crear ingreso');
            }
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const ingresoData = req.body;
            
            const existingIngreso = await this.ingresoService.findById(id);
            if (!existingIngreso) {
                this.httpResponse.NotFound(res, 'Ingreso no encontrado');
                return;
            }
            
            const updatedIngreso = await this.ingresoService.update(id, ingresoData);
            this.httpResponse.OK(res, updatedIngreso);
        } catch (error: any) {
            this.httpResponse.Error(res, 'Error al actualizar ingreso');
        }
    };
}