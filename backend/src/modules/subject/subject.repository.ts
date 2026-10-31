import { prisma } from '../../config/prisma';
import { ImportLesson, ImportSection } from './subject.schema';

 
const siblingOrder = [{ order: 'asc' as const }, { createdAt: 'asc' as const }];

export const subjectRepository = {
  // ───────────── Subject ─────────────

  createSubject(data: { title: string }) {
    return prisma.studySubject.create({ data });
  },

  findSubjectById(id: string) {
    return prisma.studySubject.findUnique({ where: { id } });
  },

  findSubjectByTitle(title: string) {
    return prisma.studySubject.findUnique({ where: { title } });
  },

  findAllSubjects() {
    return prisma.studySubject.findMany({
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { chapters: true } } },
    });
  },

  updateSubject(id: string, data: { title?: string }) {
    return prisma.studySubject.update({ where: { id }, data });
  },

  deleteSubject(id: string) {
    return prisma.studySubject.delete({ where: { id } });
  },

  // Flat rows for a whole subject; the service assembles the tree.
  async findSubjectGraph(id: string) {
    const subject = await prisma.studySubject.findUnique({ where: { id } });
    if (!subject) return null;

    const [chapters, lessons] = await Promise.all([
      prisma.studyChapter.findMany({ where: { subjectId: id }, orderBy: siblingOrder }),
      prisma.studyLesson.findMany({
        where: { chapter: { subjectId: id } },
        orderBy: siblingOrder,
      }),
    ]);

    return { subject, chapters, lessons };
  },

  // ───────────── Chapter ─────────────

  findChapterById(id: string) {
    return prisma.studyChapter.findUnique({ where: { id } });
  },

  async nextChapterOrder(subjectId: string, parentId: string | null) {
    const result = await prisma.studyChapter.aggregate({
      where: { subjectId, parentId },
      _max: { order: true },
    });
    return (result._max.order ?? -1) + 1;
  },

  createChapter(data: {
    title: string;
    order: number;
    subjectId: string;
    parentId: string | null;
  }) {
    return prisma.studyChapter.create({ data });
  },

  updateChapter(id: string, data: { title?: string; order?: number; parentId?: string | null }) {
    return prisma.studyChapter.update({ where: { id }, data });
  },

  deleteChapter(id: string) {
    return prisma.studyChapter.delete({ where: { id } });
  },

  // ───────────── Lesson ─────────────

  findLessonById(id: string) {
    return prisma.studyLesson.findUnique({ where: { id } });
  },

  async nextLessonOrder(chapterId: string, parentId: string | null) {
    const result = await prisma.studyLesson.aggregate({
      where: { chapterId, parentId },
      _max: { order: true },
    });
    return (result._max.order ?? -1) + 1;
  },

  createLesson(data: { title: string; order: number; chapterId: string; parentId: string | null }) {
    return prisma.studyLesson.create({ data });
  },

  updateLesson(id: string, data: { title?: string; order?: number; parentId?: string | null }) {
    return prisma.studyLesson.update({ where: { id }, data });
  },

  deleteLesson(id: string) {
    return prisma.studyLesson.delete({ where: { id } });
  },

  // ───────────── Bulk import (all-or-nothing) ─────────────

  importTree(title: string, sections: ImportSection[]) {
    return prisma.$transaction(
      async (tx) => {
        const subject = await tx.studySubject.create({ data: { title } });

        const createLessons = async (
          items: ImportLesson[],
          chapterId: string,
          parentId: string | null
        ): Promise<void> => {
          for (const [index, item] of items.entries()) {
            const lesson = await tx.studyLesson.create({
              data: {
                title: typeof item === 'string' ? item : item.title,
                order: index,
                chapterId,
                parentId,
              },
            });

            if (typeof item !== 'string' && item.children?.length) {
              await createLessons(item.children, chapterId, lesson.id);
            }
          }
        };

        const createChapters = async (
          nodes: ImportSection[],
          parentId: string | null
        ): Promise<void> => {
          for (const [index, node] of nodes.entries()) {
            const chapter = await tx.studyChapter.create({
              data: { title: node.section, order: index, subjectId: subject.id, parentId },
            });

            await createLessons(node.items ?? [], chapter.id, null);
            await createChapters(node.subsections ?? [], chapter.id);
          }
        };

        await createChapters(sections, null);

        return subject;
      },
      { timeout: 60_000 }
    );
  },
};