import { prisma } from '../../config/prisma';

export const studyTableRepository = {
  create(data: {
    title: string;
    type: 'DATE_RANGE' | 'NUMBER_OF_DAYS';
    startDate: Date;
    endDate: Date;
    userId: string;
  }) {
    return prisma.studyTable.create({
      data,
    });
  },

  findById(id: string) {
    return prisma.studyTable.findUnique({
      where: { id },

      include: {
        days: {
          include: {
            subjects: {
              include: {
                chapters: {
                  include: {
                    lessons: {
                      include: {
                        completions: true,
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: {
            date: 'asc',
          },
        },
      },
    });
  },

  findByUserId(userId: string) {
    return prisma.studyTable.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  createLessonCompletion(data: { lessonId: string; userId: string }) {
    return prisma.studyLessonCompletion.create({
      data,
    });
  },

  update(
    id: string,
    data: {
      title?: string;
    }
  ) {
    return prisma.studyTable.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.studyTable.delete({
      where: { id },
    });
  },

  updateTitle(id: string, title: string) {
    return prisma.studyTable.update({
      where: { id },
      data: { title },
    });
  },

  // Find a day by id with its table (to check ownership)
  findDayById(dayId: string) {
    return prisma.studyDay.findUnique({
      where: { id: dayId },
      include: { studyTable: true },
    });
  },

  // Add subjects, chapters, lessons to a day (bulk create)
  addDayContent(
    dayId: string,
    subjects: Array<{
      title: string;
      chapters: Array<{
        title: string;
        lessons: Array<{ title: string }>;
      }>;
    }>
  ) {
    return prisma.$transaction(async (tx) => {
      for (const subjectData of subjects) {
        const subject = await tx.studySubject.create({
          data: {
            title: subjectData.title,
            dayId,
          },
        });
        for (const chapterData of subjectData.chapters) {
          const chapter = await tx.studyChapter.create({
            data: {
              title: chapterData.title,
              subjectId: subject.id,
            },
          });
          if (chapterData.lessons.length) {
            await tx.studyLesson.createMany({
              data: chapterData.lessons.map((l) => ({
                title: l.title,
                chapterId: chapter.id,
              })),
            });
          }
        }
      }
    });
  },

  // Replace all content of a day (delete old and create new)

replaceDayContent(
  dayId: string,
  subjects: Array<{
    title: string;
    chapters: Array<{
      title: string;
      lessons: Array<{ title: string }>;
    }>;
  }>
) {
  return prisma.$transaction(async (tx) => {
    // 1. Delete all existing subjects (cascades to chapters & lessons)
    await tx.studySubject.deleteMany({
      where: { dayId },
    });

    // 2. Create new subjects, chapters, lessons
    for (const subjectData of subjects) {
      const subject = await tx.studySubject.create({
        data: {
          title: subjectData.title,
          dayId,
        },
      });
      for (const chapterData of subjectData.chapters) {
        const chapter = await tx.studyChapter.create({
          data: {
            title: chapterData.title,
            subjectId: subject.id,
          },
        });
        if (chapterData.lessons.length) {
          await tx.studyLesson.createMany({
            data: chapterData.lessons.map((l) => ({
              title: l.title,
              chapterId: chapter.id,
            })),
          });
        }
      }
    }

    // 3. Return the updated day with its new subjects (for debugging)
    return tx.studyDay.findUnique({
      where: { id: dayId },
      include: {
        subjects: {
          include: {
            chapters: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });
  });
}
};
