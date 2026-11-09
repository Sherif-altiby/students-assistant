import assert from 'node:assert/strict';
import test from 'node:test';
import { StudyTableType } from '@prisma/client';
import {
  filterCatalogByLessons,
  generateStudySessions,
  groupGlobalPlan,
} from '../../src/modules/study-table/study-table.generator';
import { getStudySessionStatus } from '../../src/modules/study-table/study-table.status';
import {
  availableMonthsSchema,
  createStudyTableSchema,
  generateStudyTableSchema,
  parseMonth,
} from '../../src/modules/study-table/study-table.schema';
import { GeneratorInput, GeneratorSubject } from '../../src/modules/study-table/study-table.types';
import { groupLateSessions } from '../../src/modules/study-table/study-lateness.cron';
import {
  getSessionCompletionUpdate,
  getUpdatedRange,
  getAvailableMonthRanges,
} from '../../src/modules/study-table/study-table.service';
import { localDateKey, monthlyRange } from '../../src/modules/study-table/date-time';
import { UnprocessableEntityError } from '../../src/utils/AppError';
import { getForgettableLessonIds } from '../../src/modules/study-table/study-table.completion';

function makeSubject(id: string, lessonCount: number): GeneratorSubject {
  return {
    id,
    title: `Subject ${id}`,
    units: [
      {
        id: `unit-${id}`,
        title: 'Unit',
        order: 1,
        lessons: Array.from({ length: lessonCount }, (_, index) => ({
          id: `lesson-${id}-${index + 1}`,
          title: `Lesson ${index + 1}`,
          order: index + 1,
        })),
      },
    ],
  };
}

function basicInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    startDate: '2026-01-05',
    endDate: '2026-01-09',
    subjects: [makeSubject('a', 7)],
    completedLessonIds: new Set(),
    schedule: { studyWeekdays: [1, 2, 3, 4, 5], maxSessionsPerDay: 3 },
    ...overrides,
  };
}

test('lesson scope keeps arbitrary lessons across subjects and units', () => {
  const firstSubject = makeSubject('a', 0);
  firstSubject.units = [
    { id: 'a1', title: 'Unit 1', order: 1, lessons: [{ id: 'a1-1', title: 'A1', order: 1 }] },
    {
      id: 'a2',
      title: 'Unit 2',
      order: 2,
      lessons: [
        { id: 'a2-1', title: 'A2-1', order: 1 },
        { id: 'a2-2', title: 'A2-2', order: 2 },
      ],
    },
  ];
  const secondSubject = makeSubject('b', 1);
  const filtered = filterCatalogByLessons([firstSubject, secondSubject], ['a2-2', 'lesson-b-1']);

  assert.deepEqual(
    filtered.map((subject) => ({
      id: subject.id,
      units: subject.units.map((unit) => ({
        id: unit.id,
        lessons: unit.lessons.map((lesson) => lesson.id),
      })),
    })),
    [
      { id: 'a', units: [{ id: 'a2', lessons: ['a2-2'] }] },
      { id: 'b', units: [{ id: 'unit-b', lessons: ['lesson-b-1'] }] },
    ]
  );
});

test('generator orders lessons by unit, then lesson order and id', () => {
  const subject = makeSubject('a', 1);
  subject.units = [
    { id: 'unit-b', title: 'Later unit', order: 2, lessons: [{ id: 'z', title: 'Z', order: 1 }] },
    {
      id: 'unit-a',
      title: 'First unit',
      order: 1,
      lessons: [
        { id: 'second', title: 'Second', order: 1 },
        { id: 'first', title: 'First', order: 1 },
      ],
    },
  ];
  const result = generateStudySessions(
    basicInput({
      subjects: [subject],
    })
  );
  assert.deepEqual(
    result.sessions.map(({ lessonId }) => lessonId),
    ['first', 'second', 'z']
  );
  assert.equal(result.unscheduledLessonsCount, 0);
});

test('completed lessons are skipped while unfinished lessons can still be scheduled', () => {
  const result = generateStudySessions(
    basicInput({
      subjects: [makeSubject('partial', 3)],
      completedLessonIds: new Set(['lesson-partial-2']),
    })
  );
  assert.equal(result.totalLessons, 3);
  assert.equal(result.scheduledCount, 2);
  assert.equal(result.skippedCompletedCount, 1);
  assert.deepEqual(
    result.sessions.map(({ lessonId }) => lessonId),
    ['lesson-partial-1', 'lesson-partial-3']
  );
});

