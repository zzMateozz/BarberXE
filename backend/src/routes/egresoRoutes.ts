import { Router } from 'express';
import { EgresoController } from '../controllers/egresoController';

const router = Router();
const controller = new EgresoController();

// Rutas básicas
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.get('/arqueo/:arqueoId', controller.getByArqueoId);

export default router;