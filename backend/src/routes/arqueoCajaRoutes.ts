import { Router } from 'express';
import { ArqueoCajaController } from '../controllers/arqueoCajaController';

const router = Router();
const arqueoCajaController = new ArqueoCajaController();

router.get('/', arqueoCajaController.getAll);
router.get('/:id', arqueoCajaController.getById);
router.get('/empleado/:empleadoId', arqueoCajaController.getByEmpleado);
router.post('/', arqueoCajaController.create);
router.post('/:id/close', arqueoCajaController.close);
router.put('/:id', arqueoCajaController.update);
router.delete('/:id', arqueoCajaController.delete);

export default router;