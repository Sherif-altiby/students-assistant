import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStudyTableSchema,
  daySessionsSchema,
  generateStudyTableSchema,
  listStudyTablesSchema,
} from './study-table.schema';

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

test('day session replacement accepts the shared middleware request shape', () => {
  const parsed = daySessionsSchema.parse({
    params: { dayId: '214dbc54-539d-4c8d-b754-4834bec8281f' },
    body: { sessions: [] },
    query: {},
  });

  assert.deepEqual(parsed.body.sessions, []);
});