test('shared completed lessons are retained while unreferenced completions are forgotten', () => {
  assert.deepEqual(getForgettableLessonIds(['shared', 'removed', 'shared'], ['shared']), [
    'removed',
  ]);
});

test('review fill reuses lessons to cover eligible days', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-05',
      endDate: '2026-01-09',
      subjects: [makeSubject('review', 2)],
      schedule: { studyWeekdays: [1, 2, 3, 4, 5], maxSessionsPerDay: 1 },
      fillAllDays: true,
    })
  );
  assert.equal(result.scheduledCount, 5);
  assert.equal(result.reviewCount, 3);
  assert.equal(new Set(result.sessions.map(({ date }) => date)).size, 5);
});

test('empty catalogs report a NO_LESSONS suggestion and summary metadata', () => {
  const subject = makeSubject('empty', 0);
  const result = generateStudySessions(basicInput({ subjects: [subject] }));
  assert.equal(result.totalLessons, 0);
  assert.equal(result.scheduledCount, 0);
  assert.equal(result.skippedCompletedCount, 0);
  assert.equal(result.selectedSubjectsCount, 1);
  assert.deepEqual(result.suggestions, [
    {
      code: 'NO_LESSONS',
      message: 'لا توجد دروس متاحة للجدولة',
    },
  ]);
});

test('lesson totals include completed syllabus lessons while generated work excludes them', () => {
  const subject = makeSubject('completed', 2);
  const result = generateStudySessions(
    basicInput({
      subjects: [subject],
      completedLessonIds: new Set(['lesson-completed-1', 'lesson-completed-2']),
    })
  );
  assert.equal(result.totalLessons, 2);
  assert.equal(result.scheduledCount, 0);
  assert.equal(result.skippedCompletedCount, 2);
  assert.equal(result.sessions.length, 0);
  assert.deepEqual(result.suggestions, [
    {
      code: 'ALL_LESSONS_COMPLETED',
      message: 'كل دروس المواد المختارة مكتملة',
    },
  ]);
});

test('generation distributes subjects round-robin and lessons across study days', () => {
  const result = generateStudySessions(
    basicInput({
      subjects: [makeSubject('a', 4), makeSubject('b', 4)],
    })
  );
  assert.deepEqual(
    result.sessions.slice(0, 4).map(({ subjectId }) => subjectId),
    ['a', 'b', 'a', 'b']
  );
  const sessionsPerDay = new Map<string, number>();
  for (const session of result.sessions) {
    sessionsPerDay.set(session.date, (sessionsPerDay.get(session.date) ?? 0) + 1);
  }
  assert.equal(sessionsPerDay.size, 5);
  assert.deepEqual([...sessionsPerDay.values()], [1, 2, 1, 2, 2]);
});

test('generation spaces three lessons evenly across 29 eligible days', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-29',
      subjects: [makeSubject('a', 3)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 1 },
    })
  );
  assert.deepEqual(
    result.sessions.map(({ date }) => date),
    ['2026-01-05', '2026-01-15', '2026-01-25']
  );
});

function sessionsPerDate(sessions: ReturnType<typeof generateStudySessions>['sessions']) {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    counts.set(session.date, (counts.get(session.date) ?? 0) + 1);
  }
  return counts;
}

test('20 lessons over 10 days distribute as two lessons per day', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      subjects: [makeSubject('a', 20)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 3 },
    })
  );
  const counts = sessionsPerDate(result.sessions);
  assert.equal(result.scheduledCount, 20);
  assert.equal(counts.size, 10);
  assert.deepEqual([...counts.values()], Array(10).fill(2));
  assert.deepEqual(
    result.sessions.filter(({ date }) => date === '2026-01-01').map(({ order }) => order),
    [0, 1]
  );
});

test('25 lessons over 10 days spread the extra lessons evenly', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      subjects: [makeSubject('a', 25)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 3 },
    })
  );
  const counts = [...sessionsPerDate(result.sessions).values()];
  assert.deepEqual(counts, [2, 3, 2, 3, 2, 3, 2, 3, 2, 3]);
  assert.ok(counts.every((count) => count === 2 || count === 3));
});

test('lessons beyond daily capacity remain unscheduled with capacity suggestions', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      subjects: [makeSubject('a', 35)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 3 },
    })
  );
  assert.equal(result.totalLessons, 35);
  assert.equal(result.scheduledCount, 30);
  assert.equal(result.unscheduledLessonsCount, 5);
  assert.deepEqual(
    result.suggestions.map(({ code }) => code),
    ['INCREASE_DAILY_CAPACITY', 'ADD_STUDY_DAYS', 'EXTEND_DATE_RANGE']
  );
  assert.deepEqual([...sessionsPerDate(result.sessions).values()], Array(10).fill(3));
});

