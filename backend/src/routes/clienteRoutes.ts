import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';

const router = Router();
const clienteController = new ClienteController();
const authMiddleware = new AuthMiddleware();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Ver clientes - Todos los roles pueden ver la información básica
router.get('/', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    clienteController.getAll
);

// Ver clientes con citas - Para empleados que necesitan ver historial
router.get('/with-citas', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    clienteController.getWithCitas
);

// Buscar cliente por nombre - Para empleados al agendar citas
router.get('/search', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    clienteController.getByName
);

// Ver cliente específico - Todos pueden ver
router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    clienteController.getById
);

// Solo admin puede crear nuevos registros de cliente
router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    clienteController.create
);

// Admin y el mismo cliente pueden actualizar datos
router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    clienteController.update
);

// Solo admin puede eliminar clientes
router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    clienteController.delete
);

export default router;