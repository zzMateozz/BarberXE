import { Router } from 'express';
import { ArqueoCajaController } from '../controllers/arqueoCajaController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';

const router = Router();
const controller = new ArqueoCajaController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// CRUD básico - Solo ADMIN y EMPLEADO pueden manejar arqueos
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

// Operaciones específicas - Solo empleados pueden cerrar sus arqueos
router.post('/:id/close', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.close
);

router.get('/empleados/:empleadoId', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getByEmpleado
);

router.get('/empleados/:empleadoId/abierto', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getOpenByEmpleado
);

// Gestión de movimientos - Solo empleados pueden añadir ingresos/egresos
router.post('/:id/ingresos', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.addIncome
);

router.post('/:id/egresos', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.addExpense
);

router.get('/:id/ingresos', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getIncomesByArqueo
);

router.get('/:id/egresos', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    controller.getExpensesByArqueo
);

export default router;