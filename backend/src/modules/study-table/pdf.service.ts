// src/services/pdf.service.ts

import PDFDocument from 'pdfkit';

const PAGE_WIDTH = 495; // content width inside 50pt margins on A4
const MARGIN_X = 50;

const COLORS = {
  ink: '#1e2a4a', // primary — deep navy, one strong identity color
  inkLight: '#3d4d7a',
  accent: '#c9a04d', // muted gold, used sparingly for the "completed" state
  success: '#1f9d6c',
  pending: '#b45309',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e2e6ee',
  rowAlt: '#f6f7fb',
  page: '#ffffff',
};

type Row = Record<string, unknown>;

interface Column {
  key: string;
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

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
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const safeText = (value: unknown) => (value ? String(value) : 'بدون عنوان');
        const formatDate = (date: string | Date) =>
          new Date(date).toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

        /* ------------------------------------------------------------
         * Header banner
         * ---------------------------------------------------------- */
        const addHeader = () => {
          const bannerHeight = 130;

          const gradient = doc.linearGradient(0, 0, doc.page.width, bannerHeight);
          gradient.stop(0, COLORS.ink).stop(1, COLORS.inkLight);
          doc.rect(0, 0, doc.page.width, bannerHeight).fill(gradient);

          // thin gold accent line under the banner — the one deliberate accent
          doc.rect(0, bannerHeight, doc.page.width, 3).fill(COLORS.accent);

          doc
            .fillColor('white')
            .font('Helvetica-Bold')
            .fontSize(24)
            .text(safeText(studyTable.title), MARGIN_X, 38, {
              width: PAGE_WIDTH,
              align: 'center',
            });

          doc
            .fillColor('#d7dcec')
            .font('Helvetica')
            .fontSize(11)
            .text(
              `${safeText(studyTable.type)}  •  ${new Date(studyTable.startDate).toLocaleDateString(
                'ar-EG',
              )} — ${new Date(studyTable.endDate).toLocaleDateString('ar-EG')}`,
              MARGIN_X,
              78,
              { width: PAGE_WIDTH, align: 'center' },
            );

          doc.y = bannerHeight + 30;
        };

