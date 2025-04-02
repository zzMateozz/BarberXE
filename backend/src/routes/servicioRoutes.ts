import { Router } from 'express';
import { ServicioController } from '../controllers/servicioController';

const router = Router();
const servicioController = new ServicioController();

router.get('/', servicioController.getAll);
router.get('/:id', servicioController.getById);
router.get('/nombre/:nombre', servicioController.getByNombre);
router.post('/', servicioController.create);
router.put('/:id', servicioController.update);
router.delete('/:id', servicioController.delete);

export default router;