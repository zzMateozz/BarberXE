import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { RoleType, PayloadToken } from '../types/auth.types';
import { HttpResponse } from '../shared/response/http.response';
import { AuthService } from '../services/auth.service';


export class AuthMiddleware {
    private httpResponse: HttpResponse;
    private authService: AuthService;

    constructor() {
        this.httpResponse = new HttpResponse();
        this.authService = new AuthService();
    }

    

    /**
     * Middleware de autenticación usando Passport
     */
    passAuth(type: string) {
        return async (req: Request, res: Response, next: NextFunction) => {
            passport.authenticate(type, { session: false }, async (
                err: Error | null,
                user: PayloadToken | false,
                _info: { message?: string }
            ) => {
                if (err) return next(err);
                if (!user) return this.httpResponse.Unauthorized(res, 'Token inválido');

                // Verificar blacklist
                const token = req.headers.authorization?.split(' ')[1];
                if (token && await this.authService.isTokenBlacklisted(token)) {
                    return this.httpResponse.Unauthorized(res, 'Token inválido');
                }

                req.user = user; // user es de tipo PayloadToken
                next();
            })(req, res, next);
        };
    }
    /**
     * Middleware para verificar que el usuario esté autenticado
     * Debe ejecutarse después del middleware de autenticación
     */
    private checkAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
            return;
        }
        next();
    };

    /**
     * Middleware para verificar rol de administrador
     */
    checkAdminRole = (req: Request, res: Response, next: NextFunction): void => {
        // Primero verificar si está autenticado
        if (!req.user) {
            this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
            return;
        }

        const payload = req.user as PayloadToken;

        if (!payload.role) {
            this.httpResponse.Forbidden(res, 'Rol no definido');
            return;
        }

        if (payload.role !== RoleType.ADMIN) {
            this.httpResponse.Forbidden(res, 'No tienes permisos de administrador');
            return;
        }

        next();
    };

    /**
     * Middleware para verificar rol de empleado
     */
    checkEmpleadoRole = (req: Request, res: Response, next: NextFunction): void => {
        // Primero verificar si está autenticado
        if (!req.user) {
            this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
            return;
        }

        const payload = req.user as PayloadToken;

        if (!payload.role) {
            this.httpResponse.Forbidden(res, 'Rol no definido');
            return;
        }

        if (payload.role !== RoleType.EMPLEADO && payload.role !== RoleType.ADMIN) {
            this.httpResponse.Forbidden(res, 'No tienes permisos de empleado');
            return;
        }

        next();
    };

    /**
     * Middleware para verificar que solo el usuario propietario o admin puede acceder
     */
    checkOwnerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
        // Primero verificar si está autenticado
        if (!req.user) {
            this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
            return;
        }

        const payload = req.user as PayloadToken;
        const userId = req.params.id;

        if (!payload.role || !payload.sub) {
            this.httpResponse.Forbidden(res, 'Datos de usuario incompletos');
            return;
        }

        // Admin puede acceder a todo
        if (payload.role === RoleType.ADMIN) {
            next();
            return;
        }

        // El usuario solo puede acceder a sus propios datos
        if (payload.sub === userId) {
            next();
            return;
        }

        this.httpResponse.Forbidden(res, 'No puedes acceder a datos de otro usuario');
    };

    /**
     * Middleware para verificar múltiples roles
     */
    checkRoles = (allowedRoles: RoleType[]) => {
        return (req: Request, res: Response, next: NextFunction): void => {
            // Primero verificar si está autenticado
            if (!req.user) {
                this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
                return;
            }
            
            const payload = req.user as PayloadToken;

            if (!payload.role) {
                this.httpResponse.Forbidden(res, 'Rol no definido');
                return;
            }

            if (!allowedRoles.includes(payload.role)) {
                this.httpResponse.Forbidden(res, 'No tienes los permisos necesarios');
                return;
            }

            next();
        };
    };

    /**
     * Middleware completo de autenticación y autorización
     * Combina autenticación JWT y verificación de roles
     */
    requireAuth = (allowedRoles?: RoleType[]) => {
        return [
            this.passAuth('jwt'),
            (req: Request, res: Response, next: NextFunction) =>{ // Tipos explícitos
                if (!req.user) {
                    this.httpResponse.Unauthorized(res, 'Usuario no autenticado');
                    return;
                }

                if (allowedRoles?.length) {
                    const payload = req.user as PayloadToken;
                    if (!allowedRoles.includes(payload.role)) {
                        this.httpResponse.Forbidden(res, 'Permisos insuficientes');
                        return;
                    }
                }

                next();
            }
        ];
    };
}