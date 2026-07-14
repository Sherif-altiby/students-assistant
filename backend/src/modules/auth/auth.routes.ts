import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export { router as authRouter };