import { Request, Response } from 'express';
import { EmpleadoService } from '../services/empleadoService';
import { UpdateEmpleadoDto } from '../dtos/Empleado/UpdateEmpleado.dto';
import { CreateEmpleadoDto } from '../dtos/Empleado/CreateEmpleado.dto';
import { HttpResponse } from '../shared/response/http.response';

export class EmpleadoController {
    private empleadoService: EmpleadoService;
    private httpResponse: HttpResponse;

    constructor() {
        this.empleadoService = new EmpleadoService();
        this.httpResponse = new HttpResponse();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findAll();
            
            const empleadosConImagen = empleados.map(empleado => ({
                ...empleado,
                imagenPerfil: empleado.imagenPerfil 
                    ? `${req.protocol}://${req.get('host')}${empleado.imagenPerfil}`
                    : null
            }));
            
            this.httpResponse.OK(res, empleadosConImagen);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener empleados');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const empleado = await this.empleadoService.findById(id);
            
            if (!empleado) {
                this.httpResponse.NotFound(res, 'Empleado no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, empleado);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener empleado');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoData = new CreateEmpleadoDto({
                ...req.body,
                imagenPerfil: req.file ? `/uploads/profiles/${req.file.filename}` : undefined
            });
            
            const empleado = await this.empleadoService.create(empleadoData);
            this.httpResponse.Created(res, empleado);
        } catch (error) {
            this.httpResponse.Error(res, error instanceof Error ? error.message : 'Error al crear empleado');
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const empleadoData = new UpdateEmpleadoDto({
                ...req.body,
                imagenPerfil: req.file ? `/uploads/profiles/${req.file.filename}` : undefined
            });

            const empleado = await this.empleadoService.update(id, empleadoData);
            this.httpResponse.OK(res, empleado);
        } catch (error: any) {
            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, error.message);
            } else {
                this.httpResponse.Error(res, 'Error al actualizar empleado');
            }
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.empleadoService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al eliminar empleado');
        }
    };

    getByName = async (req: Request, res: Response): Promise<void> => {
        try {
            const nombre = req.query.nombre as string;
            const empleados = await this.empleadoService.findByName(nombre);
            this.httpResponse.OK(res, empleados);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al buscar empleados por nombre');
        }
    };

    getWithCitas = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findWithCitas();
            this.httpResponse.OK(res, empleados);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener empleados con citas');
        }
    };

    getWithArqueos = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleados = await this.empleadoService.findWithArqueos();
            this.httpResponse.OK(res, empleados);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener empleados con arqueos');
        }
    };
}