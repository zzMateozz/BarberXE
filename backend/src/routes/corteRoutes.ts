import { Router } from 'express';
import { CorteController } from '../controllers/corteController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';
import { upload } from '../middleware/upload';

const router = Router();
const corteController = new CorteController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Ver catálogo de cortes - Todos pueden ver
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    corteController.getAll
);

router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    corteController.getById
);

router.get('/estilo/:estilo', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    corteController.getByEstilo
);

// Solo admin puede gestionar el catálogo de cortes
router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    upload,
    corteController.create
);

router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    upload,
    corteController.update
);

router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    corteController.delete
);

export default router;