        /* ------------------------------------------------------------
         * Stat summary cards
         * ---------------------------------------------------------- */
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
                  if (lesson.completions?.length > 0) completedLessons++;
                });
              });
            });
          });

          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          const stats = [
            { label: 'المواد', value: totalSubjects },
            { label: 'الفصول', value: totalChapters },
            { label: 'الدروس', value: totalLessons },
            { label: 'نسبة الإنجاز', value: `${progress}%` },
          ];

          const cardWidth = (PAGE_WIDTH - 3 * 12) / 4;
          const cardHeight = 68;
          const y = doc.y;

          stats.forEach((stat, i) => {
            const x = MARGIN_X + i * (cardWidth + 12);
            const isLast = i === stats.length - 1;

            doc
              .roundedRect(x, y, cardWidth, cardHeight, 8)
              .fillAndStroke(isLast ? COLORS.ink : COLORS.page, COLORS.border);

            doc
              .fillColor(isLast ? 'white' : COLORS.ink)
              .font('Helvetica-Bold')
              .fontSize(20)
              .text(String(stat.value), x, y + 14, { width: cardWidth, align: 'center' });

            doc
              .fillColor(isLast ? '#d7dcec' : COLORS.muted)
              .font('Helvetica')
              .fontSize(9.5)
              .text(stat.label, x, y + 42, { width: cardWidth, align: 'center' });
          });

          doc.y = y + cardHeight + 28;
        };

        /* ------------------------------------------------------------
         * Generic table renderer — the core redesign.
         * Draws a header row + data rows with real grid lines,
         * alternating backgrounds, and automatic page breaks that
         * repeat the header on the new page.
         * ---------------------------------------------------------- */
        const ROW_HEIGHT = 26;
        const HEADER_HEIGHT = 28;
        const BOTTOM_LIMIT = doc.page.height - 70;

        const drawTableHeader = (columns: Column[], y: number) => {
          doc.rect(MARGIN_X, y, PAGE_WIDTH, HEADER_HEIGHT).fill(COLORS.ink);

          let x = MARGIN_X + PAGE_WIDTH; // start from the right edge (RTL)
          columns.forEach((col) => {
            x -= col.width;
            doc
              .fillColor('white')
              .font('Helvetica-Bold')
              .fontSize(10)
              .text(col.header, x + 8, y + 9, { width: col.width - 16, align: col.align ?? 'right' });
          });

          return y + HEADER_HEIGHT;
        };

        const drawTable = (columns: Column[], rows: Row[], renderCell: (col: Column, row: Row) => string) => {
          let y = doc.y;

          if (y + HEADER_HEIGHT + ROW_HEIGHT > BOTTOM_LIMIT) {
            doc.addPage();
            y = MARGIN_X;
          }

          y = drawTableHeader(columns, y);

          rows.forEach((row, i) => {
            if (y + ROW_HEIGHT > BOTTOM_LIMIT) {
              doc.addPage();
              y = drawTableHeader(columns, MARGIN_X);
            }

            if (i % 2 === 1) {
              doc.rect(MARGIN_X, y, PAGE_WIDTH, ROW_HEIGHT).fill(COLORS.rowAlt);
            }

            let x = MARGIN_X + PAGE_WIDTH;
            columns.forEach((col) => {
              x -= col.width;
              const value = renderCell(col, row);

              if (col.key === 'status') {
                const completed = value === 'مكتمل';
                const badgeColor = completed ? COLORS.success : COLORS.pending;
                const badgeWidth = 68;
                const badgeX = x + (col.width - badgeWidth) / 2;

                doc.roundedRect(badgeX, y + 5, badgeWidth, 16, 8).fill(badgeColor);
                doc
                  .fillColor('white')
                  .font('Helvetica-Bold')
                  .fontSize(8.5)
                  .text(value, badgeX, y + 9.5, { width: badgeWidth, align: 'center' });
              } else {
                doc
                  .fillColor(COLORS.text)
                  .font('Helvetica')
                  .fontSize(9.5)
                  .text(value, x + 8, y + 8, { width: col.width - 16, align: col.align ?? 'right' });
              }
            });

            doc
              .strokeColor(COLORS.border)
              .lineWidth(0.5)
              .moveTo(MARGIN_X, y + ROW_HEIGHT)
              .lineTo(MARGIN_X + PAGE_WIDTH, y + ROW_HEIGHT)
              .stroke();

            y += ROW_HEIGHT;
          });

          doc
            .rect(MARGIN_X, y - rows.length * ROW_HEIGHT - HEADER_HEIGHT, PAGE_WIDTH, rows.length * ROW_HEIGHT + HEADER_HEIGHT)
            .strokeColor(COLORS.border)
            .lineWidth(1)
            .stroke();

          doc.y = y + 20;
        };

        /* ------------------------------------------------------------
         * Day section: title bar + flattened lesson table
         * ---------------------------------------------------------- */
        const columns: Column[] = [
          { key: 'subject', header: 'المادة', width: 110, align: 'right' },
          { key: 'chapter', header: 'الفصل', width: 140, align: 'right' },
          { key: 'lesson', header: 'الدرس', width: 165, align: 'right' },
          { key: 'status', header: 'الحالة', width: 80, align: 'center' },
        ];

        const addDaySection = (day: any, index: number) => {
          if (doc.y + 50 > BOTTOM_LIMIT) doc.addPage();

          const barY = doc.y;
          doc.roundedRect(MARGIN_X, barY, PAGE_WIDTH, 36, 6).fill(COLORS.rowAlt);
          doc.roundedRect(MARGIN_X, barY, 5, 36, 2).fill(COLORS.accent);

          doc
            .fillColor(COLORS.ink)
            .font('Helvetica-Bold')
            .fontSize(13)
            .text(`اليوم ${index + 1}`, MARGIN_X + 20, barY + 8, { width: 150, align: 'right' });

          doc
            .fillColor(COLORS.muted)
            .font('Helvetica')
            .fontSize(10)
            .text(formatDate(day.date), MARGIN_X, barY + 10, { width: PAGE_WIDTH - 20, align: 'left' });

          doc.y = barY + 48;

          const rows: Row[] = [];
          day.subjects?.forEach((subject: any) => {
            subject.chapters?.forEach((chapter: any) => {
              chapter.lessons?.forEach((lesson: any) => {
                rows.push({
                  subject: safeText(subject.title),
                  chapter: safeText(chapter.title),
                  lesson: safeText(lesson.title),
                  status: lesson.completions?.length > 0 ? 'مكتمل' : 'قيد الإنجاز',
                });
              });
            });
          });

          if (rows.length === 0) {
            doc
              .font('Helvetica')
              .fontSize(10.5)
              .fillColor(COLORS.muted)
              .text('لا توجد دروس مجدولة لهذا اليوم.', MARGIN_X, doc.y, { width: PAGE_WIDTH, align: 'center' });
            doc.y += 30;
            return;
          }

          drawTable(columns, rows, (col, row) => String(row[col.key]));
        };

        /* ------------------------------------------------------------
         * Build the document
         * ---------------------------------------------------------- */
        addHeader();
        addStatistics();

        studyTable.days.forEach((day: any, i: number) => addDaySection(day, i));

        /* ------------------------------------------------------------
         * Footer on every page
         * ---------------------------------------------------------- */
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          doc
            .strokeColor(COLORS.border)
            .lineWidth(0.5)
            .moveTo(MARGIN_X, doc.page.height - 55)
            .lineTo(doc.page.width - MARGIN_X, doc.page.height - 55)
            .stroke();

          doc
            .fillColor(COLORS.muted)
            .font('Helvetica')
            .fontSize(8.5)
            .text(`تم الإنشاء في ${new Date().toLocaleString('ar-EG')}`, MARGIN_X, doc.page.height - 42);

          doc
            .fillColor(COLORS.muted)
            .font('Helvetica')
            .fontSize(8.5)
            .text(`صفحة ${i + 1} من ${pages.count}`, MARGIN_X, doc.page.height - 42, {
              width: PAGE_WIDTH,
              align: 'left',
            });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  },
};