test('generator only schedules selected weekdays within the range', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-14',
      subjects: [makeSubject('a', 4)],
      schedule: { studyWeekdays: [1, 3], maxSessionsPerDay: 1 },
    })
  );
  assert.deepEqual(
    result.sessions.map(({ date }) => date),
    ['2026-01-05', '2026-01-07', '2026-01-12', '2026-01-14']
  );
});

test('lessons are round-robin across subjects and ordered by each syllabus', () => {
  const subjectA = makeSubject('a', 1);
  subjectA.units = [
    {
      id: 'a-unit-2',
      title: 'Unit 2',
      order: 2,
      lessons: [
        { id: 'a-3', title: 'A3', order: 1 },
        { id: 'a-4', title: 'A4', order: 2 },
      ],
    },
    {
      id: 'a-unit-1',
      title: 'Unit 1',
      order: 1,
      lessons: [
        { id: 'a-2', title: 'A2', order: 2 },
        { id: 'a-1', title: 'A1', order: 1 },
      ],
    },
  ];
  const subjectB = makeSubject('b', 4);
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-04',
      subjects: [subjectA, subjectB],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 2 },
    })
  );
  assert.deepEqual(
    result.sessions.map(({ subjectId }) => subjectId),
    ['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b']
  );
  assert.deepEqual(
    result.sessions.filter(({ subjectId }) => subjectId === 'a').map(({ lessonId }) => lessonId),
    ['a-1', 'a-2', 'a-3', 'a-4']
  );
});

test('current-month generation does not schedule before today', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-11-02',
      endDate: '2026-11-30',
      subjects: [makeSubject('a', 8)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 1 },
    })
  );
  assert.ok(result.sessions.length > 0);
  assert.ok(result.sessions.every(({ date }) => date >= '2026-11-02'));
});

test('preview and save generation produce identical deterministic sessions', () => {
  const input = basicInput({
    startDate: '2026-01-01',
    endDate: '2026-01-10',
    subjects: [makeSubject('a', 25), makeSubject('b', 5)],
    schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 3 },
  });
  const previewSessions = generateStudySessions(input).sessions;
  const savedSessions = generateStudySessions(input).sessions;
  assert.deepEqual(savedSessions, previewSessions);
});

test('current monthly range starts from today in the user timezone', () => {
  const range = monthlyRange({
    month: 11,
    year: 2026,
    timezone: 'Africa/Cairo',
    now: new Date('2026-11-02T10:00:00.000Z'),
  });
  assert.deepEqual(range, {
    startDate: '2026-11-02',
    endDate: '2026-11-30',
    month: 11,
    year: 2026,
    monthStartDate: '2026-11-01',
    startsFromToday: true,
  });
});

test('current monthly range is one day when today is the final day of the month', () => {
  const range = monthlyRange({
    month: 11,
    year: 2026,
    timezone: 'Africa/Cairo',
    now: new Date('2026-11-30T10:00:00.000Z'),
  });
  assert.equal(range.startDate, '2026-11-30');
  assert.equal(range.endDate, '2026-11-30');
  assert.equal(range.startsFromToday, true);
});

test('future monthly ranges start on the first and include the whole month', () => {
  const range = monthlyRange({
    month: 12,
    year: 2026,
    timezone: 'Africa/Cairo',
    now: new Date('2026-11-02T10:00:00.000Z'),
  });
  assert.equal(range.startDate, '2026-12-01');
  assert.equal(range.endDate, '2026-12-31');
  assert.equal(range.startsFromToday, false);
});

test('future February 2028 includes leap day', () => {
  const range = monthlyRange({
    month: 2,
    year: 2028,
    timezone: 'Africa/Cairo',
    now: new Date('2026-11-02T10:00:00.000Z'),
  });
  assert.equal(range.startDate, '2028-02-01');
  assert.equal(range.endDate, '2028-02-29');
});

test('monthly range rejects a past month with the stable PAST_MONTH error', () => {
  assert.throws(
    () =>
      monthlyRange({
        month: 10,
        year: 2026,
        timezone: 'Africa/Cairo',
        now: new Date('2026-11-02T10:00:00.000Z'),
      }),
    (error: unknown) => {
      assert.ok(error instanceof UnprocessableEntityError);
      assert.equal(error.statusCode, 422);
      assert.equal(error.code, 'PAST_MONTH');
      assert.equal(error.message, 'لا يمكن إنشاء جدول لشهر سابق');
      assert.deepEqual(error.details, {
        month: 10,
        year: 2026,
        currentMonth: 11,
        currentYear: 2026,
      });
      return true;
    }
  );
});

