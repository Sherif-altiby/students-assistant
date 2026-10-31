import { StudyChapter, StudyLesson } from '@prisma/client';

import {
  CreateChapterInput,
  CreateLessonInput,
  CreateSubjectInput,
  ImportSubjectInput,
  UpdateChapterInput,
  UpdateLessonInput,
  UpdateSubjectInput,
} from './subject.schema';

import { BadRequestError, ConflictError, NotFoundError } from '../../utils/AppError';
import { subjectRepository } from './subject.repository';

interface LessonNode {
  id: string;
  title: string;
  order: number;
  children: LessonNode[];
}

interface ChapterNode {
  id: string;
  title: string;
  order: number;
  chapters: ChapterNode[];
  lessons: LessonNode[];
}

// Rows arrive already sorted by (order, createdAt), so pushing in iteration
// order keeps siblings correctly ordered.
const buildTree = (chapters: StudyChapter[], lessons: StudyLesson[]): ChapterNode[] => {
  const lessonNodes = new Map<string, LessonNode>();
  for (const l of lessons) {
    lessonNodes.set(l.id, { id: l.id, title: l.title, order: l.order, children: [] });
  }

  const chapterNodes = new Map<string, ChapterNode>();
  for (const c of chapters) {
    chapterNodes.set(c.id, { id: c.id, title: c.title, order: c.order, chapters: [], lessons: [] });
  }

  for (const l of lessons) {
    const node = lessonNodes.get(l.id) as LessonNode;
    if (l.parentId) {
      lessonNodes.get(l.parentId)?.children.push(node);
    } else {
      chapterNodes.get(l.chapterId)?.lessons.push(node);
    }
  }

  const roots: ChapterNode[] = [];
  for (const c of chapters) {
    const node = chapterNodes.get(c.id) as ChapterNode;
    if (c.parentId) {
      chapterNodes.get(c.parentId)?.chapters.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
};

// Walks up from the proposed new parent; if we meet `id`, the move would make
// a node its own ancestor.
const assertNoCycle = async (
  id: string,
  newParentId: string,
  getParentId: (nodeId: string) => Promise<string | null>
) => {
  let cursor: string | null = newParentId;

  while (cursor) {
    if (cursor === id) {
      throw new BadRequestError('A node cannot be moved under itself or its own descendants');
    }
    cursor = await getParentId(cursor);
  }
};

export const subjectService = {
  // ───────────── Subject ─────────────

  async createSubject(input: CreateSubjectInput) {
    if (await subjectRepository.findSubjectByTitle(input.title)) {
      throw new ConflictError('A subject with this title already exists');
    }

    return subjectRepository.createSubject({ title: input.title });
  },

  async listSubjects() {
    const subjects = await subjectRepository.findAllSubjects();

    return subjects.map((s) => ({
      id: s.id,
      title: s.title,
      chaptersCount: s._count.chapters,
    }));
  },

  async getSubject(id: string) {
    const graph = await subjectRepository.findSubjectGraph(id);

    if (!graph) {
      throw new NotFoundError('Subject not found');
    }

    return {
      id: graph.subject.id,
      title: graph.subject.title,
      chapters: buildTree(graph.chapters, graph.lessons),
    };
  },

  async updateSubject(id: string, input: UpdateSubjectInput) {
    const subject = await subjectRepository.findSubjectById(id);

    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    if (input.title && input.title !== subject.title) {
      if (await subjectRepository.findSubjectByTitle(input.title)) {
        throw new ConflictError('A subject with this title already exists');
      }
    }

    return subjectRepository.updateSubject(id, input);
  },

  async deleteSubject(id: string) {
    if (!(await subjectRepository.findSubjectById(id))) {
      throw new NotFoundError('Subject not found');
    }

    // Chapters, lessons, completions and day plans are removed by cascade.
    await subjectRepository.deleteSubject(id);
  },

  async importSubject(input: ImportSubjectInput) {
    if (await subjectRepository.findSubjectByTitle(input.title)) {
      throw new ConflictError('A subject with this title already exists');
    }

    const subject = await subjectRepository.importTree(input.title, input.table_of_contents);

    return this.getSubject(subject.id);
  },

  // ───────────── Chapter ─────────────

  async createChapter(subjectId: string, input: CreateChapterInput) {
    if (!(await subjectRepository.findSubjectById(subjectId))) {
      throw new NotFoundError('Subject not found');
    }

    const parentId = input.parentId ?? null;

    if (parentId) {
      const parent = await subjectRepository.findChapterById(parentId);

      if (!parent) {
        throw new NotFoundError('Parent chapter not found');
      }
      if (parent.subjectId !== subjectId) {
        throw new BadRequestError('Parent chapter belongs to a different subject');
      }
    }

    const order = input.order ?? (await subjectRepository.nextChapterOrder(subjectId, parentId));

    return subjectRepository.createChapter({ title: input.title, order, subjectId, parentId });
  },

  async updateChapter(id: string, input: UpdateChapterInput) {
    const chapter = await subjectRepository.findChapterById(id);

    if (!chapter) {
      throw new NotFoundError('Chapter not found');
    }

    if (input.parentId) {
      const parent = await subjectRepository.findChapterById(input.parentId);

      if (!parent) {
        throw new NotFoundError('Parent chapter not found');
      }
      if (parent.subjectId !== chapter.subjectId) {
        throw new BadRequestError('Parent chapter belongs to a different subject');
      }

      await assertNoCycle(
        id,
        input.parentId,
        async (nodeId) => (await subjectRepository.findChapterById(nodeId))?.parentId ?? null
      );
    }

    return subjectRepository.updateChapter(id, input);
  },

  async deleteChapter(id: string) {
    if (!(await subjectRepository.findChapterById(id))) {
      throw new NotFoundError('Chapter not found');
    }

    // Nested chapters and all their lessons are removed by cascade.
    await subjectRepository.deleteChapter(id);
  },

  // ───────────── Lesson ─────────────

  async createLesson(chapterId: string, input: CreateLessonInput) {
    if (!(await subjectRepository.findChapterById(chapterId))) {
      throw new NotFoundError('Chapter not found');
    }

    const parentId = input.parentId ?? null;

    if (parentId) {
      const parent = await subjectRepository.findLessonById(parentId);

      if (!parent) {
        throw new NotFoundError('Parent lesson not found');
      }
      if (parent.chapterId !== chapterId) {
        throw new BadRequestError('Parent lesson belongs to a different chapter');
      }
    }

    const order = input.order ?? (await subjectRepository.nextLessonOrder(chapterId, parentId));

    return subjectRepository.createLesson({ title: input.title, order, chapterId, parentId });
  },

  async updateLesson(id: string, input: UpdateLessonInput) {
    const lesson = await subjectRepository.findLessonById(id);

    if (!lesson) {
      throw new NotFoundError('Lesson not found');
    }

    if (input.parentId) {
      const parent = await subjectRepository.findLessonById(input.parentId);

      if (!parent) {
        throw new NotFoundError('Parent lesson not found');
      }
      if (parent.chapterId !== lesson.chapterId) {
        throw new BadRequestError('Parent lesson belongs to a different chapter');
      }

      await assertNoCycle(
        id,
        input.parentId,
        async (nodeId) => (await subjectRepository.findLessonById(nodeId))?.parentId ?? null
      );
    }

    return subjectRepository.updateLesson(id, input);
  },

  async deleteLesson(id: string) {
    if (!(await subjectRepository.findLessonById(id))) {
      throw new NotFoundError('Lesson not found');
    }

    // Sub-lessons are removed by cascade.
    await subjectRepository.deleteLesson(id);
  },
};