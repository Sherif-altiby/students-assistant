import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { createUserSchema, getUserSchema, updateUserSchema, inviteDoctorSchema, acceptInvitationSchema, } from './user.schema';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// --- Public ---
// router.post('/', validate(createUserSchema), userController.create);
// Token itself is the credential (single-use, time-limited) — no `authenticate` here.
router.post('/accept-invitation', validate(acceptInvitationSchema), userController.acceptInvitation);

// --- Protected ---
router.get('/', authenticate, authorize('ADMIN'), userController.list);
router.get('/doctors', authenticate, authorize('USER'), userController.listDoctors);
// router.get('/:id', authenticate, validate(getUserSchema), userController.getById);
// router.patch('/:id', authenticate, validate(updateUserSchema), userController.update);
// router.delete('/:id', authenticate, validate(getUserSchema), userController.remove);

// --- Admin only ---
router.post( '/doctors/invite', authenticate, authorize('ADMIN'), validate(inviteDoctorSchema), userController.inviteDoctor);

export { router as userRouter };