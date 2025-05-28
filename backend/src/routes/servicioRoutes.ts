import { Router } from 'express';
import { ServicioController } from '../controllers/servicioController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';
import { upload } from '../middleware/upload';

const router = Router();
const servicioController = new ServicioController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Ver catálogo de servicios - Todos pueden ver
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    servicioController.getAll
);

router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    servicioController.getById
);

router.get('/nombre/:nombre', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    servicioController.getByNombre
);

// Solo admin puede gestionar servicios
router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    upload,
    servicioController.create
);

router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    upload,
    servicioController.update
);

router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    servicioController.delete
);

export default router;