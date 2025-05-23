import { Router } from 'express';
import { EmpleadoController } from '../controllers/empleadoController';
import { uploadProfile } from '../middleware/upload';

const router = Router();
const empleadoController = new EmpleadoController();

router.get('/', empleadoController.getAll);
router.get('/with-citas', empleadoController.getWithCitas);
router.get('/with-arqueos', empleadoController.getWithArqueos);
router.get('/search', empleadoController.getByName);
router.get('/:id', empleadoController.getById);
router.post('/', uploadProfile, empleadoController.create);
router.put('/:id', uploadProfile, empleadoController.update);
router.delete('/:id', empleadoController.delete);

export default router;