import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { UserService } from '../services/userService';
import { CreateUserDto } from '../dtos/User/CreateUser.dto';
import { LoginUserDto } from '../dtos/User/LoginUser.dto';
import { UpdateUserDto } from '../dtos/User/UpdateUser.dto';
import { HttpResponse } from '../shared/response/http.response'; // Asegúrate de tener esto
import { AuthService } from '../services/auth.service';
import { ClienteRepository } from '../repository/ClienteRepository';
import { UserRepository } from '../repository/UserRepository';


export class UserController {
    private userService: UserService;
    private httpResponse: HttpResponse;


    constructor() {
        this.userService = new UserService(AppDataSource);
        this.httpResponse = new HttpResponse();
    }

    

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userService.findAll();
            this.httpResponse.OK(res, users);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener usuarios');
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const user = await this.userService.findById(id);
            
            if (!user) {
                this.httpResponse.NotFound(res, 'Usuario no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, user);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al obtener usuario');
        }
    };

    getByUsername = async (req: Request, res: Response): Promise<void> => {
        try {
            const username = req.params.username;
            const user = await this.userService.findByUsername(username);
            
            if (!user) {
                this.httpResponse.NotFound(res, 'Usuario no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, user);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al buscar usuario');
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const userData = new CreateUserDto(req.body);
            const user = await this.userService.create(userData);
            this.httpResponse.Created(res, user);
        } catch (error: any) {
            this.httpResponse.BadRequest(res, error.message);
        }
    };

    

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const loginData = new LoginUserDto(req.body);
            const user = await this.userService.login(loginData);
            
            if (!user) {
                this.httpResponse.Unauthorized(res, 'Credenciales inválidas');
                return;
            }

            // Generate JWT token
            const authService = new AuthService();
            const authResponse = await authService.generateJwt(user);

            // Return the structure frontend expects
            this.httpResponse.OK(res, {
                token: authResponse.accessToken,
                user: {
                    username: user.usuario,
                    ...user
                },
                role: authResponse.user.role
            });
        } catch (error) {
            this.httpResponse.Error(res, 'Error en el login');
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const userData = new UpdateUserDto(req.body);
            
            const user = await this.userService.update(id, userData);
            
            if (!user) {
                this.httpResponse.NotFound(res, 'Usuario no encontrado');
                return;
            }
            
            this.httpResponse.OK(res, user);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al actualizar');
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.userService.delete(id);
            this.httpResponse.NoContent(res);
        } catch (error) {
            this.httpResponse.Error(res, 'Error al eliminar');
        }
    };
getClientByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId);
        
        // Usar QueryBuilder para forzar el JOIN correcto
        const user = await UserRepository.createQueryBuilder("user")
            .leftJoinAndSelect("user.cliente", "cliente") // Forzar relación
            .where("user.idUser = :userId", { userId })
            .getOne();

        if (!user?.cliente) {
            this.httpResponse.NotFound(res, 'Cliente no encontrado');
            return;
        }

        // Respuesta estructurada
        this.httpResponse.OK(res, {
            idCliente: user.cliente.idCliente, // Asegurar que existe
            nombre: user.cliente.nombre,
            apellido: user.cliente.apellido,
            telefono: user.cliente.telefono,
            userId: userId
        });
    } catch (error) {
        this.httpResponse.Error(res, 'Error al obtener cliente');
    }
}
}