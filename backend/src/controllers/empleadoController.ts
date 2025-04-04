import { Request, Response } from 'express';
import { EmpleadoService } from '../services/empleadoService';
import { UpdateEmpleadoDto } from '../dtos/Empleado/UpdateEmpleado.dto';
import { CreateEmpleadoDto } from '../dtos/Empleado/CreateEmpleado.dto';

export class EmpleadoController {
    private empleadoService: EmpleadoService;

    constructor() {
        this.empleadoService = new EmpleadoService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findAll();
            res.status(200).json(empleados);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener empleados', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const empleado = await this.empleadoService.findById(id);
            
            if (!empleado) {
                res.status(404).json({ message: 'Empleado no encontrado' });
                return;
            }
            
            res.status(200).json(empleado);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener empleado', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoData = new CreateEmpleadoDto(req.body);
            const empleado = await this.empleadoService.create(empleadoData);
            res.status(201).json(empleado);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear empleado', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const empleadoData = new UpdateEmpleadoDto(req.body);
            const empleado = await this.empleadoService.update(id, empleadoData);
            res.status(200).json(empleado);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                res.status(404).json({ message: error.message });
            } else {
                res.status(500).json({ 
                    message: 'Error al actualizar empleado',
                    error: error.message 
                });
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.empleadoService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar empleado', error });
        }
    };

    getByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const nombre = req.query.nombre as string;
            const empleados = await this.empleadoService.findByName(nombre);
            res.status(200).json(empleados);
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar empleados por nombre', error });
        }
    };

    getWithCitas = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findWithCitas();
            res.status(200).json(empleados);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener empleados con citas', error });
        }
    };

    getWithArqueos = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findWithArqueos();
            res.status(200).json(empleados);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener empleados con arqueos', error });
        }
    };
}