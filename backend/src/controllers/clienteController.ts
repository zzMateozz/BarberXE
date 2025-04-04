import { Request, Response } from 'express';
import { ClienteService } from '../services/clienteService';

export class ClienteController {
    private clienteService: ClienteService;

    constructor() {
        this.clienteService = new ClienteService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
        const clientes = await this.clienteService.findAll();
        res.status(200).json(clientes);
        } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
        const id = parseInt(req.params.id);
        const cliente = await this.clienteService.findById(id);
        
        if (!cliente) {
            res.status(404).json({ message: 'Cliente no encontrado' });
            return;
        }
        
        res.status(200).json(cliente);
        } catch (error) {
        res.status(500).json({ message: 'Error al obtener cliente', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
        const clienteData = req.body;
        const cliente = await this.clienteService.create(clienteData);
        res.status(201).json(cliente);
        } catch (error) {
        res.status(500).json({ message: 'Error al crear cliente', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
        const id = parseInt(req.params.id);
        const clienteData = req.body;
        
        const cliente = await this.clienteService.update(id, clienteData);
        
        if (!cliente) {
            res.status(404).json({ message: 'Cliente no encontrado' });
            return;
        }
        
        res.status(200).json(cliente);
        } catch (error) {
        res.status(500).json({ message: 'Error al actualizar cliente', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.clienteService.delete(id);
            res.status(204).send();
        } catch (error: any) {
            console.error('Error en ClienteController.delete:', error);
            
            const statusCode = error.message.includes('no encontrado') ? 404 : 500;
            
            res.status(statusCode).json({
                message: 'Error al eliminar cliente',
                error: process.env.NODE_ENV === 'development' 
                    ? error.message 
                    : 'Ocurrió un error al eliminar el cliente'
            });
        }
    };

    getByName = async (req: Request, res: Response): Promise<void> => {
        try {
        const nombre = req.query.nombre as string;
        const clientes = await this.clienteService.findByName(nombre);
        res.status(200).json(clientes);
        } catch (error) {
        res.status(500).json({ message: 'Error al buscar clientes por nombre', error });
        }
    };

    getWithCitas = async (req: Request, res: Response): Promise<void> => {
        try {
        const clientes = await this.clienteService.findWithCitas();
        res.status(200).json(clientes);
        } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes con citas', error });
        }
    };
}
