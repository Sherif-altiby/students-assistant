import assert from 'node:assert/strict';
import test from 'node:test';
import { StudyTableType } from '@prisma/client';
import { generateStudySessions, groupGlobalPlan } from './study-table.generator';
import { getStudySessionStatus } from './study-table.status';
import { createStudyTableSchema, generateStudyTableSchema, parseMonth } from './study-table.schema';
import { GeneratorInput, GeneratorSubject } from './study-table.types';
import { groupLateSessions } from './study-lateness.cron';
import { getSessionCompletionUpdate, getUpdatedRange } from './study-table.service';

function makeSubject(id: string, lessonCount: number): GeneratorSubject {
  return {
    id,
    title: `Subject ${id}`,
    units: [{
      id: `unit-${id}`,
      title: 'Unit',
      order: 1,
      lessons: Array.from({ length: lessonCount }, (_, index) => ({
        id: `lesson-${id}-${index + 1}`,
        title: `Lesson ${index + 1}`,
        order: index + 1,
      })),
    }],
  };
}

function basicInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    type: StudyTableType.CUSTOM,
    startDate: '2026-01-05',
    endDate: '2026-01-09',
    subjects: [makeSubject('a', 7)],
    completedLessonIds: new Set(),
    schedule: { studyWeekdays: [1, 2, 3, 4, 5], maxSessionsPerDay: 3 },
    ...overrides,
  };
}

test('generator orders lessons by unit, then lesson order and id', () => {
  const subject = makeSubject('a', 1);
  subject.units = [
    { id: 'unit-b', title: 'Later unit', order: 2, lessons: [
      { id: 'z', title: 'Z', order: 1 },
    ] },
    { id: 'unit-a', title: 'First unit', order: 1, lessons: [
      { id: 'second', title: 'Second', order: 1 },
      { id: 'first', title: 'First', order: 1 },
    ] },
  ];
  const result = generateStudySessions(basicInput({
    subjects: [subject],
  }));
  assert.deepEqual(result.sessions.map(({ lessonId }) => lessonId), ['first', 'second', 'z']);
  assert.equal(result.unscheduledLessonsCount, 0);
});

test('empty catalogs report a NO_LESSONS suggestion and summary metadata', () => {
  const subject = makeSubject('empty', 0);
  const result = generateStudySessions(basicInput({ subjects: [subject] }));
  assert.equal(result.totalLessons, 0);
  assert.equal(result.selectedSubjectsCount, 1);
  assert.deepEqual(result.suggestions, [{
    code: 'NO_LESSONS',
    message: 'لا توجد دروس متاحة للجدولة',
  }]);
});

test('lesson totals include completed syllabus lessons while generated work excludes them', () => {
  const subject = makeSubject('completed', 2);
  const result = generateStudySessions(basicInput({
    subjects: [subject],
    completedLessonIds: new Set(['lesson-completed-1', 'lesson-completed-2']),
  }));
  assert.equal(result.totalLessons, 2);
  assert.equal(result.sessions.length, 0);
  assert.deepEqual(result.suggestions, []);
});

test('generation distributes subjects round-robin and lessons across study days', () => {
  const result = generateStudySessions(basicInput({
    subjects: [makeSubject('a', 4), makeSubject('b', 4)],
  }));
  assert.deepEqual(result.sessions.slice(0, 4).map(({ subjectId }) => subjectId), [
    'a', 'b', 'a', 'b',
  ]);
  const sessionsPerDay = new Map<string, number>();
  for (const session of result.sessions) {
    sessionsPerDay.set(session.date, (sessionsPerDay.get(session.date) ?? 0) + 1);
  }
  assert.equal(sessionsPerDay.size, 5);
  assert.ok([...sessionsPerDay.values()].every((count) => count <= 2));
});

test('maxSessionsPerDay caps scheduled work and reports capacity suggestions', () => {
  const result = generateStudySessions(basicInput({
    endDate: '2026-01-07',
    schedule: { studyWeekdays: [1, 2, 3], maxSessionsPerDay: 1 },
  }));
  assert.equal(result.capacity, 3);
  assert.equal(result.sessions.length, 3);
  assert.equal(result.unscheduledLessonsCount, 4);
  assert.equal(result.suggestions.length, 3);
  assert.ok(result.sessions.every(({ order }) => order === 0));
});

test('GLOBAL preview planning reports insufficient capacity without dropping metadata', () => {
  const result = generateStudySessions(basicInput({
    type: StudyTableType.GLOBAL,
    startDate: '2026-01-05',
    endDate: '2026-01-05',
    subjects: [makeSubject('a', 5)],
    schedule: { studyWeekdays: [1], maxSessionsPerDay: 2 },
  }));
  assert.equal(result.capacity, 2);
  assert.equal(result.sessions.length, 2);
  assert.equal(result.unscheduledLessonsCount, 3);
  assert.deepEqual(result.suggestions.map(({ code }) => code), [
    'INCREASE_DAILY_CAPACITY',
    'ADD_STUDY_DAYS',
    'EXTEND_DATE_RANGE',
  ]);
});

