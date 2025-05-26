import { Router,Request, Response, NextFunction } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

export class AuthRoutes {
    public router = Router();
    private authController = new AuthController();
    private authMiddleware = new AuthMiddleware();

    constructor() {
        this.initAuthRoutes();
    }

    /**
     * Inicializa las rutas de autenticación
     */
    private initAuthRoutes() {
        // Ruta de login
        this.router.post('/login', 
            this.authMiddleware.passAuth('login'), 
            (req, res, next) => this.authController.login(req, res).catch(next)
        );

        // Ruta para verificar token
        this.router.get('/verify', 
            this.authMiddleware.passAuth('jwt'), 
            (req, res, next) => this.authController.verifyToken(req, res).catch(next)
        );

        // Ruta para obtener usuario actual
        this.router.get('/me', 
            this.authMiddleware.passAuth('jwt'), 
            (req, res, next) => this.authController.getCurrentUser(req, res).catch(next)
        );

        this.router.post('/logout', 
            this.authMiddleware.requireAuth(),
            (req: Request, res: Response, next: NextFunction) => 
                this.authController.logout(req, res).catch(next)
        );
    }
}

export default new AuthRoutes().router;