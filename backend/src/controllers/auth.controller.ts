import { Request, Response } from 'express';
import { HttpResponse } from '../shared/response/http.response';
import { AuthService } from '../services/auth.service';
import { User } from '../entity/user';
import { PayloadToken } from '../types/auth.types';

export class AuthController {
    private authService: AuthService;
    private httpResponse: HttpResponse;

    constructor() {
        this.authService = new AuthService();
        this.httpResponse = new HttpResponse();
    }

    /**
     * Login endpoint
     */
    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.user as User;
            
            if (!user) {
            this.httpResponse.Unauthorized(res, 'Credenciales inválidas');
            return;
            }

            const authResponse = await this.authService.generateJwt(user);
            
            // Return the exact structure frontend expects
            this.httpResponse.OK(res, {
            token: authResponse.accessToken,
            user: {
                username: authResponse.user.usuario,
                id: user.idUser,
                email: user.usuario
            },
            role: authResponse.user.role
            });
        } catch (error) {
            console.error('Error in login:', error);
            this.httpResponse.Error(res, 'Error interno del servidor');
        }
    };

    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) throw new Error('Token no proporcionado');

            await this.authService.addToBlacklist(token);
            this.httpResponse.OK(res, { message: 'Sesión cerrada exitosamente' });
        } catch (error) {
            console.error('Error en logout:', error);
            this.httpResponse.Error(res, (error as Error).message);
        }
    };

    /**
     * Endpoint para verificar el token actual
     */
    public verifyToken = async (req: Request, res: Response): Promise<void> => {
        // Usar tipo PayloadToken
        const payload = req.user as PayloadToken;
        
        this.httpResponse.OK(res, {
            message: 'Token válido',
            payload: {
                sub: payload.sub,
                role: payload.role,
                username: payload.username
            }
        });
    }

    /**
     * Endpoint para obtener información del usuario actual
     */
    public getCurrentUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const payload = req.user as PayloadToken; // Tipo explícito
            const userId = parseInt(payload.sub);
            
            const user = await this.authService['userService'].findById(userId);
            
            if (!user) {
                this.httpResponse.NotFound(res, 'Usuario no encontrado');
                return;
            }

            const { contraseña, ...safeUser } = user;
            this.httpResponse.OK(res, { ...safeUser, role: payload.role });
        } catch (error) {
            console.error('Error getting current user:', error);
            this.httpResponse.Error(res, 'Error interno del servidor');
        }
    };
}