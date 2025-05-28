import { Request, Response } from 'express';
import { ClienteService } from '../services/clienteService';
import { HttpResponse } from '../shared/response/http.response';

export class ClienteController {
    private clienteService: ClienteService;
    private httpResponse: HttpResponse;

    constructor() {
        this.clienteService = new ClienteService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const clientes = await this.clienteService.findAll();
            this.httpResponse.OK(res, clientes);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener clientes');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const cliente = await this.clienteService.findById(id);
            
            if (!cliente) {
                this.httpResponse.NotFound(res, 'Cliente no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, cliente);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener cliente');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const clienteData = req.body;
            const cliente = await this.clienteService.create(clienteData);
            this.httpResponse.Created(res, cliente);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al crear cliente');
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const clienteData = req.body;
            
            const cliente = await this.clienteService.update(id, clienteData);
            
            if (!cliente) {
                this.httpResponse.NotFound(res, 'Cliente no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, cliente);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al actualizar cliente');
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.clienteService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error: any) {
            console.error('Error en ClienteController.delete:', error);
            
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, 'Cliente no encontrado');
            } else {
                this.httpResponse.Error(res, 'Error al eliminar cliente');
            }
        }
    };

    getByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const nombre = req.query.nombre as string;
            const clientes = await this.clienteService.findByName(nombre);
            this.httpResponse.OK(res, clientes);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al buscar clientes por nombre');
        }
    };

    getWithCitas = async (req: Request, res: Response): Promise<void> => {
        try {
            const clientes = await this.clienteService.findWithCitas();
            this.httpResponse.OK(res, clientes);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener clientes con citas');
        }
    };
}