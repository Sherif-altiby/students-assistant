import { ParentStudentLinkStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/AppError';

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '');
}

export const parentService = {
  async requestStudent(parentId: string, studentEmail: string) {
    const [parent, student] = await Promise.all([
      prisma.user.findUnique({
        where: { id: parentId },
        select: { role: true, phone: true },
      }),
      prisma.user.findUnique({
        where: { email: studentEmail },
        select: { id: true, role: true, parentPhone: true },
      }),
    ]);

    if (!parent || parent.role !== Role.PARENT) {
      throw new ForbiddenError('Parent access required');
    }
    if (!student || student.role !== Role.USER) {
      throw new NotFoundError('الطالب غير موجود');
    }
    if (
      !parent.phone ||
      !student.parentPhone ||
      normalizePhone(parent.phone) !== normalizePhone(student.parentPhone)
    ) {
      throw new ForbiddenError('رقم الهاتف لا يطابق رقم ولي الأمر المسجل لدى الطالب');
    }

    const existing = await prisma.parentStudentLink.findUnique({
      where: { parentId_studentId: { parentId, studentId: student.id } },
    });
    if (existing?.status === ParentStudentLinkStatus.ACTIVE) {
      throw new ConflictError('هذا الطالب مرتبط بحسابك بالفعل');
    }
    if (existing?.status === ParentStudentLinkStatus.PENDING) {
      throw new ConflictError('طلب الربط قيد انتظار موافقة الطالب');
    }

    if (existing) {
      return prisma.parentStudentLink.update({
        where: { id: existing.id },
        data: { status: ParentStudentLinkStatus.PENDING },
        select: { id: true, status: true, createdAt: true },
      });
    }

    return prisma.parentStudentLink.create({
      data: { parentId, studentId: student.id },
      select: { id: true, status: true, createdAt: true },
    });
  },

  listParentStudents(parentId: string) {
    return prisma.parentStudentLink.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        student: {
          select: { id: true, name: true, level: true, track: true },
        },
      },
    });
  },

  listStudentRequests(studentId: string) {
    return prisma.parentStudentLink.findMany({
      where: { studentId, status: ParentStudentLinkStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        parent: { select: { name: true, phone: true } },
      },
    });
  },

  async respondToRequest(studentId: string, linkId: string, approve: boolean) {
    const result = await prisma.parentStudentLink.updateMany({
      where: {
        id: linkId,
        studentId,
        status: ParentStudentLinkStatus.PENDING,
      },
      data: {
        status: approve
          ? ParentStudentLinkStatus.ACTIVE
          : ParentStudentLinkStatus.REJECTED,
      },
    });
    if (!result.count) throw new NotFoundError('طلب الربط غير موجود');
    return { approved: approve };
  },

  async getStudentOverview(parentId: string, studentId: string) {
    const link = await prisma.parentStudentLink.findFirst({
      where: {
        parentId,
        studentId,
        status: ParentStudentLinkStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!link) throw new NotFoundError('الطالب غير موجود أو لم يوافق على الربط');

    const student = await prisma.user.findFirst({
      where: { id: studentId, role: Role.USER },
      select: {
        id: true,
        name: true,
        level: true,
        track: true,
        _count: {
          select: {
            taskHistories: true,
            lessonCompletions: true,
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            frequency: true,
            createdAt: true,
            _count: { select: { histories: true } },
            histories: {
              orderBy: { completedAt: 'desc' },
              take: 1,
              select: { completedAt: true },
            },
          },
        },
        habits: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            _count: { select: { completions: true } },
            completions: {
              orderBy: { date: 'desc' },
              take: 7,
              select: { date: true, completedAt: true },
            },
          },
        },
        studyTables: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            startDate: true,
            endDate: true,
            days: {
              orderBy: { date: 'asc' },
              select: {
                id: true,
                date: true,
                sessions: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    completedAt: true,
                    subject: { select: { title: true } },
                    lesson: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
        taskHistories: {
          orderBy: [{ date: 'desc' }, { completedAt: 'desc' }],
          take: 30,
          select: {
            id: true,
            date: true,
            completedAt: true,
            taskTitle: true,
          },
        },
        lessonCompletions: {
          orderBy: { completedAt: 'desc' },
          take: 30,
          select: {
            id: true,
            completedAt: true,
            lesson: {
              select: {
                title: true,
                unit: { select: { title: true, subject: { select: { title: true } } } },
              },
            },
          },
        },
        lessonDates: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          select: {
            id: true,
            subject: true,
            teacher: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });
    if (!student) throw new NotFoundError('الطالب غير موجود');

    const studySessions = student.studyTables.flatMap((table) =>
      table.days.flatMap((day) =>
        day.sessions.map((session) => ({
          id: session.id,
          date: day.date,
          tableTitle: table.title,
          subject: session.subject.title,
          lesson: session.lesson.title,
          completedAt: session.completedAt,
        })),
      ),
    );

    return {
      student: {
        id: student.id,
        name: student.name,
        level: student.level,
        track: student.track,
      },
      summary: {
        taskCount: student.tasks.length,
        completedTaskCount: student._count.taskHistories,
        habitCount: student.habits.length,
        habitCompletionCount: student.habits.reduce(
          (sum, habit) => sum + habit._count.completions,
          0,
        ),
        studyTableCount: student.studyTables.length,
        studySessionCount: studySessions.length,
        completedStudySessionCount: studySessions.filter(
          (session) => session.completedAt !== null,
        ).length,
        completedLessonCount: student._count.lessonCompletions,
      },
      tasks: student.tasks,
      taskHistory: student.taskHistories,
      habits: student.habits,
      studyTables: student.studyTables.map(({ days, ...table }) => ({
        ...table,
        days: days.map(({ sessions, ...day }) => ({
          ...day,
          sessions: sessions.map((session) => ({
            ...session,
            subject: session.subject.title,
            lesson: session.lesson.title,
          })),
        })),
      })),
      lessons: {
        schedule: student.lessonDates,
        completed: student.lessonCompletions,
      },
    };
  },
};
