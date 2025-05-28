import { Router } from 'express';
import { CitaController } from '../controllers/citaController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';

const router = Router();
const citaController = new CitaController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Ver todas las citas - ADMIN y EMPLEADO pueden ver todas, CLIENTE solo las suyas
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    citaController.getAll
);

router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    citaController.getById
);

// Clientes pueden ver sus propias citas
router.get('/cliente/:clienteId', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    citaController.getByCliente
);

// Empleados pueden ver sus citas asignadas
router.get('/empleado/:empleadoId', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    citaController.getByEmpleado
);

// Reportes solo para ADMIN y EMPLEADO
router.get('/reportes/por-fecha', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    citaController.getCitasPorFecha
);

// Clientes pueden crear citas, empleados y admin también
router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    citaController.create
);

// Solo empleados y admin pueden modificar citas
router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    citaController.update
);

// Solo admin puede eliminar citas
router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    citaController.delete
);

export default router;