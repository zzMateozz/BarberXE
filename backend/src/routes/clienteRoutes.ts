import { Router } from 'express';
import { ClienteController } from '../controllers/clienteController';

const router = Router();
const clienteController = new ClienteController();

router.get('/', clienteController.getAll);
router.get('/with-citas', clienteController.getWithCitas);
router.get('/search', clienteController.getByName);
router.get('/:id', clienteController.getById);
router.post('/', clienteController.create);
router.put('/:id', clienteController.update);
router.delete('/:id', clienteController.delete);

export default router;