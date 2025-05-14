import { Router } from 'express';
import { IngresoController } from '../controllers/ingresoController';

const router = Router();
const controller = new IngresoController();

// Rutas básicas
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.get('/arqueo/:arqueoId', controller.getByArqueoId);


export default router;