import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSubjectSchema,
  listSubjectsSchema,
  reorderLessonsSchema,
  reorderUnitsSchema,
  updateLessonSchema,
} from '../../src/modules/subject/subject.schema';
import { createUserSchema } from '../../src/modules/user/user.schema';

const subjectId = 'c0a80123-4567-489a-8abc-123456789abc';
const unitId = 'c0a80123-4567-489a-8abc-123456789abd';
const lessonId = 'c0a80123-4567-489a-8abc-123456789abe';

test('subject list validates pagination and Express request fields', () => {
  const parsed = listSubjectsSchema.parse({
    query: { page: '2', limit: '25' },
    body: {},
    params: {},
  });
  assert.deepEqual(parsed.query, { page: 2, limit: 25 });
});

test('subject creation accepts nested units and lessons with strict object fields', () => {
  const parsed = createSubjectSchema.parse({
    body: {
      title: 'الرياضيات',
      units: [{
        title: 'الجبر',
        lessons: [{ title: 'المعادلات' }, { title: 'المتباينات' }],
      }],
    },
    query: {},
    params: {},
  });
  assert.equal(parsed.body.units?.[0]?.lessons?.[0]?.title, 'المعادلات');
  assert.equal(parsed.body.units?.[0]?.lessons?.[1]?.title, 'المتباينات');
  assert.throws(() => createSubjectSchema.parse({
    body: { title: 'مادة', chapters: [] },
    query: {},
    params: {},
  }));
  assert.throws(() => createSubjectSchema.parse({
    body: {
      title: 'مادة',
      units: [{ title: 'وحدة', parentId: subjectId }],
    },
    query: {},
    params: {},
  }));
});

test('student registration no longer requires education level or track', () => {
  const parsed = createUserSchema.parse({
    body: {
      name: 'طالب',
      email: 'student@example.com',
      password: 'password123',
      gender: 'MALE',
      parentPhone: '01012345678',
      phone: '01012345679',
      country: 'مصر',
    },
  });
  assert.equal(parsed.body.name, 'طالب');
  assert.equal('level' in parsed.body, false);
  assert.equal('track' in parsed.body, false);
});

test('lesson moves accept unitId and reject legacy parentId', () => {
  const parsed = updateLessonSchema.parse({
    params: { id: lessonId },
    body: { unitId },
    query: {},
  });
  assert.equal(parsed.body.unitId, unitId);
  assert.throws(() => updateLessonSchema.parse({
    params: { id: lessonId },
    body: { parentId: unitId },
    query: {},
  }));
});

test('unit and lesson ordering reject duplicate identifiers', () => {
  assert.throws(() => reorderUnitsSchema.parse({
    params: { id: subjectId },
    body: { unitIds: [unitId, unitId] },
    query: {},
  }));
  assert.throws(() => reorderLessonsSchema.parse({
    params: { id: unitId },
    body: { lessonIds: [lessonId, lessonId] },
    query: {},
  }));
});
