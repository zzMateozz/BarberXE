import { Router } from 'express';
import { EgresoController } from '../controllers/egresoController';

const router = Router();
const egresoController = new EgresoController();

router.get('/', egresoController.getAll);
router.get('/:id', egresoController.getById);
router.post('/', egresoController.create);
router.put('/:id', egresoController.update);
router.delete('/:id', egresoController.delete);

export default router;