import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';
import { EmpleadoController } from '../controllers/empleadoController';
import { uploadProfile } from '../middleware/upload';

const router = Router();
const authMiddleware = new AuthMiddleware();
const empleadoController = new EmpleadoController();

// Aplicar autenticación JWT a todas las rutas
router.use(authMiddleware.passAuth('jwt'));

// Rutas GET (solo lectura)
router.get('/',
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    empleadoController.getAll
);

router.get('/with-citas',
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getWithCitas
);

router.get('/with-arqueos', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    empleadoController.getWithArqueos
);

router.get('/search', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getByName
);

// IMPORTANTE: Esta ruta debe ir al final de las rutas GET para evitar conflictos
router.get('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getById
);

// Rutas de modificación (CREATE, UPDATE, DELETE)
router.post('/', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    uploadProfile, // Middleware para manejar archivos
    empleadoController.create
);

router.put('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    uploadProfile, // Middleware para manejar archivos
    empleadoController.update
);

// DELETE no necesita uploadProfile
router.delete('/:id', 
    authMiddleware.checkRoles([RoleType.ADMIN]),
    empleadoController.delete
);

export default router;