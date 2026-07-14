import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '../../middlewares/validate';
import { createUserSchema, getUserSchema, updateUserSchema } from './user.schema';

const router = Router();

router.post('/', validate(createUserSchema), userController.create);
router.get('/', userController.list);
router.get('/:id', validate(getUserSchema), userController.getById);
router.patch('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', validate(getUserSchema), userController.remove);

export { router as userRouter };
