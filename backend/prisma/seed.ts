import 'dotenv/config';
import { prisma } from '../src/config/prisma';

import { Gender, EducationLevel, Track, TaskFrequency, StudyTableType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const START_DATE = new Date('2026-06-01T00:00:00.000Z');
const END_DATE = new Date('2026-07-20T00:00:00.000Z');

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function sample<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  const n = Math.min(count, copy.length);
  for (let i = 0; i < n; i++) {
    const idx = randomInt(0, copy.length - 1);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function* dateRange(start: Date, end: Date): Generator<Date> {
  const cursor = new Date(start);
  while (cursor <= end) {
    yield new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// ------------------------------------------------------------------
// Data pools
// ------------------------------------------------------------------
const EVERYDAY_TASK_TITLES = [
  'مراجعة ملخص اليوم',
  'حل 20 سؤال تدريب',
  'مذاكرة نصف ساعة إضافية',
  'تسميع القوانين والتعريفات',
  'مراجعة الأخطاء الشائعة',
];

const TODAY_TASK_POOL = [
  'حل واجب الرياضيات',
  'مراجعة درس الفيزياء',
  'حفظ قصيدة اللغة العربية',
  'تلخيص درس الأحياء',
  'حل امتحان تجريبي',
  'مراجعة قواعد اللغة الإنجليزية',
  'تسليم بحث الكيمياء',
  'حل أسئلة الكتاب المدرسي',
  'مشاهدة شرح فيديو مراجعة',
  'تنظيم جدول المذاكرة الأسبوعي',
];

const HABIT_TITLES = [
  'النوم 8 ساعات',
  'شرب 8 أكواب ماء',
  'رياضة 20 دقيقة',
  'قراءة 10 صفحات',
  'الابتعاد عن الموبايل ساعة قبل النوم',
];

const SUBJECT_POOL = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الرياضيات',
  'الفيزياء',
  'الكيمياء',
  'الأحياء',
];

// ------------------------------------------------------------------
// Main seed routine
// ------------------------------------------------------------------
async function main() {
  console.log('🧹 Clearing existing data...');
  await prisma.studyLessonCompletion.deleteMany();
  await prisma.studyLesson.deleteMany();
  await prisma.studyChapter.deleteMany();
  await prisma.studySubject.deleteMany();
  await prisma.studyDay.deleteMany();
  await prisma.studyTable.deleteMany();
  await prisma.completedHabit.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating user...');
  const password = await hashPassword('Password123!');

  const user = await prisma.user.create({
    data: {
      name: 'أحمد محمود',
      email: 'ahmed.mahmoud@example.com',
      phone: '01012345678',
      password,
      gender: Gender.MALE,
      level: EducationLevel.GENERAL_SECONDARY,
      track: Track.SCIENCE_MATH,
      parentPhone: '01098765432',
      country: 'مصر',
    },
  });

  // ------------------------------------------------------------
  // Recurring EVERY_DAY tasks (created once, completions tracked
  // per-date in TaskHistory)
  // ------------------------------------------------------------
  console.log('🔁 Creating recurring (EVERY_DAY) tasks...');
  const everydayTasks = [];
  for (const title of EVERYDAY_TASK_TITLES) {
    const task = await prisma.task.create({
      data: {
        title,
        frequency: TaskFrequency.EVERY_DAY,
        userId: user.id,
        createdAt: START_DATE,
      },
    });
    everydayTasks.push(task);
  }

  // ------------------------------------------------------------
  // Habits
  // ------------------------------------------------------------
  console.log('🌱 Creating habits...');
  const habits = [];
  for (const title of HABIT_TITLES) {
    const habit = await prisma.habit.create({
      data: { title, userId: user.id, createdAt: START_DATE },
    });
    habits.push(habit);
  }

  // ------------------------------------------------------------
  // Study tables
  //  - one long DATE_RANGE table spanning the whole period
  //  - one shorter NUMBER_OF_DAYS table for the last 14 days
  // ------------------------------------------------------------
  console.log('📚 Creating study tables...');
  const mainStudyTable = await prisma.studyTable.create({
    data: {
      title: 'جدول مراجعة الترم الثاني',
      type: StudyTableType.DATE_RANGE,
      startDate: START_DATE,
      endDate: END_DATE,
      userId: user.id,
    },
  });

  const RECENT_TABLE_DAYS = 14;
  const recentTableStart = new Date(END_DATE);
  recentTableStart.setUTCDate(recentTableStart.getUTCDate() - (RECENT_TABLE_DAYS - 1));

  const finalSprintTable = await prisma.studyTable.create({
    data: {
      title: `جدول مراجعة مكثفة (${RECENT_TABLE_DAYS} يوم)`,
      type: StudyTableType.NUMBER_OF_DAYS,
      startDate: recentTableStart,
      endDate: END_DATE,
      userId: user.id,
    },
  });

  // ------------------------------------------------------------
  // Day-by-day generation: tasks, task histories, habit
  // completions, and study-day content for both study tables
  // ------------------------------------------------------------
  console.log('🗓️  Generating daily data (June 1 - July 20, 2026)...');

  let taskCount = 0;
  let taskHistoryCount = 0;
  let habitCompletionCount = 0;
  let studyDayCount = 0;
  let lessonCount = 0;
  let lessonCompletionCount = 0;

  for (const date of dateRange(START_DATE, END_DATE)) {
    // --- TODAY tasks: 1-3 one-off tasks per day, ~70% completed
    const numTodayTasks = randomInt(1, 3);
    for (let i = 0; i < numTodayTasks; i++) {
      const title = pick(TODAY_TASK_POOL);
      const task = await prisma.task.create({
        data: {
          title,
          frequency: TaskFrequency.TODAY,
          userId: user.id,
          createdAt: date,
        },
      });
      taskCount++;

      if (chance(0.7)) {
        await prisma.taskHistory.create({
          data: {
            userId: user.id,
            taskId: task.id,
            date,
            completedAt: date,
            taskTitle: task.title,
            taskFrequency: TaskFrequency.TODAY,
          },
        });
        taskHistoryCount++;
      }
    }

    // --- EVERY_DAY tasks: each has ~75% chance of completion that day
    for (const task of everydayTasks) {
      if (chance(0.75)) {
        await prisma.taskHistory.create({
          data: {
            userId: user.id,
            taskId: task.id,
            date,
            completedAt: date,
            taskTitle: task.title,
            taskFrequency: TaskFrequency.EVERY_DAY,
          },
        });
        taskHistoryCount++;
      }
    }

    // --- Habits: each has ~65% chance of completion that day
    for (const habit of habits) {
      if (chance(0.65)) {
        await prisma.completedHabit.create({
          data: {
            userId: user.id,
            habitId: habit.id,
            date,
            completedAt: date,
          },
        });
        habitCompletionCount++;
      }
    }

    // --- Study day content on the main table (skip ~15% of days,
    // like weekends off or rest days)
    if (chance(0.85)) {
      const studyDay = await prisma.studyDay.create({
        data: { date, studyTableId: mainStudyTable.id },
      });
      studyDayCount++;

      const subjectsToday = sample(SUBJECT_POOL, randomInt(2, 3));
      for (const subjectTitle of subjectsToday) {
        const subject = await prisma.studySubject.create({
          data: { title: subjectTitle, dayId: studyDay.id },
        });

        const chapterCount = randomInt(1, 2);
        for (let c = 1; c <= chapterCount; c++) {
          const chapter = await prisma.studyChapter.create({
            data: { title: `الفصل ${c}`, subjectId: subject.id },
          });

          const lessonsInChapter = randomInt(1, 3);
          for (let l = 1; l <= lessonsInChapter; l++) {
            const lesson = await prisma.studyLesson.create({
              data: { title: `الدرس ${l}`, chapterId: chapter.id },
            });
            lessonCount++;

            if (chance(0.6)) {
              await prisma.studyLessonCompletion.create({
                data: {
                  userId: user.id,
                  lessonId: lesson.id,
                  completedAt: date,
                },
              });
              lessonCompletionCount++;
            }
          }
        }
      }
    }

    // --- Study day content on the intensive last-two-weeks table
    if (date >= recentTableStart) {
      const sprintDay = await prisma.studyDay.create({
        data: { date, studyTableId: finalSprintTable.id },
      });
      studyDayCount++;

      const subjectsToday = sample(SUBJECT_POOL, randomInt(1, 2));
      for (const subjectTitle of subjectsToday) {
        const subject = await prisma.studySubject.create({
          data: { title: subjectTitle, dayId: sprintDay.id },
        });

        const chapter = await prisma.studyChapter.create({
          data: { title: 'مراجعة نهائية', subjectId: subject.id },
        });

        const lessonsInChapter = randomInt(1, 2);
        for (let l = 1; l <= lessonsInChapter; l++) {
          const lesson = await prisma.studyLesson.create({
            data: { title: `مراجعة سريعة ${l}`, chapterId: chapter.id },
          });
          lessonCount++;

          if (chance(0.8)) {
            await prisma.studyLessonCompletion.create({
              data: {
                userId: user.id,
                lessonId: lesson.id,
                completedAt: date,
              },
            });
            lessonCompletionCount++;
          }
        }
      }
    }
  }

  console.log('✅ Seed complete:');
  console.log(`   user: ${user.email}`);
  console.log(`   tasks created: ${taskCount + everydayTasks.length}`);
  console.log(`   task history rows: ${taskHistoryCount}`);
  console.log(`   habits: ${habits.length}, completions: ${habitCompletionCount}`);
  console.log(`   study tables: 2, study days: ${studyDayCount}`);
  console.log(`   lessons: ${lessonCount}, completions: ${lessonCompletionCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
