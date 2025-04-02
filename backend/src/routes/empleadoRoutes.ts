import { Router } from 'express';
import { EmpleadoController } from '../controllers/empleadoController';

const router = Router();
const empleadoController = new EmpleadoController();

router.get('/', empleadoController.getAll);
router.get('/with-citas', empleadoController.getWithCitas);
router.get('/with-arqueos', empleadoController.getWithArqueos);
router.get('/search', empleadoController.getByName);
router.get('/:id', empleadoController.getById);
router.post('/', empleadoController.create);
router.put('/:id', empleadoController.update);
router.delete('/:id', empleadoController.delete);

export default router;