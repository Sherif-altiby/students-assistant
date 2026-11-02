import assert from 'node:assert/strict';
import test from 'node:test';
import { createLessonDateSchema } from '../../src/modules/lesson-date/lesson-date.schema';

const baseBody = {
  subject: 'رياضيات',
  teacher: 'أحمد',
  startTime: '10:00',
  endTime: '11:00',
};

test('lesson-date creation accepts multiple weekdays and legacy single weekday', () => {
  const multiple = createLessonDateSchema.parse({
    body: { ...baseBody, dayNames: ['الأحد', 'الثلاثاء'] },
  });
  assert.deepEqual(multiple.body.dayNames, ['الأحد', 'الثلاثاء']);

  const legacy = createLessonDateSchema.parse({
    body: { ...baseBody, dayName: 'الأحد' },
  });
  assert.equal(legacy.body.dayName, 'الأحد');
});

test('lesson-date creation rejects missing, duplicate, or ambiguous weekdays', () => {
  assert.throws(() => createLessonDateSchema.parse({ body: baseBody }));
  assert.throws(() => createLessonDateSchema.parse({
    body: { ...baseBody, dayNames: ['الأحد', 'الأحد'] },
  }));
  assert.throws(() => createLessonDateSchema.parse({
    body: { ...baseBody, dayName: 'الأحد', dayNames: ['الثلاثاء'] },
  }));
});

test('lesson-date creation rejects invalid time ranges', () => {
  assert.throws(() => createLessonDateSchema.parse({
    body: { ...baseBody, dayNames: ['الأحد'], startTime: '11:00', endTime: '10:00' },
  }));
});
