// src/modules/books/book.routes.ts
import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { bookController } from './book.controller';
import {
  bookIdSchema,
  chatSchema,
  conversationMessagesSchema,
  listBooksSchema,
  requestUploadSchema,
} from './book.validation';

export const bookRouter = Router();

bookRouter.use(authenticate);

bookRouter.get('/', validate(listBooksSchema), bookController.list);
bookRouter.post('/upload-url', validate(requestUploadSchema), bookController.requestUpload);
bookRouter.get('/:id', validate(bookIdSchema), bookController.getOne);
bookRouter.post('/:id/complete', validate(bookIdSchema), bookController.completeUpload);
bookRouter.delete('/:id', validate(bookIdSchema), bookController.remove);
bookRouter.post('/:id/chat', validate(chatSchema), bookController.chat);
bookRouter.get('/:id/conversations', validate(bookIdSchema), bookController.listConversations);
bookRouter.get(
  '/:id/conversations/:conversationId/messages',
  validate(conversationMessagesSchema),
  bookController.listMessages
);