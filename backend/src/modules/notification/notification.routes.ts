import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { notificationController } from './notification.controller';
import { z } from 'zod';

const router = Router();
export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }).strict(),
  body: z.object({}).strict().optional(),
  query: z.object({}).strict().optional(),
}).strict();
export const listNotificationsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }).strict(),
  body: z.object({}).strict().optional(),
  params: z.object({}).strict().optional(),
}).strict();
router.use(authenticate);
router.get('/unread-count', notificationController.unreadCount);
router.get('/', validate(listNotificationsSchema), notificationController.list);
router.post('/read-all', notificationController.markAllRead);
router.patch('/:id/read', validate(notificationIdSchema), notificationController.markRead);
router.delete('/:id', validate(notificationIdSchema), notificationController.delete);

export { router as notificationRouter };
