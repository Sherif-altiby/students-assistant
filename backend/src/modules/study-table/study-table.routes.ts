import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { validate } from '../../middlewares/validate';
import { studyTableController } from './study-table.controller';
import {
  createStudyTableSchema,
  getStudyTableSchema,
  deleteStudyTableSchema,
  completeLessonSchema,
  updateStudyTableSchema,
  addDayContentSchema,
  updateDayContentSchema,
} from './study-table.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ----------------------------------------------------------------------
// 1. Create a new study table
//    Body: { title, type: 'DATE_RANGE'|'NUMBER_OF_DAYS', startDate?, endDate?, numberOfDays? }
//    Generates StudyDay records automatically based on the type.
//    Returns the created table with its days.
router.post('/', validate(createStudyTableSchema), studyTableController.create);

// ----------------------------------------------------------------------
// 2. Get all study tables for the authenticated user
//    Returns a list of tables (without nested days).
router.get('/', studyTableController.getAll);

// ----------------------------------------------------------------------
// 3. Get a single study table by ID (with full nested structure: days → subjects → chapters → lessons → completions)
//    URL param: id (UUID)
router.get('/:id', validate(getStudyTableSchema), studyTableController.getOne);

// ----------------------------------------------------------------------
// 4. Delete a study table (cascade deletes all related days, subjects, chapters, lessons, completions)
//    URL param: id (UUID)
router.delete('/:id', validate(deleteStudyTableSchema), studyTableController.delete);

// ----------------------------------------------------------------------
// 5. Mark a specific lesson as completed for the authenticated user
//    URL param: lessonId (UUID)
//    Creates a StudyLessonCompletion record. Each lesson can be completed only once per user.
router.post('/lessons/:lessonId/complete', validate(completeLessonSchema), studyTableController.completeLesson);

// ----------------------------------------------------------------------
// 6. Update the title of an existing study table
//    URL param: id (UUID)
//    Body: { title: string }
router.patch('/:id', validate(updateStudyTableSchema), studyTableController.updateTitle);

// ----------------------------------------------------------------------
// 7. Add new subjects (with chapters and lessons) to a specific day
//    URL param: dayId (UUID of StudyDay)
//    Body: { subjects: [ { title, chapters: [ { title, lessons: [ { title } ] } ] } ] }
//    This endpoint appends content; existing content remains untouched.
router.post('/days/:dayId/subjects', validate(addDayContentSchema), studyTableController.addDayContent);

// ----------------------------------------------------------------------
// 8. Replace all content (subjects, chapters, lessons) of a specific day
//    URL param: dayId (UUID of StudyDay)
//    Body: same structure as above
//    Deletes all existing subjects for the day and recreates them with the new data.
router.put('/days/:dayId/subjects', validate(updateDayContentSchema), studyTableController.replaceDayContent);

// 9. Generate PDF for a study table
//    URL param: id (UUID)
//    Returns a PDF file download
router.get('/:id/pdf', validate(getStudyTableSchema), studyTableController.generatePDF);

export { router as studyTableRouter };