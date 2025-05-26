import { Request, Response } from 'express';
import { EgresoService } from '../services/egresoService';
import { CreateEgresoDto } from '../dtos/Egreso/CreateEgreso.dto';
import { ArqueoCajaService } from '../services/ArqueoCajaService';
import { HttpResponse } from '../shared/response/http.response';

export class EgresoController {
    private egresoService: EgresoService;
    private arqueoCajaService: ArqueoCajaService;
    private httpResponse: HttpResponse;

    constructor() {
        this.egresoService = new EgresoService();
        this.arqueoCajaService = new ArqueoCajaService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresos = await this.egresoService.findAll();
            this.httpResponse.OK(res, {
                data: egresos,
                count: egresos.length
            });
        } catch (error: any) {
            console.error('Error al obtener egresos:', error);
            this.httpResponse.Error(res, 'Error al obtener egresos');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const egreso = await this.egresoService.findById(id);
            
            if (!egreso) {
                this.httpResponse.NotFound(res, 'Egreso no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, egreso);
        } catch (error: any) {
            this.httpResponse.Error(res, 'Error al obtener egreso');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const egresoData = new CreateEgresoDto(req.body);
            const egreso = await this.egresoService.create(egresoData);
            this.httpResponse.Created(res, egreso);
        } catch (error: any) {
            console.error('Error al crear egreso:', error);
            
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else if (error.message.includes('cerrado') || error.message.includes('requeridos')) {
                this.httpResponse.BadRequest(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al crear egreso');
            }
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const egresoData = req.body;
            
            const existingEgreso = await this.egresoService.findById(id);
            if (!existingEgreso) {
                this.httpResponse.NotFound(res, 'Egreso no encontrado');
                return;
            }
            
            const updatedEgreso = await this.egresoService.update(id, egresoData);
            this.httpResponse.OK(res, updatedEgreso);
        } catch (error: any) {
            console.error('Error al actualizar egreso:', error);
            this.httpResponse.Error(res, 'Error al actualizar egreso');
        }
    };

    getByArqueoId = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.arqueoId);
            const egresos = await this.egresoService.findByArqueoId(arqueoId);
            
            this.httpResponse.OK(res, {
                count: egresos.length,
                total: egresos.reduce((sum, e) => sum + e.monto, 0),
                items: egresos
            });
        } catch (error: any) {
            console.error('Error al obtener egresos por arqueo:', error);
            
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al obtener egresos por arqueo');
            }
        }
    };
}