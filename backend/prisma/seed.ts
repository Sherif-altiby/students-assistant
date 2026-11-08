import 'dotenv/config';
import { prisma } from '../src/config/prisma';

import {
  TaskFrequency,
  StudyTableType,
  Role,
  UserStatus,
  BookingStatus,
  DayOfWeek,
  NotificationType,
  ReactionType,
  RecurrenceType,
  SlotStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const START_DATE = new Date('2026-06-01T00:00:00.000Z');
const END_DATE = new Date();

// Seed login accounts for quick local testing.
const STUDENT_LOGIN = {
  email: 'student@studentsassistant.com',
  password: 'Student123!',
};

const SECOND_STUDENT_LOGIN = {
  email: 'student2@studentsassistant.com',
  password: 'Student456!',
};

const DOCTOR_LOGIN = {
  email: 'doctor@studentsassistant.com',
  password: 'Doctor123!',
};

const ADMIN_LOGIN = {
  email: 'admin@studentsassistant.com',
  password: 'Admin123!',
};

const PARENT_LOGIN = {
  email: 'parent@studentsassistant.com',
  password: 'Parent123!',
  phone: '01098765432',
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  const value = arr[randomInt(0, arr.length - 1)];
  if (value === undefined) throw new Error('Cannot pick from an empty array');
  return value;
}

function chance(probability: number): boolean {
  return Math.random() < probability;
}

function dateAtOffset(dayOffset: number, hour: number): Date {
  const date = new Date();
  date.setUTCHours(hour, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date;
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

// Main seed routine
// ------------------------------------------------------------------
async function main() {
  console.log('🧹 Clearing existing data...');
  await prisma.studyLessonCompletion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.studyTableSubject.deleteMany();
  await prisma.studyLesson.deleteMany();
  await prisma.studyUnit.deleteMany();
  await prisma.studySubject.deleteMany();
  await prisma.studyDay.deleteMany();
  await prisma.studyTable.deleteMany();
  await prisma.sessionRating.deleteMany();
  await prisma.sessionBooking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.doctorAvailabilityRule.deleteMany();
  await prisma.lessonDate.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.completedHabit.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.parentStudentLink.deleteMany();
  await prisma.suggestion.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating seed login accounts...');
  const studentPassword = await hashPassword(STUDENT_LOGIN.password);
  const secondStudentPassword = await hashPassword(SECOND_STUDENT_LOGIN.password);
  const doctorPassword = await hashPassword(DOCTOR_LOGIN.password);
  const adminPassword = await hashPassword(ADMIN_LOGIN.password);
  const parentPassword = await hashPassword(PARENT_LOGIN.password);

  const student = await prisma.user.create({
    data: {
      name: 'أحمد محمود',
      email: STUDENT_LOGIN.email,
      phone: '01012345678',
      password: studentPassword,
      parentPhone: '01098765432',
      country: 'مصر',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    },
  });

  const secondStudent = await prisma.user.create({
    data: {
      name: 'سارة محمود',
      email: SECOND_STUDENT_LOGIN.email,
      phone: '01012345679',
      password: secondStudentPassword,
      parentPhone: PARENT_LOGIN.phone,
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

  const admin = await prisma.user.create({
    data: {
      name: 'مدير المنصة',
      email: ADMIN_LOGIN.email,
      password: adminPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  const parent = await prisma.user.create({
    data: {
      name: 'ولي أمر أحمد',
      email: PARENT_LOGIN.email,
      phone: PARENT_LOGIN.phone,
      password: parentPassword,
      role: Role.PARENT,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.parentStudentLink.createMany({
    data: [student, secondStudent].map(({ id }) => ({
      parentId: parent.id,
      studentId: id,
      status: 'ACTIVE',
    })),
  });

  await prisma.lessonDate.createMany({
    data: [
      {
        userId: student.id,
        subject: 'الرياضيات',
        teacher: 'أ. محمود حسن',
        dayOfWeek: DayOfWeek.SUNDAY,
        startTime: '10:00',
        endTime: '11:30',
      },
      {
        userId: student.id,
        subject: 'الفيزياء',
        teacher: 'أ. أحمد فؤاد',
        dayOfWeek: DayOfWeek.TUESDAY,
        startTime: '12:00',
        endTime: '13:30',
      },
      {
        userId: student.id,
        subject: 'الكيمياء',
        teacher: 'أ. منى إبراهيم',
        dayOfWeek: DayOfWeek.THURSDAY,
        startTime: '09:00',
        endTime: '10:30',
      },
      {
        userId: secondStudent.id,
        subject: 'اللغة العربية',
        teacher: 'أ. سارة خالد',
        dayOfWeek: DayOfWeek.SATURDAY,
        startTime: '11:00',
        endTime: '12:30',
      },
      {
        userId: secondStudent.id,
        subject: 'الأحياء',
        teacher: 'أ. كريم سمير',
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '13:00',
        endTime: '14:30',
      },
      {
        userId: secondStudent.id,
        subject: 'اللغة الإنجليزية',
        teacher: 'أ. ندى علي',
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '10:00',
        endTime: '11:30',
      },
    ],
  });

  await prisma.suggestion.createMany({
    data: [
      {
        userId: student.id,
        message: 'أتمنى إضافة تذكير يومي بالمهام التي لم تكتمل.',
      },
      {
        userId: secondStudent.id,
        message: 'سيكون مفيدًا إضافة إمكانية ترتيب المواد حسب الأولوية.',
      },
      {
        userId: parent.id,
        message: 'أقترح إضافة ملخص أسبوعي يوضح تقدم الأبناء.',
      },
    ],
  });

  console.log('🩺 Creating doctor availability and bookings...');
  const dailyRule = await prisma.doctorAvailabilityRule.create({
    data: {
      doctorId: doctor.id,
      type: RecurrenceType.DAILY,
      startTime: '14:00',
      endTime: '15:00',
    },
  });
  const weeklyRule = await prisma.doctorAvailabilityRule.create({
    data: {
      doctorId: doctor.id,
      type: RecurrenceType.WEEKLY,
      dayOfWeek: DayOfWeek.FRIDAY,
      startTime: '16:00',
      endTime: '17:00',
    },
  });
  const customSlotDate = dateAtOffset(8, 0);
  const customRule = await prisma.doctorAvailabilityRule.create({
    data: {
      doctorId: doctor.id,
      type: RecurrenceType.CUSTOM,
      customDate: customSlotDate,
      startTime: '11:00',
      endTime: '12:00',
    },
  });

  const bookingExamples: {
    dayOffset: number;
    hour: number;
    studentId: string;
    slotStatus: SlotStatus;
    bookingStatus?: BookingStatus;
    ruleId: string;
    rating?: number;
  }[] = [
    {
      dayOffset: -7,
      hour: 14,
      studentId: student.id,
      slotStatus: SlotStatus.COMPLETED,
      bookingStatus: BookingStatus.COMPLETED,
      ruleId: dailyRule.id,
      rating: 5,
    },
    {
      dayOffset: -3,
      hour: 16,
      studentId: secondStudent.id,
      slotStatus: SlotStatus.COMPLETED,
      bookingStatus: BookingStatus.COMPLETED,
      ruleId: weeklyRule.id,
      rating: 4,
    },
    {
      dayOffset: 1,
      hour: 14,
      studentId: student.id,
      slotStatus: SlotStatus.BOOKED,
      bookingStatus: BookingStatus.PENDING,
      ruleId: dailyRule.id,
    },
    {
      dayOffset: 2,
      hour: 16,
      studentId: secondStudent.id,
      slotStatus: SlotStatus.BOOKED,
      bookingStatus: BookingStatus.ACCEPTED,
      ruleId: weeklyRule.id,
    },
    {
      dayOffset: 3,
      hour: 14,
      studentId: student.id,
      slotStatus: SlotStatus.OPEN,
      bookingStatus: BookingStatus.REJECTED,
      ruleId: dailyRule.id,
    },
    {
      dayOffset: 4,
      hour: 16,
      studentId: secondStudent.id,
      slotStatus: SlotStatus.CANCELLED,
      bookingStatus: BookingStatus.CANCELLED,
      ruleId: weeklyRule.id,
    },
    {
      dayOffset: 6,
      hour: 14,
      studentId: student.id,
      slotStatus: SlotStatus.OPEN,
      ruleId: dailyRule.id,
    },
    {
      dayOffset: 8,
      hour: 11,
      studentId: secondStudent.id,
      slotStatus: SlotStatus.OPEN,
      ruleId: customRule.id,
    },
    {
      dayOffset: 12,
      hour: 16,
      studentId: student.id,
      slotStatus: SlotStatus.OPEN,
      ruleId: weeklyRule.id,
    },
  ];

  for (const example of bookingExamples) {
    const startTime = dateAtOffset(example.dayOffset, example.hour);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const slot = await prisma.availabilitySlot.create({
      data: {
        doctorId: doctor.id,
        ruleId: example.ruleId,
        startTime,
        endTime,
        status: example.slotStatus,
        meetingLink:
          example.bookingStatus === BookingStatus.ACCEPTED ||
          example.bookingStatus === BookingStatus.COMPLETED
            ? 'https://example.com/doctor-session'
            : null,
      },
    });

    if (!example.bookingStatus) continue;

    const booking = await prisma.sessionBooking.create({
      data: {
        slotId: slot.id,
        userId: example.studentId,
        status: example.bookingStatus,
        note: 'أرغب في مناقشة خطة المذاكرة ومتابعة التقدم.',
        requestedAt: new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
        respondedAt:
          example.bookingStatus === BookingStatus.PENDING
            ? null
            : new Date(startTime.getTime() - 12 * 60 * 60 * 1000),
        cancelledAt: example.bookingStatus === BookingStatus.CANCELLED ? startTime : null,
      },
    });

    if (example.rating) {
      await prisma.sessionRating.create({
        data: {
          bookingId: booking.id,
          userId: example.studentId,
          score: example.rating,
          comment: 'جلسة مفيدة وواضحة، شكرًا على المتابعة.',
        },
      });
    }
  }

  console.log('💬 Creating community messages and reactions...');
  const firstMessage = await prisma.message.create({
    data: {
      userId: student.id,
      content: 'كيف تنظمون وقت المراجعة قبل الامتحانات؟',
    },
  });
  const secondMessage = await prisma.message.create({
    data: {
      userId: secondStudent.id,
      content: 'أقسم المواد على جلسات قصيرة وأبدأ بالموضوع الأصعب.',
      replyToId: firstMessage.id,
    },
  });
  const thirdMessage = await prisma.message.create({
    data: {
      userId: student.id,
      content: 'شكرًا، سأجرب هذه الطريقة هذا الأسبوع.',
      replyToId: secondMessage.id,
    },
  });
  await prisma.reaction.createMany({
    data: [
      {
        userId: secondStudent.id,
        messageId: firstMessage.id,
        type: ReactionType.LIKE,
      },
      {
        userId: student.id,
        messageId: secondMessage.id,
        type: ReactionType.SUPPORT,
      },
      {
        userId: secondStudent.id,
        messageId: thirdMessage.id,
        type: ReactionType.LOVE,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: NotificationType.LATE_STUDY,
        title: 'جلسة مذاكرة متأخرة',
        body: 'لديك جلسة لم تكتمل في جدول المذاكرة.',
        data: { studyTableTitle: 'جدول مراجعة الترم الثاني' },
        dedupeKey: 'seed-late-study-student',
      },
      {
        userId: student.id,
        type: NotificationType.DATE_CONFLICT,
        title: 'تعارض في المواعيد',
        body: 'يوجد تعارض محتمل بين مواعيدك الدراسية.',
        data: { subject: 'الرياضيات', dayOfWeek: DayOfWeek.SUNDAY },
        dedupeKey: 'seed-date-conflict-student',
        readAt: new Date(),
      },
      {
        userId: secondStudent.id,
        type: NotificationType.LATE_STUDY,
        title: 'تذكير بجدول المذاكرة',
        body: 'راجع جلسات المذاكرة المخططة لهذا الأسبوع.',
        data: { studyTableTitle: 'جدول المراجعة الأسبوعي' },
        dedupeKey: 'seed-late-study-second-student',
      },
    ],
  });

  // ------------------------------------------------------------
  // Recurring EVERY_DAY tasks (created once, completions tracked
  // per-date in TaskHistory)
  // ------------------------------------------------------------
  console.log('🔁 Creating recurring (EVERY_DAY) tasks...');
  const students = [student, secondStudent];
  const everydayTasksByUser = new Map<string, Array<{ id: string; title: string }>>();
  const habitsByUser = new Map<string, Array<{ id: string }>>();
  for (const account of students) {
    const everydayTasks = [];
    for (const title of EVERYDAY_TASK_TITLES) {
      const task = await prisma.task.create({
        data: {
          title,
          frequency: TaskFrequency.EVERY_DAY,
          userId: account.id,
          createdAt: START_DATE,
        },
      });
      everydayTasks.push(task);
    }
    everydayTasksByUser.set(account.id, everydayTasks);

    const habits = [];
    for (const title of HABIT_TITLES) {
      const habit = await prisma.habit.create({
        data: { title, userId: account.id, createdAt: START_DATE },
      });
      habits.push(habit);
    }
    habitsByUser.set(account.id, habits);
  }

  console.log('🌱 Creating habits...');

  // ------------------------------------------------------------
  // Study tables
  //  - one long CUSTOM table spanning the whole period
  //  - one shorter CUSTOM table for the last 14 days
  //  - a recent table for the second student
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

  const secondStudentTableStart = new Date(END_DATE);
  secondStudentTableStart.setUTCHours(0, 0, 0, 0);
  secondStudentTableStart.setUTCDate(secondStudentTableStart.getUTCDate() - 4);
  const secondStudentTable = await prisma.studyTable.create({
    data: {
      title: 'جدول المراجعة الأسبوعي',
      type: StudyTableType.WEEKLY,
      startDate: secondStudentTableStart,
      endDate: END_DATE,
      userId: secondStudent.id,
      allSubjects: true,
    },
  });

  // ------------------------------------------------------------
  // Day-by-day generation: tasks, task histories, and habit completions
  // ------------------------------------------------------------
  console.log(
    '🗓️  Generating daily data (June 1 - ' + END_DATE.toISOString().split('T')[0] + ')...'
  );
  // Progress counter to make long-running seeding visible
  let _dayIndex = 0;
  let taskCount = 0;
  let taskHistoryCount = 0;
  let habitCompletionCount = 0;
  for (const date of dateRange(START_DATE, END_DATE)) {
    _dayIndex++;
    if (_dayIndex % 10 === 0) {
      console.log(`   · generated up to ${date.toISOString().split('T')[0]} (${_dayIndex} days)`);
    }
    for (const account of students) {
      // --- TODAY tasks: 1-3 one-off tasks per day, ~70% completed
      const numTodayTasks = randomInt(1, 3);
      for (let i = 0; i < numTodayTasks; i++) {
        const title = pick(TODAY_TASK_POOL);
        const task = await prisma.task.create({
          data: {
            title,
            frequency: TaskFrequency.TODAY,
            userId: account.id,
            createdAt: date,
          },
        });
        taskCount++;

        if (chance(0.7)) {
          await prisma.taskHistory.create({
            data: {
              userId: account.id,
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
      for (const task of everydayTasksByUser.get(account.id) ?? []) {
        if (chance(0.75)) {
          await prisma.taskHistory.create({
            data: {
              userId: account.id,
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
      for (const habit of habitsByUser.get(account.id) ?? []) {
        if (chance(0.65)) {
          await prisma.completedHabit.create({
            data: {
              userId: account.id,
              habitId: habit.id,
              date,
              completedAt: date,
            },
          });
          habitCompletionCount++;
        }
      }
    }

  }

  console.log('✅ Seed complete:');
  console.log(`   student: ${student.email} / ${STUDENT_LOGIN.password}`);
  console.log(`   second student: ${secondStudent.email} / ${SECOND_STUDENT_LOGIN.password}`);
  console.log(`   doctor: ${doctor.email} / ${DOCTOR_LOGIN.password}`);
  console.log(`   admin: ${admin.email} / ${ADMIN_LOGIN.password}`);
  console.log('   suggestions: 3 (2 students, 1 parent)');
  console.log(`   tasks created: ${taskCount + [...everydayTasksByUser.values()].flat().length}`);
  console.log(`   task history rows: ${taskHistoryCount}`);
  console.log(
    `   habits: ${[...habitsByUser.values()].flat().length}, completions: ${habitCompletionCount}`
  );
  console.log('   study tables: 3, no subjects or lessons seeded');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