test('omitted year uses the current user year without rolling a past month forward', () => {
  assert.throws(
    () =>
      monthlyRange({
        month: 10,
        timezone: 'Africa/Cairo',
        now: new Date('2026-11-02T10:00:00.000Z'),
      }),
    (error: unknown) =>
      error instanceof UnprocessableEntityError &&
      error.code === 'PAST_MONTH' &&
      (error.details as { year: number }).year === 2026
  );
});

test('monthly range resolves today across a UTC-to-Cairo month boundary', () => {
  const range = monthlyRange({
    month: 11,
    timezone: 'Africa/Cairo',
    now: new Date('2026-10-31T22:30:00.000Z'),
  });
  assert.equal(range.startDate, '2026-11-01');
  assert.equal(range.monthStartDate, '2026-11-01');
  assert.equal(range.startsFromToday, true);
});

test('available months begin with the current month in the user timezone', () => {
  const result = getAvailableMonthRanges('Africa/Cairo', 3, new Date('2026-10-31T22:30:00.000Z'));
  assert.equal(result.today, '2026-11-01');
  assert.deepEqual(
    result.months.map(({ month, year, isCurrent, startDate }) => ({
      month,
      year,
      isCurrent,
      startDate,
    })),
    [
      { month: 11, year: 2026, isCurrent: true, startDate: '2026-11-01' },
      { month: 12, year: 2026, isCurrent: false, startDate: '2026-12-01' },
      { month: 1, year: 2027, isCurrent: false, startDate: '2027-01-01' },
    ]
  );
  assert.equal(result.months[0]!.label, 'نوفمبر 2026');
  assert.equal(result.months[0]!.remainingDays, 30);

  const secondDay = getAvailableMonthRanges(
    'Africa/Cairo',
    1,
    new Date('2026-11-02T10:00:00.000Z')
  );
  assert.equal(secondDay.months[0]!.remainingDays, 29);
});

test('available-months query defaults to 12, caps at 24, and rejects unknown fields', () => {
  assert.equal(availableMonthsSchema.parse({ query: {} }).query.count, 12);
  assert.equal(availableMonthsSchema.parse({ query: { count: '24' } }).query.count, 24);
  assert.throws(() => availableMonthsSchema.parse({ query: { count: '25' } }));
  assert.throws(() => availableMonthsSchema.parse({ query: { count: '12', extra: 'no' } }));
});

test('monthly generator never schedules a session before the range start', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-11-02',
      endDate: '2026-11-30',
      subjects: [makeSubject('a', 8)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 1 },
    })
  );
  assert.ok(result.sessions.length > 0);
  assert.ok(result.sessions.every(({ date }) => date >= '2026-11-02'));
});

test('maxSessionsPerDay caps scheduled work and reports capacity suggestions', () => {
  const result = generateStudySessions(
    basicInput({
      endDate: '2026-01-07',
      schedule: { studyWeekdays: [1, 2, 3], maxSessionsPerDay: 1 },
    })
  );
  assert.equal(result.capacity, 3);
  assert.equal(result.sessions.length, 3);
  assert.equal(result.unscheduledLessonsCount, 4);
  assert.equal(result.suggestions.length, 3);
  assert.ok(result.sessions.every(({ order }) => order === 0));
});

test('GLOBAL preview planning reports insufficient capacity without dropping metadata', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-05',
      endDate: '2026-01-05',
      subjects: [makeSubject('a', 5)],
      schedule: { studyWeekdays: [1], maxSessionsPerDay: 2 },
    })
  );
  assert.equal(result.capacity, 2);
  assert.equal(result.sessions.length, 2);
  assert.equal(result.unscheduledLessonsCount, 3);
  assert.deepEqual(
    result.suggestions.map(({ code }) => code),
    ['INCREASE_DAILY_CAPACITY', 'ADD_STUDY_DAYS', 'EXTEND_DATE_RANGE']
  );
});