test('GLOBAL distributes subjects and groups the result into month-week-day sessions', () => {
  const result = generateStudySessions(basicInput({
    type: StudyTableType.GLOBAL,
    startDate: '2026-01-01',
    endDate: '2026-01-04',
    subjects: [makeSubject('a', 2), makeSubject('b', 2)],
    schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 1 },
  }));
  assert.equal(result.unscheduledLessonsCount, 0);
  assert.deepEqual(result.sessions.map(({ subjectId }) => subjectId), ['a', 'b', 'a', 'b']);
  const months = groupGlobalPlan('2026-01-01', '2026-01-04', result.sessions);
  assert.equal(months.length, 1);
  assert.equal(months[0]!.weeks.flatMap(({ days }) => days).length, 4);
  assert.equal(months[0]!.weeks[0]!.days[0]!.sessions.length, 1);
});

test('weekly input needs only one date and unknown input fields are rejected', () => {
  const parsed = createStudyTableSchema.parse({
    body: {
      title: 'Weekly plan',
      type: 'WEEKLY',
      startDate: '2026-01-05',
      subjects: 'ALL',
    },
  });
  assert.equal(parsed.body.type, 'WEEKLY');
  assert.throws(() => createStudyTableSchema.parse({
    body: {
      title: 'Invalid weekly plan',
      type: 'WEEKLY',
      startDate: '2026-01-05',
      endDate: '2026-01-11',
      subjects: 'ALL',
    },
  }));
});

test('month names parse in English and Arabic and leap-month inputs are accepted', () => {
  assert.equal(parseMonth('January'), 1);
  assert.equal(parseMonth('Feb'), 2);
  assert.equal(parseMonth('يناير'), 1);
  assert.equal(parseMonth(12), 12);
  const parsed = createStudyTableSchema.parse({
    body: {
      title: 'February plan',
      type: 'MONTHLY',
      month: 'February',
      year: 2024,
      subjects: 'ALL',
    },
  });
  assert.equal(parsed.body.type, 'MONTHLY');
  assert.throws(() => createStudyTableSchema.parse({
    body: { title: 'Invalid', type: 'MONTHLY', month: 'not-a-month', subjects: 'ALL' },
  }));
});

test('schedule defaults daily capacity and rejects time-based fields', () => {
  const parsed = generateStudyTableSchema.parse({
    body: {
      title: 'Monthly',
      type: 'MONTHLY',
      month: 'يناير',
      year: 2026,
      subjects: 'ALL',
      schedule: { studyWeekdays: [1, 2] },
    },
    query: { preview: 'true' },
  });
  assert.equal(parsed.body.schedule.maxSessionsPerDay, 3);
  assert.throws(() => generateStudyTableSchema.parse({
    body: {
      title: 'Monthly',
      type: 'MONTHLY',
      month: 1,
      subjects: 'ALL',
      schedule: { studyWeekdays: [1], unsupportedOption: true },
    },
    query: {},
  }));
});

test('session status uses the local calendar date in the user timezone', () => {
  const now = new Date('2026-03-01T02:00:00.000Z');
  assert.equal(getStudySessionStatus({}, '2026-02-27', 'America/New_York', now), 'LATE');
  assert.equal(getStudySessionStatus({}, '2026-02-28', 'America/New_York', now), 'IN_PROGRESS');
  assert.equal(getStudySessionStatus({}, '2026-03-01', 'America/New_York', now), 'UPCOMING');
  assert.equal(
    getStudySessionStatus({ completedAt: now }, '2026-02-27', 'America/New_York', now),
    'COMPLETED',
  );
});

test('updating a weekly start date recomputes the seven-day range', () => {
  const updated = getUpdatedRange(
    StudyTableType.WEEKLY,
    { startDate: '2026-01-05', endDate: '2026-01-11' },
    { startDate: '2026-03-01' },
    'UTC',
  );
  assert.deepEqual(updated, { startDate: '2026-03-01', endDate: '2026-03-07' });
});

test('updating a monthly table handles leap-year month lengths', () => {
  const updated = getUpdatedRange(
    StudyTableType.MONTHLY,
    { startDate: '2024-01-01', endDate: '2024-01-31', month: 1, year: 2024 },
    { month: 2 },
    'UTC',
  );
  assert.deepEqual(updated, {
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    month: 2,
    year: 2024,
  });
});

test('uncompleting a session clears completion and the late-notification marker', () => {
  const completion = getSessionCompletionUpdate(
    false,
    new Date('2026-02-27T12:00:00.000Z'),
    new Date('2026-03-01T12:00:00.000Z'),
  );
  assert.deepEqual(completion, { completedAt: null, lateNotifiedAt: null });
});

test('late scan groups notices by user/table/local date with session details', () => {
  const notices = groupLateSessions([{
    id: 'session-late',
    userId: 'user-1',
    studyTableId: 'table-1',
    dayId: 'day-1',
    completedAt: null,
    lateNotifiedAt: null,
    day: { date: new Date('2026-02-27T00:00:00.000Z') },
    subject: { title: 'الرياضيات' },
    lesson: { title: 'المعادلات', unit: { title: 'الجبر' } },
    studyTable: { title: 'جدول فبراير' },
    user: { timezone: 'America/Los_Angeles' },
  }], new Date('2026-03-01T01:00:00.000Z'));

  assert.equal(notices.length, 1);
  assert.equal(notices[0]!.localDate, '2026-02-28');
  assert.deepEqual(notices[0]!.sessions, [{
    id: 'session-late',
    date: '2026-02-27',
    subject: 'الرياضيات',
    unit: 'الجبر',
    lesson: 'المعادلات',
  }]);
});
