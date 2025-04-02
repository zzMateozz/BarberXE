import { Router } from 'express';
import { IngresoController } from '../controllers/ingresoController';

const router = Router();
const ingresoController = new IngresoController();

router.get('/', ingresoController.getAll);
router.get('/:id', ingresoController.getById);
router.post('/', ingresoController.create);
router.put('/:id', ingresoController.update);
router.delete('/:id', ingresoController.delete);

export default router;