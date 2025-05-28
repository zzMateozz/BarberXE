import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';

const router = Router();
const userController = new UserController();
const authMiddleware = new AuthMiddleware();

// Rutas públicas (sin autenticación)
router.post('/', (req, res, next) => userController.create(req, res).catch(next));
router.post('/login', (req, res, next) => userController.login(req, res).catch(next));


// Aplicar autenticación JWT a las rutas protegidas
router.use(authMiddleware.passAuth('jwt'));

// Rutas protegidas
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    (req, res, next) => userController.getAll(req, res).catch(next)
);

router.get('/:id', 
    authMiddleware.checkOwnerOrAdmin,
    (req, res, next) => userController.getById(req, res).catch(next)
);

router.get('/username/:username', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    (req, res, next) => userController.getByUsername(req, res).catch(next)
);

router.get('/:userId/client',
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    (req, res, next) => userController.getClientByUserId(req, res).catch(next)
);

router.put('/:id', 
    authMiddleware.checkOwnerOrAdmin,
    (req, res, next) => userController.update(req, res).catch(next)
);

router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    (req, res, next) => userController.delete(req, res).catch(next)
);

export default router;