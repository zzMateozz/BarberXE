import { Router } from 'express';
import { CorteController } from '../controllers/corteController';
import { upload } from '../middleware/upload';

const router = Router();
const corteController = new CorteController();

router.get('/', corteController.getAll);
router.get('/:id', corteController.getById);
router.get('/estilo/:estilo', corteController.getByEstilo);
router.post('/', upload, corteController.create);
router.put('/:id', upload, corteController.update);
router.delete('/:id', corteController.delete);

export default router;