test('GLOBAL distributes subjects and groups the result into month-week-day sessions', () => {
  const result = generateStudySessions(
    basicInput({
      startDate: '2026-01-01',
      endDate: '2026-01-04',
      subjects: [makeSubject('a', 2), makeSubject('b', 2)],
      schedule: { studyWeekdays: [0, 1, 2, 3, 4, 5, 6], maxSessionsPerDay: 1 },
    })
  );
  assert.equal(result.unscheduledLessonsCount, 0);
  assert.deepEqual(
    result.sessions.map(({ subjectId }) => subjectId),
    ['a', 'b', 'a', 'b']
  );
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
  assert.throws(() =>
    createStudyTableSchema.parse({
      body: {
        title: 'Invalid weekly plan',
        type: 'WEEKLY',
        startDate: '2026-01-05',
        endDate: '2026-01-11',
        subjects: 'ALL',
      },
    })
  );
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
  assert.throws(() =>
    createStudyTableSchema.parse({
      body: { title: 'Invalid', type: 'MONTHLY', month: 'not-a-month', subjects: 'ALL' },
    })
  );
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
  assert.throws(() =>
    generateStudyTableSchema.parse({
      body: {
        title: 'Monthly',
        type: 'MONTHLY',
        month: 1,
        subjects: 'ALL',
        schedule: { studyWeekdays: [1], unsupportedOption: true },
      },
      query: {},
    })
  );
});

test('session status uses the local calendar date in the user timezone', () => {
  const now = new Date('2026-03-01T02:00:00.000Z');
  const todayKey = localDateKey(now, 'America/New_York');
  assert.equal(getStudySessionStatus(null, '2026-02-27', todayKey), 'LATE');
  assert.equal(getStudySessionStatus(null, '2026-02-28', todayKey), 'IN_PROGRESS');
  assert.equal(getStudySessionStatus(null, '2026-03-01', todayKey), 'UPCOMING');
  assert.equal(getStudySessionStatus(now, '2026-02-27', todayKey), 'COMPLETED');
});

test('updating a weekly start date recomputes the seven-day range', () => {
  const updated = getUpdatedRange(
    StudyTableType.WEEKLY,
    { startDate: '2026-01-05', endDate: '2026-01-11' },
    { startDate: '2026-03-01' },
    'UTC'
  );
  assert.deepEqual(updated, { startDate: '2026-03-01', endDate: '2026-03-07' });
});

test('updating a monthly table uses the shared future-month rules', () => {
  const updated = getUpdatedRange(
    StudyTableType.MONTHLY,
    { startDate: '2028-01-01', endDate: '2028-01-31', month: 1, year: 2028 },
    { month: 2 },
    'Africa/Cairo',
    new Date('2026-11-02T10:00:00.000Z')
  );
  assert.deepEqual(updated, {
    startDate: '2028-02-01',
    endDate: '2028-02-29',
    month: 2,
    year: 2028,
    monthStartDate: '2028-02-01',
    startsFromToday: false,
  });
});

test('PATCH rejects changing a monthly table to a past month', () => {
  assert.throws(
    () =>
      getUpdatedRange(
        StudyTableType.MONTHLY,
        { startDate: '2026-11-02', endDate: '2026-11-30', month: 11, year: 2026 },
        { month: 10 },
        'Africa/Cairo',
        new Date('2026-11-02T10:00:00.000Z')
      ),
    (error: unknown) =>
      error instanceof UnprocessableEntityError &&
      error.code === 'PAST_MONTH' &&
      error.statusCode === 422
  );
});

test('PATCH title and subject edits preserve an expired monthly table range', () => {
  const updated = getUpdatedRange(
    StudyTableType.MONTHLY,
    { startDate: '2026-10-01', endDate: '2026-10-31', month: 10, year: 2026 },
    { title: 'Updated title' },
    'Africa/Cairo',
    new Date('2026-11-02T10:00:00.000Z')
  );
  assert.deepEqual(updated, {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    month: 10,
    year: 2026,
  });
});

test('uncompleting a session clears completion and the late-notification marker', () => {
  const completion = getSessionCompletionUpdate(
    false,
    new Date('2026-02-27T12:00:00.000Z'),
    new Date('2026-03-01T12:00:00.000Z')
  );
  assert.deepEqual(completion, { completedAt: null, lateNotifiedAt: null });
});

test('late scan groups notices by user/table/local date with session details', () => {
  const notices = groupLateSessions(
    [
      {
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
      },
    ],
    new Date('2026-03-01T01:00:00.000Z')
  );

  assert.equal(notices.length, 1);
  assert.equal(notices[0]!.localDate, '2026-02-28');
  assert.deepEqual(notices[0]!.sessions, [
    {
      id: 'session-late',
      date: '2026-02-27',
      subject: 'الرياضيات',
      unit: 'الجبر',
      lesson: 'المعادلات',
    },
  ]);
});
