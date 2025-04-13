import { Router } from 'express';
import { ServicioController } from '../controllers/servicioController';
import { upload } from '../middleware/upload';

const router = Router();
const servicioController = new ServicioController();

router.get('/', servicioController.getAll);
router.get('/:id', servicioController.getById);
router.get('/nombre/:nombre', servicioController.getByNombre);
router.post('/', upload, servicioController.create);
router.put('/:id', upload, servicioController.update); 
router.delete('/:id', servicioController.delete);

export default router;