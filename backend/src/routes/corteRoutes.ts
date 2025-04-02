import { Router } from 'express';
import { CorteController } from '../controllers/corteController';

const router = Router();
const corteController = new CorteController();

router.get('/', corteController.getAll);
router.get('/:id', corteController.getById);
router.get('/estilo/:estilo', corteController.getByEstilo);
router.post('/', corteController.create);
router.put('/:id', corteController.update);
router.delete('/:id', corteController.delete);

export default router;