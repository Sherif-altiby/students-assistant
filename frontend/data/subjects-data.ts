export interface StaticLesson {
  title: string;
}

export interface StaticChapter {
  title: string;
  lessons: StaticLesson[];
}

export interface StaticSubject {
  title: string;
  chapters: StaticChapter[];
}

export const STATIC_SUBJECTS: StaticSubject[] = [
  {
    title: "الرياضيات",
    chapters: [
      {
        title: "الجبر",
        lessons: [{ title: "المعادلات الخطية" }, { title: "المتباينات" }],
      },
      {
        title: "الهندسة",
        lessons: [{ title: "النقاط والخطوط والمستويات" }],
      },
    ],
  },
  {
    title: "الفيزياء",
    chapters: [
      {
        title: "الميكانيكا",
        lessons: [{ title: "قوانين نيوتن" }, { title: "الحركة" }],
      },
    ],
  },
  {
    title: "الكيمياء",
    chapters: [
      {
        title: "الكيمياء العضوية",
        lessons: [{ title: "الهيدروكربونات" }],
      },
    ],
  },
];