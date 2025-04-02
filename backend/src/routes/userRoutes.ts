import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.get('/username/:username', userController.getByUsername);
router.post('/', userController.create);
router.post('/login', userController.login);
router.put('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;