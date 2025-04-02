import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserDto } from '../dtos/User/CreateUser.dto';
import { LoginUserDto } from '../dtos/User/LoginUser.dto';

export class UserController {
    private userService: UserService;

    constructor() {
        console.log('UserController está siendo instanciado');
        this.userService = new UserService();
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const users = await this.userService.findAll();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener usuarios', error });
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const user = await this.userService.findById(id);
            
            if (!user) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }
            
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener usuario', error });
        }
    };

    getByUsername = async (req: Request, res: Response): Promise<void> => {
        try {
            const username = req.params.username;
            const user = await this.userService.findByUsername(username);
            
            if (!user) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }
            
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error al buscar usuario por nombre de usuario', error });
        }
    };

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const userData = new CreateUserDto(req.body);
            const user = await this.userService.create(userData);
            res.status(201).json(user);
        } catch (error: any) {
            console.error('Error detallado:', error);
            res.status(400).json({
                message: 'Error al crear usuario',
                error: error.message
            });
        }
    }

    login = async (req: Request, res: Response): Promise<void> => {
        try {
            const loginData = new LoginUserDto(req.body);
            const user = await this.userService.login(loginData);
            
            if (!user) {
                res.status(401).json({ message: 'Credenciales inválidas' });
                return;
            }
            
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error al iniciar sesión', error });
        }
    };

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const userData = req.body;
            
            const user = await this.userService.update(id, userData);
            
            if (!user) {
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }
            
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar usuario', error });
        }
    };

    delete = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            await this.userService.delete(id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error al eliminar usuario', error });
        }
    };
}