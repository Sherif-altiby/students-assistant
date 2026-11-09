import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStudyTableSchema,
  daySessionsSchema,
  generateStudyTableSchema,
  listStudyTablesSchema,
} from '../../src/modules/study-table/study-table.schema';

test('study-table list validation accepts the shared middleware request shape', () => {
  const parsed = listStudyTablesSchema.parse({
    body: {},
    params: {},
    query: { page: '1', limit: '10' },
  });
  assert.deepEqual(parsed.query, { page: 1, limit: 10 });
});

test('study-table create validation accepts shared middleware query and params', () => {
  const parsed = createStudyTableSchema.parse({
    body: {
      title: 'خطة أسبوعية',
      type: 'WEEKLY',
      startDate: '2026-11-02',
      subjects: 'ALL',
    },
    query: {},
    params: {},
  });

  assert.equal(parsed.body.type, 'WEEKLY');
});

test('study-table generate validation accepts shared middleware params with preview query', () => {
  const parsed = generateStudyTableSchema.parse({
    body: {
      title: 'خطة أسبوعية',
      type: 'WEEKLY',
      startDate: '2026-11-02',
      subjects: ['214dbc54-539d-4c8d-b754-4834bec8281f'],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6] },
    },
    params: {},
    query: { preview: 'true' },
  });

  assert.equal(parsed.query.preview, 'true');
  assert.equal(parsed.body.schedule.maxSessionsPerDay, 3);
});

test('study-table create and generate accept explicit selected lessons', () => {
  const selectedLessonIds = [
    '214dbc54-539d-4c8d-b754-4834bec8281f',
    'f65e4768-df60-43ce-8664-2908f84f4376',
  ];
  const body = {
    title: 'خطة مخصصة',
    type: 'WEEKLY' as const,
    startDate: '2026-11-02',
    subjects: ['214dbc54-539d-4c8d-b754-4834bec8281f'],
    selectedLessonIds,
  };

  assert.deepEqual(
    createStudyTableSchema.parse({ body, query: {}, params: {} }).body.selectedLessonIds,
    selectedLessonIds
  );
  assert.deepEqual(
    generateStudyTableSchema.parse({
      body: { ...body, schedule: { studyWeekdays: [1, 3] } },
      query: {},
      params: {},
    }).body.selectedLessonIds,
    selectedLessonIds
  );
});

test('study-table selected lessons must be unique and non-empty', () => {
  const base = {
    title: 'خطة مخصصة',
    type: 'WEEKLY',
    startDate: '2026-11-02',
    subjects: ['214dbc54-539d-4c8d-b754-4834bec8281f'],
  };
  const duplicate = 'f65e4768-df60-43ce-8664-2908f84f4376';

  assert.equal(
    createStudyTableSchema.safeParse({
      body: { ...base, selectedLessonIds: [duplicate, duplicate] },
      query: {},
      params: {},
    }).success,
    false
  );
  assert.equal(
    createStudyTableSchema.safeParse({
      body: { ...base, selectedLessonIds: [] },
      query: {},
      params: {},
    }).success,
    false
  );
});

test('day session replacement accepts the shared middleware request shape', () => {
  const parsed = daySessionsSchema.parse({
    params: { dayId: '214dbc54-539d-4c8d-b754-4834bec8281f' },
    body: { sessions: [] },
    query: {},
  });

  assert.deepEqual(parsed.body.sessions, []);
});
