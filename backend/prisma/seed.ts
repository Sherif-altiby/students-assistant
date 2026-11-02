import 'dotenv/config';
import { prisma } from '../src/config/prisma';

import {
  EducationLevel,
  Track,
  TaskFrequency,
  StudyTableType,
  Role,
  UserStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const START_DATE = new Date('2026-06-01T00:00:00.000Z');
const END_DATE = new Date();

// Seed login accounts for quick local testing.
const STUDENT_LOGIN = {
  email: 'student@studentsassistant.com',
  password: 'Student123!',
};

const DOCTOR_LOGIN = {
  email: 'doctor@studentsassistant.com',
  password: 'Doctor123!',
};

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

const TRACK_SUBJECT_SYLLABUS = {
  استاتيكا: [
    { title: 'القوى والاتزان', lessons: ['تمثيل القوة ومحصلة قوتين', 'تحليل القوى إلى مركبات', 'اتزان جسيم تحت تأثير قوى مستوية'] },
    { title: 'العزوم والازدواج', lessons: ['عزم القوة حول نقطة', 'نظرية فارنيون للعزوم', 'اتزان جسم صلب تحت تأثير قوى'] },
    { title: 'الاحتكاك', lessons: ['قوانين الاحتكاك السكوني', 'زاوية الاحتكاك ورد الفعل', 'اتزان جسم على مستوى خشن'] },
    { title: 'مراكز الثقل', lessons: ['مركز ثقل مجموعة قوى متوازية', 'مركز ثقل الأجسام المنتظمة', 'اتزان الأجسام تحت تأثير الوزن'] },
  ],
  ديناميكا: [
    { title: 'الحركة في خط مستقيم', lessons: ['الإزاحة والسرعة والعجلة', 'الحركة بعجلة منتظمة', 'السقوط الحر'] },
    { title: 'قوانين نيوتن للحركة', lessons: ['قانون نيوتن الأول والثاني', 'قانون نيوتن الثالث', 'تطبيقات قوانين نيوتن'] },
    { title: 'الشغل والطاقة', lessons: ['الشغل المبذول بواسطة قوة', 'نظرية الشغل والطاقة', 'القدرة وكفاءة الآلات'] },
    { title: 'كمية الحركة والدفع', lessons: ['كمية الحركة الخطية', 'الدفع والتغير في كمية الحركة', 'التصادم في خط مستقيم'] },
  ],
  'تفاضل وتكامل': [
    { title: 'النهايات والاتصال', lessons: ['مفهوم النهاية وخواصها', 'حساب النهايات الجبرية', 'اتصال الدوال'] },
    { title: 'التفاضل', lessons: ['معدل التغير والمشتقة', 'قواعد اشتقاق الدوال', 'مشتقات الدوال المثلثية'] },
    { title: 'تطبيقات التفاضل', lessons: ['معادلة المماس والعمودي', 'فترات التزايد والتناقص', 'القيم العظمى والصغرى'] },
    { title: 'التكامل', lessons: ['التكامل غير المحدد', 'طرق التكامل الأساسية', 'التكامل المحدد وتطبيقاته'] },
  ],
  'هندسة فراغية': [
    { title: 'المتجهات في الفراغ', lessons: ['تمثيل المتجهات وإحداثياتها', 'عمليات جمع المتجهات وضربها', 'الضرب القياسي للمتجهات'] },
    { title: 'المستقيمات في الفراغ', lessons: ['معادلة المستقيم في الفراغ', 'اتجاهات المستقيمات', 'تقاطع وتوازي المستقيمات'] },
    { title: 'المستويات', lessons: ['معادلة المستوى', 'العلاقة بين مستقيم ومستوى', 'الزاوية والمسافة في الفراغ'] },
    { title: 'الأجسام الهندسية', lessons: ['مساحة وحجم المنشور والأسطوانة', 'مساحة وحجم المخروط', 'مساحة وحجم الكرة'] },
  ],
  جبر: [
    { title: 'المصفوفات', lessons: ['أنواع المصفوفات وتساويها', 'جمع المصفوفات وضربها', 'مصفوفة الوحدة والمعكوس'] },
    { title: 'المحددات', lessons: ['حساب محددات الرتبة الثانية والثالثة', 'خواص المحددات', 'حل المعادلات باستخدام المحددات'] },
    { title: 'العد والتباديل والتوافيق', lessons: ['مبدأ العد الأساسي', 'التباديل', 'التوافيق وتطبيقاتها'] },
    { title: 'الاحتمال والإحصاء', lessons: ['فضاء العينة والحوادث', 'احتمال الحوادث', 'مقاييس النزعة المركزية والتشتت'] },
  ],
  تاريخ: [
    { title: 'مصر في العصر الحديث', lessons: ['الحملة الفرنسية على مصر', 'بناء الدولة في عهد محمد علي', 'الحركة الوطنية وثورة 1919'] },
    { title: 'مصر والعالم المعاصر', lessons: ['ثورة يوليو والتحولات السياسية', 'قضايا الاستقلال في العالم العربي', 'مصر والقضية الفلسطينية'] },
    { title: 'الحربان العالميتان', lessons: ['أسباب ونتائج الحرب العالمية الأولى', 'العالم بين الحربين', 'أسباب ونتائج الحرب العالمية الثانية'] },
    { title: 'النظام الدولي الحديث', lessons: ['نشأة الأمم المتحدة', 'الحرب الباردة', 'التكتلات والتحولات العالمية'] },
  ],
  جغرافيا: [
    { title: 'جغرافية التنمية', lessons: ['مفهوم التنمية ومؤشراتها', 'التنمية المستدامة', 'التفاوت في مستويات التنمية'] },
    { title: 'الموارد والأنشطة الاقتصادية', lessons: ['الموارد الطبيعية والبشرية', 'الزراعة والصناعة', 'التجارة والنقل والخدمات'] },
    { title: 'جغرافية السكان والعمران', lessons: ['توزيع السكان ونموهم', 'الهجرة والتركيب السكاني', 'المدن والتخطيط العمراني'] },
    { title: 'البيئة والمخاطر', lessons: ['النظم البيئية والتوازن البيئي', 'التغير المناخي والتلوث', 'إدارة الموارد ومواجهة المخاطر'] },
  ],
  فلسفة: [
    { title: 'الفلسفة والأخلاق', lessons: ['طبيعة التفكير الفلسفي', 'القيم الأخلاقية والحرية', 'المسؤولية الأخلاقية'] },
    { title: 'المنطق والتفكير العلمي', lessons: ['مبادئ التفكير المنطقي', 'القضايا والاستدلال', 'المنهج العلمي والتفكير الناقد'] },
    { title: 'فلسفة العلم', lessons: ['طبيعة المعرفة العلمية', 'التفسير والنظرية العلمية', 'أخلاقيات البحث العلمي'] },
    { title: 'قضايا فلسفية معاصرة', lessons: ['الإنسان والتقنية', 'العدالة وحقوق الإنسان', 'الحوار والتسامح'] },
  ],
  'علم نفس': [
    { title: 'التعلم والذاكرة', lessons: ['مفهوم التعلم وأنواعه', 'نظريات التعلم', 'الذاكرة وطرق تحسينها'] },
    { title: 'الشخصية والدوافع', lessons: ['مفهوم الشخصية وقياسها', 'الدوافع والحاجات', 'الانفعالات وأساليب تنظيمها'] },
    { title: 'علم النفس الاجتماعي', lessons: ['التفاعل الاجتماعي', 'الاتجاهات وتكوين الرأي', 'الجماعة والقيادة'] },
    { title: 'الصحة النفسية', lessons: ['مفهوم الصحة النفسية', 'التوافق ومواجهة الضغوط', 'طلب المساعدة والدعم النفسي'] },
  ],
} satisfies Record<string, Array<{ title: string; lessons: string[] }>>;

// ------------------------------------------------------------------
// Main seed routine
// ------------------------------------------------------------------
async function main() {
  console.log('🧹 Clearing existing data...');
  await prisma.studyLessonCompletion.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.studyTableSubject.deleteMany();
  await prisma.studyLesson.deleteMany();
  await prisma.studyUnit.deleteMany();
  await prisma.studySubject.deleteMany();
  await prisma.studyDay.deleteMany();
  await prisma.studyTable.deleteMany();
  await prisma.completedHabit.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating seed login accounts...');
  const studentPassword = await hashPassword(STUDENT_LOGIN.password);
  const doctorPassword = await hashPassword(DOCTOR_LOGIN.password);

  const student = await prisma.user.create({
    data: {
      name: 'أحمد محمود',
      email: STUDENT_LOGIN.email,
      phone: '01012345678',
      password: studentPassword,
      level: EducationLevel.BACHELOR,
      track: Track.BACHELOR_SECOND_MEDICAL,
      parentPhone: '01098765432',
      country: 'مصر',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const doctor = await prisma.user.create({
    data: {
      name: 'د. محمد علي',
      email: DOCTOR_LOGIN.email,
      phone: '01055555555',
      password: doctorPassword,
      role: Role.DOCTOR,
      status: UserStatus.ACTIVE,
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
        userId: student.id,
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
      data: { title, userId: student.id, createdAt: START_DATE },
    });
    habits.push(habit);
  }

  // ------------------------------------------------------------
  // Study tables
  //  - one long CUSTOM table spanning the whole period
  //  - one shorter CUSTOM table for the last 14 days
  // ------------------------------------------------------------
  console.log('📚 Creating study tables...');
  const mainStudyTable = await prisma.studyTable.create({
    data: {
      title: 'جدول مراجعة الترم الثاني',
      type: StudyTableType.CUSTOM,
      startDate: START_DATE,
      endDate: END_DATE,
      userId: student.id,
      allSubjects: true,
    },
  });

  const RECENT_TABLE_DAYS = 14;
  const recentTableStart = new Date(END_DATE);
  recentTableStart.setUTCDate(recentTableStart.getUTCDate() - (RECENT_TABLE_DAYS - 1));

  const finalSprintTable = await prisma.studyTable.create({
    data: {
      title: `جدول مراجعة مكثفة (${RECENT_TABLE_DAYS} يوم)`,
      type: StudyTableType.CUSTOM,
      startDate: recentTableStart,
      endDate: END_DATE,
      userId: student.id,
      allSubjects: true,
    },
  });

  // ------------------------------------------------------------
  // Day-by-day generation: tasks, task histories, habit
  // completions, and study-day content for both study tables
  // ------------------------------------------------------------
  console.log(
    '🗓️  Generating daily data (June 1 - ' + END_DATE.toISOString().split('T')[0] + ')...'
  );
  // Progress counter to make long-running seeding visible
  let _dayIndex = 0;
  let taskCount = 0;
  let taskHistoryCount = 0;
  let habitCompletionCount = 0;
  let studyDayCount = 0;
  let lessonCount = 0;
  let lessonCompletionCount = 0;
  const studyCatalog = new Map<string, { id: string; lessons: Array<{ id: string }> }>();
  const usedLessonsByTable = new Map<string, Set<string>>([
    [mainStudyTable.id, new Set()],
    [finalSprintTable.id, new Set()],
  ]);

  console.log('📖 Creating shared study catalog...');
  for (const subjectTitle of SUBJECT_POOL) {
    const subject = await prisma.studySubject.create({
      data: { title: subjectTitle },
    });
    const subjectLessons: Array<{ id: string }> = [];
    const unitCount = randomInt(1, 2);

    for (let unitOrder = 1; unitOrder <= unitCount; unitOrder++) {
      const unit = await prisma.studyUnit.create({
        data: { title: `الوحدة ${unitOrder}`, subjectId: subject.id, order: unitOrder },
      });

      const lessonsInUnit = randomInt(1, 3);
      for (let lessonOrder = 1; lessonOrder <= lessonsInUnit; lessonOrder++) {
        const lesson = await prisma.studyLesson.create({
          data: { title: `الدرس ${lessonOrder}`, unitId: unit.id, order: lessonOrder },
        });
        subjectLessons.push(lesson);
        lessonCount++;
      }
    }

    studyCatalog.set(subjectTitle, { id: subject.id, lessons: subjectLessons });
  }

  for (const [subjectTitle, units] of Object.entries(TRACK_SUBJECT_SYLLABUS)) {
    await prisma.studySubject.create({
      data: {
        title: subjectTitle,
        units: {
          create: units.map((unit, unitIndex) => ({
            title: unit.title,
            order: unitIndex + 1,
            lessons: {
              create: unit.lessons.map((title, lessonIndex) => ({
                title,
                order: lessonIndex + 1,
              })),
            },
          })),
        },
      },
    });
  }

  const completedLessonIds = new Set<string>();
  async function addStudyDay(
    studyTableId: string,
    date: Date,
    subjectCount: number,
    completionChance: number
  ) {
    const studyDay = await prisma.studyDay.create({
      data: { date, studyTableId },
    });
    studyDayCount++;

    const usedLessons = usedLessonsByTable.get(studyTableId)!;
    const subjectsToday = sample([...studyCatalog.entries()], subjectCount);
    let sessionIndex = 0;
    for (const [, catalogSubject] of subjectsToday) {
      const availableLessons = catalogSubject.lessons.filter((lesson) => !usedLessons.has(lesson.id));
      const lessonsForDay = sample(
        availableLessons,
        Math.min(1, availableLessons.length)
      );

      for (const lesson of lessonsForDay) {
        usedLessons.add(lesson.id);
        const completed = chance(completionChance);
        await prisma.studySession.create({
          data: {
            userId: student.id,
            studyTableId,
            dayId: studyDay.id,
            subjectId: catalogSubject.id,
            lessonId: lesson.id,
            order: sessionIndex,
            completedAt: completed ? date : null,
          },
        });
        sessionIndex++;

        if (completed && !completedLessonIds.has(lesson.id)) {
          await prisma.studyLessonCompletion.create({
            data: {
              userId: student.id,
              lessonId: lesson.id,
              completedAt: date,
            },
          });
          completedLessonIds.add(lesson.id);
          lessonCompletionCount++;
        }
      }
    }
  }

  for (const date of dateRange(START_DATE, END_DATE)) {
    _dayIndex++;
    if (_dayIndex % 10 === 0) {
      console.log(`   · generated up to ${date.toISOString().split('T')[0]} (${_dayIndex} days)`);
    }
    // --- TODAY tasks: 1-3 one-off tasks per day, ~70% completed
    const numTodayTasks = randomInt(1, 3);
    for (let i = 0; i < numTodayTasks; i++) {
      const title = pick(TODAY_TASK_POOL);
      const task = await prisma.task.create({
        data: {
          title,
          frequency: TaskFrequency.TODAY,
          userId: student.id,
          createdAt: date,
        },
      });
      taskCount++;

      if (chance(0.7)) {
        await prisma.taskHistory.create({
          data: {
            userId: student.id,
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
            userId: student.id,
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
            userId: student.id,
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
      await addStudyDay(mainStudyTable.id, date, randomInt(2, 3), 0.6);
    }

    // --- Study day content on the intensive last-two-weeks table
    if (date >= recentTableStart) {
      await addStudyDay(finalSprintTable.id, date, randomInt(1, 2), 0.8);
    }
  }

  console.log('✅ Seed complete:');
  console.log(`   student: ${student.email} / ${STUDENT_LOGIN.password}`);
  console.log(`   doctor: ${doctor.email} / ${DOCTOR_LOGIN.password}`);
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
