import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { RoleType } from '../types/auth.types';
import { EmpleadoController } from '../controllers/empleadoController';
import { uploadProfile } from '../middleware/upload';

const router = Router();
const authMiddleware = new AuthMiddleware();
const empleadoController = new EmpleadoController();

router.use(authMiddleware.passAuth('jwt'));

router.get('/',
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO, RoleType.CLIENTE]),
    empleadoController.getAll
    );

router.get('/with-citas',
    authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getWithCitas
    );

    router.get('/with-arqueos', authMiddleware.checkRoles([RoleType.ADMIN, RoleType.EMPLEADO]),
    empleadoController.getWithArqueos);

router.get('/search', authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getByName);

router.get('/:id', authMiddleware.checkRoles([RoleType.ADMIN, RoleType.CLIENTE]),
    empleadoController.getById);

router.post('/', authMiddleware.checkRoles([RoleType.ADMIN]),uploadProfile,
    empleadoController.create);

router.put('/:id', authMiddleware.checkRoles([RoleType.ADMIN]),uploadProfile,
    empleadoController.update);

router.delete('/:id', authMiddleware.checkRoles([RoleType.ADMIN]),uploadProfile,
    empleadoController.delete);



/*router.get('/', empleadoController.getAll);
router.get('/with-citas', empleadoController.getWithCitas);
router.get('/with-arqueos', empleadoController.getWithArqueos);
router.get('/search', empleadoController.getByName);
router.get('/:id', empleadoController.getById);
router.post('/', uploadProfile, empleadoController.create);
router.put('/:id', uploadProfile, empleadoController.update);
router.delete('/:id', empleadoController.delete);*/

export default router;