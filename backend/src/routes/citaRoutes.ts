import { Router } from 'express';
import { CitaController } from '../controllers/citaController';

const router = Router();
const citaController = new CitaController();

router.get('/', citaController.getAll);
router.get('/:id', citaController.getById);
router.get('/cliente/:clienteId', citaController.getByCliente);
router.get('/empleado/:empleadoId', citaController.getByEmpleado);
router.get('/reportes/por-fecha', citaController.getCitasPorFecha);
router.post('/', citaController.create);
router.put('/:id', citaController.update);
router.delete('/:id', citaController.delete);
router.post('/disponibilidad', citaController.checkDisponibilidad);

export default router;