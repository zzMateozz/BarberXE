import { Request, Response } from 'express';
import { CitaService } from '../services/citaService';

export class CitaController {
    private citaService: CitaService;

    constructor() {
        this.citaService = new CitaService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const citas = await this.citaService.findAll();
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const cita = await this.citaService.findById(id);
            
            if (!cita) {
                res.status(404).json({ message: 'Cita no encontrada' });
                return;
            }
            
            res.status(200).json(cita);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener cita', error });
        }
    };

    getByCliente = async (req: Request, res: Response): Promise<void> => {
        try {
            const clienteId = parseInt(req.params.clienteId);
            const citas = await this.citaService.findByCliente(clienteId);
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas por cliente', error });
        }
    };

    getByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const citas = await this.citaService.findByEmpleado(empleadoId);
            res.status(200).json(citas);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener citas por empleado', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const citaData = req.body;
            const cita = await this.citaService.create(citaData);
            res.status(201).json(cita);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear cita', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const citaData = req.body;
            
            const cita = await this.citaService.update(id, citaData);
            
            if (!cita) {
                res.status(404).json({ message: 'Cita no encontrada' });
                return;
            }
            
            res.status(200).json(cita);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar cita', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.citaService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar cita', error });
        }
    };
}