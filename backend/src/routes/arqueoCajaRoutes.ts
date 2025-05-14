import { Router } from 'express';
import { ArqueoCajaController } from '../controllers/arqueoCajaController';

const router = Router();
const controller = new ArqueoCajaController();

// CRUD básico
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);

// Operaciones específicas
router.post('/:id/close', controller.close);
router.get('/empleados/:empleadoId', controller.getByEmpleado);
router.get('/empleados/:empleadoId/abierto', controller.getOpenByEmpleado);

// Gestión de movimientos
router.post('/:id/ingresos', controller.addIncome);
router.post('/:id/egresos', controller.addExpense);
router.get('/:id/ingresos', controller.getIncomesByArqueo);
router.get('/:id/egresos', controller.getExpensesByArqueo);

export default router;