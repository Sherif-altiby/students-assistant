// src/services/pdf.service.ts

import PDFDocument from 'pdfkit';

const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#16a34a',
  warning: '#f59e0b',
  light: '#f8fafc',
  border: '#e2e8f0',
  dark: '#0f172a',
};

export const pdfService = {
  generateStudyTablePDF(studyTable: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true,
          info: {
            Title: `جدول المذاكرة: ${studyTable.title}`,
            Author: 'تطبيق تنظيم المذاكرة',
          },
        });

        const buffers: Buffer[] = [];

        doc.on('data', (chunk) => buffers.push(chunk));

        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });

        doc.on('error', reject);

        /******************************
         * Helpers
         ******************************/

        const safeText = (value: unknown) => (value ? String(value) : 'بدون عنوان');

        const formatDate = (date: string | Date) =>
          new Date(date).toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

        const addHeader = () => {
          doc.rect(0, 0, doc.page.width, 140).fill(COLORS.primary);

          doc
            .fillColor('white')
            .font('Helvetica-Bold')
            .fontSize(28)
            .text(safeText(studyTable.title), 50, 35, {
              width: doc.page.width - 100,
              align: 'center',
            });

          doc
            .font('Helvetica')
            .fontSize(12)
            .text(
              `نوع الجدول: ${safeText(studyTable.type)} • من ${new Date(
                studyTable.startDate
              ).toLocaleDateString('ar-EG')} إلى ${new Date(studyTable.endDate).toLocaleDateString(
                'ar-EG'
              )}`,
              {
                width: doc.page.width - 100,
                align: 'center',
              }
            );

          doc.y = 180;
        };

        const addStatistics = () => {
          let totalSubjects = 0;
          let totalChapters = 0;
          let totalLessons = 0;
          let completedLessons = 0;

          studyTable.days.forEach((day: any) => {
            totalSubjects += day.subjects?.length ?? 0;

            day.subjects?.forEach((subject: any) => {
              totalChapters += subject.chapters?.length ?? 0;

              subject.chapters?.forEach((chapter: any) => {
                totalLessons += chapter.lessons?.length ?? 0;

                chapter.lessons?.forEach((lesson: any) => {
                  if (lesson.completions?.length > 0) {
                    completedLessons++;
                  }
                });
              });
            });
          });

          const stats = [
            {
              title: 'المواد',
              value: totalSubjects,
            },
            {
              title: 'الفصول',
              value: totalChapters,
            },
            {
              title: 'الدروس',
              value: totalLessons,
            },
            {
              title: 'المنجزة',
              value: completedLessons,
            },
          ];

          const cardWidth = 115;
          const gap = 10;
          const startX = 50;
          const y = doc.y;

          stats.forEach((stat, index) => {
            const x = startX + index * (cardWidth + gap);

            doc.roundedRect(x, y, cardWidth, 75, 10).fillAndStroke(COLORS.light, COLORS.border);

            doc
              .fillColor(COLORS.primary)
              .font('Helvetica-Bold')
              .fontSize(22)
              .text(String(stat.value), x, y + 18, {
                width: cardWidth,
                align: 'center',
              });

            doc
              .fillColor(COLORS.secondary)
              .font('Helvetica')
              .fontSize(10)
              .text(stat.title, x, y + 50, {
                width: cardWidth,
                align: 'center',
              });
          });

          doc.moveDown(6);
        };

        const addDayHeader = (day: any, index: number) => {
          const cardHeight = 70;

          if (doc.y + cardHeight > doc.page.height - 100) {
            doc.addPage();
          }

          const top = doc.y;

          doc.roundedRect(50, top, 495, cardHeight, 12).fillAndStroke(COLORS.light, COLORS.border);

          doc.roundedRect(50, top, 8, cardHeight, 4).fill(COLORS.primary);

          doc
            .fillColor(COLORS.dark)
            .font('Helvetica-Bold')
            .fontSize(16)
            .text(`اليوم ${index + 1}`, 75, top + 18);

          doc
            .fillColor(COLORS.secondary)
            .font('Helvetica')
            .fontSize(11)
            .text(formatDate(day.date), 75, top + 42);

          doc.moveDown(4);
        };

        const addLesson = (lesson: any, index: number) => {
          const completed = lesson.completions?.length > 0;

          const status = completed ? 'مكتمل' : 'قيد الإنجاز';

          const badgeColor = completed ? COLORS.success : COLORS.warning;

          const y = doc.y;

          if (y > doc.page.height - 100) {
            doc.addPage();
          }

          doc
            .fillColor(COLORS.dark)
            .font('Helvetica')
            .fontSize(11)
            .text(`${index + 1}. ${safeText(lesson.title)}`, 100, y, {
              width: 300,
            });

          doc.roundedRect(430, y - 2, 90, 18, 8).fill(badgeColor);

          doc
            .fillColor('white')
            .font('Helvetica-Bold')
            .fontSize(9)
            .text(status, 430, y + 3, {
              width: 90,
              align: 'center',
            });

          doc.moveDown(0.9);
        };

        /******************************
         * Document
         ******************************/

        addHeader();

        addStatistics();

        studyTable.days.forEach((day: any, dayIndex: number) => {
          addDayHeader(day, dayIndex);

          if (!day.subjects?.length) {
            doc
              .font('Helvetica')
              .fontSize(11)
              .fillColor(COLORS.secondary)
              .text('لا توجد مواد مجدولة لهذا اليوم.', 75)
              .moveDown(2);

            return;
          }

          day.subjects.forEach((subject: any, subjectIndex: number) => {
            doc
              .fillColor(COLORS.primary)
              .font('Helvetica-Bold')
              .fontSize(14)
              .text(`${subjectIndex + 1}. ${safeText(subject.title)}`, 75)
              .moveDown(0.4);

            if (!subject.chapters?.length) {
              doc
                .font('Helvetica')
                .fontSize(11)
                .fillColor(COLORS.secondary)
                .text('لا توجد فصول', 90)
                .moveDown();

              return;
            }

            subject.chapters.forEach((chapter: any, chapterIndex: number) => {
              doc
                .fillColor(COLORS.secondary)
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`${String.fromCharCode(97 + chapterIndex)}. ${safeText(chapter.title)}`, 90)
                .moveDown(0.3);

              if (!chapter.lessons?.length) {
                doc
                  .font('Helvetica')
                  .fontSize(10)
                  .fillColor('#94a3b8')
                  .text('لا توجد فصول', 90)
                  .moveDown();

                return;
              }

              chapter.lessons.forEach((lesson: any, lessonIndex: number) => {
                addLesson(lesson, lessonIndex);
              });

              doc.moveDown(0.8);
            });

            doc
              .strokeColor(COLORS.border)
              .lineWidth(1)
              .moveTo(75, doc.y)
              .lineTo(525, doc.y)
              .stroke()
              .moveDown();
          });

          doc.moveDown(1);
        });

        /******************************
         * Footer
         ******************************/

        const pages = doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          doc
            .strokeColor(COLORS.border)
            .moveTo(50, doc.page.height - 60)
            .lineTo(doc.page.width - 50, doc.page.height - 60)
            .stroke();

          doc
            .fillColor(COLORS.secondary)
            .font('Helvetica')
            .fontSize(9)
            .text(`تم إنشاء الملف بتاريخ ${new Date().toLocaleString('ar-EG')}`, 50, doc.page.height - 45);

          doc.text(`الصفحة ${i + 1} من ${pages.count}`, 0, doc.page.height - 45, {
            align: 'right',
          });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },
};
