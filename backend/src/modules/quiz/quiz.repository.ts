// src/modules/quiz/quiz.repository.ts
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import type { GeneratedQuestion } from './quiz.generator';
import type { WeakPoint } from './quiz.grader';

export const quizRepository = {
  createWithQuestions(data: {
    userId: string;
    bookId: string;
    bookTitle: string;
    title: string;
    language: string;
    startPage: number;
    endPage: number;
    questions: GeneratedQuestion[];
  }) {
    const { questions, ...quiz } = data;
    return prisma.quiz.create({
      data: {
        ...quiz,
        questions: {
          create: questions.map((q, index) => ({
            position: index + 1,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            acceptedAnswers: q.acceptedAnswers,
            explanation: q.explanation,
            pageNumber: q.pageNumber,
            topic: q.topic,
          })),
        },
      },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
  },

  // only the student who created the quiz
  findOwned(userId: string, id: string) {
    return prisma.quiz.findFirst({
      where: { id, userId },
      include: { questions: { orderBy: { position: 'asc' } } },
    });
  },

  listByUser(userId: string, skip: number, take: number, bookId?: string) {
    const where = { userId, ...(bookId ? { bookId } : {}) };
    return Promise.all([
      prisma.quiz.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
        select: {
          id: true,
          title: true,
          bookId: true,
          bookTitle: true,
          language: true,
          startPage: true,
          endPage: true,
          createdAt: true,
          _count: { select: { questions: true, attempts: true } },
          attempts: {
            orderBy: { submittedAt: 'desc' },
            take: 1,
            select: { id: true, score: true, total: true, submittedAt: true },
          },
        },
      }),
      prisma.quiz.count({ where }),
    ]);
  },

  countCreatedSince(userId: string, since: Date) {
    return prisma.quiz.count({ where: { userId, createdAt: { gte: since } } });
  },

  countAttempts(quizId: string) {
    return prisma.quizAttempt.count({ where: { quizId } });
  },

  listAttempts(userId: string, quizId: string) {
    return prisma.quizAttempt.findMany({
      where: { userId, quizId },
      orderBy: { submittedAt: 'desc' },
      select: { id: true, score: true, total: true, submittedAt: true },
    });
  },

  findAttempt(userId: string, quizId: string, attemptId: string) {
    return prisma.quizAttempt.findFirst({
      where: { id: attemptId, quizId, userId },
    });
  },

  createAttempt(data: {
    quizId: string;
    userId: string;
    answers: Record<string, string>;
    score: number;
    total: number;
    weakPoints: WeakPoint[];
    advice: string | null;
  }) {
    return prisma.quizAttempt.create({
      data: {
        quizId: data.quizId,
        userId: data.userId,
        answers: data.answers as Prisma.InputJsonObject,
        score: data.score,
        total: data.total,
        weakPoints: data.weakPoints as unknown as Prisma.InputJsonArray,
        advice: data.advice,
      },
    });
  },
};