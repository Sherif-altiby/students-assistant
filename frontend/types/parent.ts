import type { Level, Track } from "@/types";

export type ParentLinkStatus = "PENDING" | "ACTIVE" | "REJECTED";

export interface ParentStudentLink {
  id: string;
  status: ParentLinkStatus;
  createdAt: string;
  student: {
    id: string;
    name: string;
    level: Level | null;
    track: Track | null;
  };
}

export interface ParentOverview {
  student: {
    id: string;
    name: string;
    level: Level | null;
    track: Track | null;
  };
  summary: {
    taskCount: number;
    completedTaskCount: number;
    habitCount: number;
    habitCompletionCount: number;
    studyTableCount: number;
    studySessionCount: number;
    completedStudySessionCount: number;
    completedLessonCount: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    frequency: "TODAY" | "EVERY_DAY";
    createdAt: string;
    _count: { histories: number };
    histories: Array<{ completedAt: string }>;
  }>;
  taskHistory: Array<{
    id: string;
    date: string;
    completedAt: string;
    taskTitle: string;
  }>;
  habits: Array<{
    id: string;
    title: string;
    _count: { completions: number };
    completions: Array<{ date: string; completedAt: string }>;
  }>;
  studyTables: Array<{
    id: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    days: Array<{
      id: string;
      date: string;
      sessions: Array<{
        id: string;
        completedAt: string | null;
        subject: string;
        lesson: string;
      }>;
    }>;
  }>;
  lessons: {
    schedule: Array<{
      id: string;
      subject: string;
      teacher: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    completed: Array<{
      id: string;
      completedAt: string;
      lesson: {
        title: string;
        unit: { title: string; subject: { title: string } };
      };
    }>;
  };
}

export interface ParentLinkRequest {
  id: string;
  createdAt: string;
  parent: { name: string; phone: string | null };
}
