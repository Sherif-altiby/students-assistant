import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { suggestionController } from './suggestion.controller';
import { createSuggestionSchema, listSuggestionsSchema } from './suggestion.schema';

const router = Router();

router.use(authenticate);
router.post(
  '/',
  authorize('USER', 'PARENT'),
  validate(createSuggestionSchema),
  suggestionController.create
);
router.get('/', authorize('ADMIN'), validate(listSuggestionsSchema), suggestionController.list);

export { router as suggestionRouter };
