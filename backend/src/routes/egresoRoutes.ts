import { Router } from 'express';
import { EgresoController } from '../controllers/egresoController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';

const router = Router();
const controller = new EgresoController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Rutas básicas - Solo ADMIN y EMPLEADO manejan egresos
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getAll
);

router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.create
);

router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getById
);

router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.update
);

router.get('/arqueo/:arqueoId', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getByArqueoId
);

export default router;