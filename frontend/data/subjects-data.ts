// types/subjects.ts
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
  tracks: Track[]; // Which tracks can access this subject
}

export enum Track {
  SCIENCE_MATH = "SCIENCE_MATH", // علمي رياضة (عامة فقط)
  SCIENCE_SCIENCE = "SCIENCE_SCIENCE", // علمي علوم (عامة فقط)
  SCIENCE = "SCIENCE", // علمي (أزهرية فقط)
  LITERARY = "LITERARY", // أدبي (عامة وأزهرية)
}

// data/subjects-data.ts
 
export const STATIC_SUBJECTS: StaticSubject[] = [
  // ===== SCIENCE_MATH (علمي رياضة) =====
  {
    title: "الرياضيات",
    tracks: [Track.SCIENCE_MATH],
    chapters: [
      {
        title: "الجبر والهندسة الفراغية",
        lessons: [
          { title: "المصفوفات" },
          { title: "المحددات" },
          { title: "حل أنظمة المعادلات الخطية" },
          { title: "المتجهات في الفضاء" },
        ],
      },
      {
        title: "التفاضل والتكامل",
        lessons: [
          { title: "النهايات والاتصال" },
          { title: "الاشتقاق" },
          { title: "تطبيقات الاشتقاق" },
          { title: "التكامل غير المحدد" },
          { title: "التكامل المحدد" },
        ],
      },
      {
        title: "الإحصاء والاحتمالات",
        lessons: [
          { title: "التوزيعات الاحتمالية" },
          { title: "الاحتمالات الشرطية" },
          { title: "الاختبارات الإحصائية" },
        ],
      },
    ],
  },
  {
    title: "الفيزياء",
    tracks: [Track.SCIENCE_MATH, Track.SCIENCE_SCIENCE, Track.SCIENCE],
    chapters: [
      {
        title: "الميكانيكا الكلاسيكية",
        lessons: [
          { title: "قوانين نيوتن للحركة" },
          { title: "الحركة في بعد واحد" },
          { title: "الحركة في بعدين" },
          { title: "الديناميكا الدورانية" },
        ],
      },
      {
        title: "الكهرباء والمغناطيسية",
        lessons: [
          { title: "قانون كولوم" },
          { title: "المجال الكهربائي" },
          { title: "الجهد الكهربائي" },
          { title: "المكثفات" },
          { title: "قانون أوم" },
        ],
      },
      {
        title: "الموجات والصوت",
        lessons: [
          { title: "الموجات الميكانيكية" },
          { title: "الموجات الصوتية" },
          { title: "تأثير دوبلر" },
        ],
      },
      {
        title: "الضوء والبصريات",
        lessons: [
          { title: "الانعكاس والمرايا" },
          { title: "الانكسار والعدسات" },
          { title: "الحيود والتداخل" },
        ],
      },
    ],
  },
  {
    title: "الكيمياء",
    tracks: [Track.SCIENCE_MATH, Track.SCIENCE_SCIENCE, Track.SCIENCE],
    chapters: [
      {
        title: "الكيمياء العامة",
        lessons: [
          { title: "الذرة والجدول الدوري" },
          { title: "الروابط الكيميائية" },
          { title: "المعادلات الكيميائية" },
          { title: "الحسابات الكيميائية" },
        ],
      },
      {
        title: "الكيمياء العضوية",
        lessons: [
          { title: "الهيدروكربونات" },
          { title: "المجموعات الوظيفية" },
          { title: "البوليمرات" },
        ],
      },
      {
        title: "الكيمياء التحليلية",
        lessons: [
          { title: "التحليل الحجمي" },
          { title: "التحليل الوزني" },
          { title: "الكروماتوغرافيا" },
        ],
      },
    ],
  },

  // ===== SCIENCE_SCIENCE (علمي علوم) =====
  {
    title: "الأحياء",
    tracks: [Track.SCIENCE_SCIENCE, Track.SCIENCE],
    chapters: [
      {
        title: "الخلية ووظائفها",
        lessons: [
          { title: "تركيب الخلية" },
          { title: "الغشاء الخلوي" },
          { title: "العضيات الخلوية" },
          { title: "الانقسام الخلوي" },
        ],
      },
      {
        title: "الوراثة",
        lessons: [
          { title: "قوانين مندل" },
          { title: "الوراثة الجزيئية" },
          { title: "الحمض النووي DNA" },
          { title: "الطفرة الجينية" },
        ],
      },
      {
        title: "علم البيئة",
        lessons: [
          { title: "النظم البيئية" },
          { title: "تدفق الطاقة" },
          { title: "دورات العناصر" },
        ],
      },
      {
        title: "التشريح وعلم وظائف الأعضاء",
        lessons: [
          { title: "الجهاز الهضمي" },
          { title: "الجهاز التنفسي" },
          { title: "الجهاز الدوري" },
          { title: "الجهاز العصبي" },
        ],
      },
    ],
  },
  {
    title: "الجيولوجيا والعلوم البيئية",
    tracks: [Track.SCIENCE_SCIENCE, Track.SCIENCE],
    chapters: [
      {
        title: "علوم الأرض",
        lessons: [
          { title: "بنية الأرض" },
          { title: "الصخور والمعادن" },
          { title: "الزلازل والبراكين" },
          { title: "الصفائح التكتونية" },
        ],
      },
      {
        title: "البيئة والموارد",
        lessons: [
          { title: "الماء والموارد المائية" },
          { title: "الهواء والتلوث" },
          { title: "الطاقة المتجددة" },
        ],
      },
    ],
  },

  // ===== SCIENCE (علمي - أزهرية فقط) =====
  {
    title: "التفسير",
    tracks: [Track.SCIENCE, Track.LITERARY],
    chapters: [
      {
        title: "علوم القرآن",
        lessons: [
          { title: "مقدمة في علوم القرآن" },
          { title: "أسباب النزول" },
          { title: "الناسخ والمنسوخ" },
          { title: "المكي والمدني" },
        ],
      },
      {
        title: "تفسير سور القرآن",
        lessons: [
          { title: "تفسير جزء عم" },
          { title: "تفسير سورة البقرة" },
          { title: "تفسير سورة آل عمران" },
        ],
      },
    ],
  },
  {
    title: "الحديث الشريف",
    tracks: [Track.SCIENCE, Track.LITERARY],
    chapters: [
      {
        title: "مصطلح الحديث",
        lessons: [
          { title: "تعريف الحديث" },
          { title: "أقسام الحديث" },
          { title: "علم الجرح والتعديل" },
        ],
      },
      {
        title: "الأربعون النووية",
        lessons: [
          { title: "الحديث الأول إلى العاشر" },
          { title: "الحديث الحادي عشر إلى العشرين" },
          { title: "الحديث الحادي والعشرون إلى الثلاثين" },
          { title: "الحديث الحادي والثلاثون إلى الأربعين" },
        ],
      },
    ],
  },
  {
    title: "الفقه",
    tracks: [Track.SCIENCE, Track.LITERARY],
    chapters: [
      {
        title: "العبادات",
        lessons: [
          { title: "الطهارة" },
          { title: "الصلاة" },
          { title: "الزكاة" },
          { title: "الصيام" },
          { title: "الحج" },
        ],
      },
      {
        title: "المعاملات",
        lessons: [
          { title: "البيع والشراء" },
          { title: "الإجارة" },
          { title: "الوكالة" },
          { title: "الشركة" },
        ],
      },
    ],
  },

  // ===== LITERARY (أدبي - عامة وأزهرية) =====
  {
    title: "التاريخ",
    tracks: [Track.LITERARY],
    chapters: [
      {
        title: "التاريخ الإسلامي",
        lessons: [
          { title: "السيرة النبوية" },
          { title: "الخلفاء الراشدون" },
          { title: "الدولة الأموية" },
          { title: "الدولة العباسية" },
        ],
      },
      {
        title: "التاريخ الحديث",
        lessons: [
          { title: "الحملة الفرنسية" },
          { title: "محمد علي باشا" },
          { title: "الثورة العرابية" },
          { title: "ثورة 1919" },
        ],
      },
    ],
  },
  {
    title: "الجغرافيا",
    tracks: [Track.LITERARY],
    chapters: [
      {
        title: "الجغرافيا الطبيعية",
        lessons: [
          { title: "الظواهر الجوية" },
          { title: "المناخ" },
          { title: "التضاريس" },
        ],
      },
      {
        title: "الجغرافيا البشرية",
        lessons: [
          { title: "السكان والهجرة" },
          { title: "الأنشطة الاقتصادية" },
          { title: "المدن والتوسع العمراني" },
        ],
      },
    ],
  },
  {
    title: "الفلسفة وعلم النفس",
    tracks: [Track.LITERARY],
    chapters: [
      {
        title: "الفلسفة",
        lessons: [
          { title: "مقدمة في الفلسفة" },
          { title: "الفلسفة اليونانية" },
          { title: "الفلسفة الإسلامية" },
          { title: "الفلسفة الحديثة" },
        ],
      },
      {
        title: "علم النفس",
        lessons: [
          { title: "مقدمة في علم النفس" },
          { title: "النظريات النفسية" },
          { title: "السلوك الإنساني" },
        ],
      },
    ],
  },
  {
    title: "اللغة العربية",
    tracks: [Track.LITERARY, Track.SCIENCE, Track.SCIENCE_MATH, Track.SCIENCE_SCIENCE],
    chapters: [
      {
        title: "النحو",
        lessons: [
          { title: "أقسام الكلمة" },
          { title: "المبتدأ والخبر" },
          { title: "الفاعل ونائب الفاعل" },
          { title: "المفعول به" },
        ],
      },
      {
        title: "الصرف",
        lessons: [
          { title: "الميزان الصرفي" },
          { title: "الفعل المجرد والمزيد" },
          { title: "المشتقات" },
        ],
      },
      {
        title: "البلاغة",
        lessons: [
          { title: "المعاني" },
          { title: "البيان" },
          { title: "البديع" },
        ],
      },
    ],
  },
];