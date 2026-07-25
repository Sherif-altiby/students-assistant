// src/services/pdf.service.ts
//
// IMPORTANT SETUP STEPS (do this before running):
// 1. npm install pdfmake arabic-reshaper
// 2. Download an Arabic-capable font (Regular + Bold) and place it in your project,
//    e.g. src/assets/fonts/NotoNaskhArabic-Regular.ttf and -Bold.ttf
//    Good free options: "Noto Naskh Arabic" or "Cairo" from Google Fonts
//    (https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic)
// 3. Update FONT_REGULAR_PATH / FONT_BOLD_PATH below to point to those files.

import * as fs from 'fs';
import * as path from 'path';
import * as PdfMake from 'pdfmake';
import ArabicReshaper from 'arabic-reshaper';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';

// Font paths
const FONTS_DIR = path.join(__dirname, '../assets/fonts'); // adjust if needed
const FONT_REGULAR_PATH = path.join(FONTS_DIR, 'NotoNaskhArabic-Regular.ttf');
const FONT_BOLD_PATH    = path.join(FONTS_DIR, 'NotoNaskhArabic-Bold.ttf');

console.log('Font paths:');
console.log('Regular:', FONT_REGULAR_PATH);
console.log('Bold:   ', FONT_BOLD_PATH);

// Helper function to load font as base64 - but we'll use a different approach
function loadFontAsBuffer(fontPath: string): Buffer {
  try {
    if (!fs.existsSync(fontPath)) {
      console.error(`❌ Font not found: ${fontPath}`);
      return Buffer.from('');
    }
    return fs.readFileSync(fontPath);
  } catch (error) {
    console.error(`Error loading font ${fontPath}:`, error);
    return Buffer.from('');
  }
}

const regularFontBuffer = loadFontAsBuffer(FONT_REGULAR_PATH);
const boldFontBuffer    = loadFontAsBuffer(FONT_BOLD_PATH);


const vfs = {
  'NotoNaskhArabic-Regular.ttf': regularFontBuffer.toString('base64'),
  'NotoNaskhArabic-Bold.ttf':    boldFontBuffer.toString('base64'),
};

// Extend pdfmake's vfs
// @ts-ignore
if (PdfMake.vfs) {
  // @ts-ignore
  Object.assign(PdfMake.vfs, vfs);
} else {
  // @ts-ignore
  PdfMake.vfs = vfs;
}

// Register fonts
// @ts-ignore
PdfMake.fonts = {
  NotoNaskhArabic: {
    normal: 'NotoNaskhArabic-Regular.ttf',
    bold: 'NotoNaskhArabic-Bold.ttf',
    italics: 'NotoNaskhArabic-Regular.ttf',
    bolditalics: 'NotoNaskhArabic-Bold.ttf',
  },
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf',
  }
};

const COLORS = {
  ink: '#1e2a4a',
  inkLight: '#3d4d7a',
  accent: '#c9a04d',
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

/* ------------------------------------------------------------------
 * Arabic shaping + bidi handling
 * ------------------------------------------------------------------ */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F]/;

function shapeArabicText(input: unknown): string {
  const text = input == null ? "" : String(input);
  if (!text) return "";

  if (!ARABIC_RANGE.test(text)) {
    return text;
  }

  const runs: { text: string; isArabic: boolean }[] = [];
  let current = "";
  let currentIsArabic: boolean | null = null;

  for (const ch of text) {
    const isArabic = ARABIC_RANGE.test(ch);
    const belongsToCurrent =
      currentIsArabic === null ||
      isArabic === currentIsArabic ||
      ch === " ";

    if (belongsToCurrent) {
      current += ch;
      if (currentIsArabic === null) {
        currentIsArabic = isArabic;
      }
    } else {
      runs.push({
        text: current,
        isArabic: !!currentIsArabic,
      });
      current = ch;
      currentIsArabic = isArabic;
    }
  }

  if (current) {
    runs.push({
      text: current,
      isArabic: !!currentIsArabic,
    });
  }

  return runs
    .map((run) => {
      if (!run.isArabic) {
        return run.text;
      }
      return ArabicReshaper.convertArabic(run.text);
    })
    .join("");
}

/* ------------------------------------------------------------------
 * Helper function to clean up numbers in Arabic text
 * ------------------------------------------------------------------ */
function normalizeNumbers(text: string): string {
  const arabicToWestern: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  return text.replace(/[٠-٩]/g, (match) => arabicToWestern[match] || match);
}

/* ------------------------------------------------------------------
 * Helper function to format day labels properly
 * ------------------------------------------------------------------ */
function formatDayLabel(dayNumber: number): string {
  const simpleOrdinals = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 
                          'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
  
  if (dayNumber <= 10) {
    return `اليوم ${simpleOrdinals[dayNumber - 1]}`;
  }
  
  const units = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 
                 'السادس', 'السابع', 'الثامن', 'التاسع'];
  
  if (dayNumber <= 19) {
    const unit = dayNumber - 10;
    if (unit === 1) {
      return `اليوم الحادي عشر`;
    }
    return `اليوم ${units[unit]} عشر`;
  }
  
  return `اليوم ${dayNumber}`;
}

export const pdfService = {
  generateStudyTablePDF(studyTable: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const safeText = (value: unknown) => {
          const text = value == null ? 'بدون عنوان' : String(value);
          return shapeArabicText(text);
        };
        
        const formatDate = (date: string | Date) => {
          const formatted = new Date(date).toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          return shapeArabicText(normalizeNumbers(formatted));
        };

        // Calculate statistics
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
          { label: 'المواد', value: String(totalSubjects) },
          { label: 'الفصول', value: String(totalChapters) },
          { label: 'الدروس', value: String(totalLessons) },
          { label: 'نسبة الإنجاز', value: `${progress}%` },
        ];

        // Build document content
        const content: Content[] = [];

        // Header
        const startDate = new Date(studyTable.startDate).toLocaleDateString('ar-EG');
        const endDate = new Date(studyTable.endDate).toLocaleDateString('ar-EG');
        const subtitle = shapeArabicText(
          normalizeNumbers(`${studyTable.type || ''}  •  ${startDate} — ${endDate}`)
        );

        content.push({
          text: shapeArabicText(studyTable.title),
          style: 'header',
          alignment: 'center',
          margin: [0, 10, 0, 5],
        });

        content.push({
          text: subtitle,
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        });

        // Statistics cards using a table
        const statsTableBody: any[] = [];
        const statsRow: any[] = [];
        
        stats.forEach((stat, index) => {
          const isLast = index === stats.length - 1;
          statsRow.push({
            stack: [
              {
                text: normalizeNumbers(stat.value),
                style: isLast ? 'statValueDark' : 'statValue',
                alignment: 'center',
                margin: [0, 10, 0, 0],
              },
              {
                text: shapeArabicText(stat.label),
                style: isLast ? 'statLabelDark' : 'statLabel',
                alignment: 'center',
                margin: [0, 5, 0, 10],
              }
            ],
            fillColor: isLast ? COLORS.ink : COLORS.page,
            alignment: 'center',
            margin: [2, 2, 2, 2],
          });
        });
        statsTableBody.push(statsRow);

        content.push({
          table: {
            widths: ['25%', '25%', '25%', '25%'],
            body: statsTableBody,
          },
          layout: {
            hLineWidth: function() { return 1; },
            vLineWidth: function() { return 1; },
            hLineColor: function() { return COLORS.border; },
            vLineColor: function() { return COLORS.border; },
          },
          margin: [0, 0, 0, 20],
        });

        // Process days
        const columns: Column[] = [
          { key: 'subject', header: 'المادة', width: 110, align: 'right' },
          { key: 'chapter', header: 'الفصل', width: 140, align: 'right' },
          { key: 'lesson', header: 'الدرس', width: 165, align: 'right' },
          { key: 'status', header: 'الحالة', width: 80, align: 'center' },
        ];

        studyTable.days.forEach((day: any, index: number) => {
          const dayLabel = shapeArabicText(formatDayLabel(index + 1));
          const dateLabel = formatDate(day.date);

          // Day header - using a table for better alignment and styling
          const dayHeaderTable: any[][] = [];
          dayHeaderTable.push([
            {
              text: dayLabel,
              style: 'dayHeader',
              alignment: 'right',
              fillColor: COLORS.rowAlt,
              color: COLORS.ink,
              fontSize: 13,
              bold: true,
              margin: [10, 8, 10, 8],
            },
            {
              text: dateLabel,
              style: 'dayDate',
              alignment: 'left',
              fillColor: COLORS.rowAlt,
              color: COLORS.muted,
              fontSize: 10,
              margin: [10, 8, 10, 8],
            }
          ]);

          content.push({
            table: {
              widths: ['*', 'auto'],
              body: dayHeaderTable,
            },
            layout: {
              hLineWidth: function() { return 0; },
              vLineWidth: function() { return 0; },
            },
            margin: [0, 10, 0, 5],
          });

          // Build table rows for this day
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
            content.push({
              text: shapeArabicText('لا توجد دروس مجدولة لهذا اليوم.'),
              style: 'emptyMessage',
              alignment: 'center',
              margin: [0, 10, 0, 20],
            });
            return;
          }

          // Create table
          const tableBody: any[] = [];

          // Header row
          const headerRow: any[] = [];
          columns.forEach((col) => {
            headerRow.push({
              text: shapeArabicText(col.header),
              style: 'tableHeader',
              alignment: col.align || 'right',
              fillColor: COLORS.ink,
              color: 'white',
              fontSize: 10,
              bold: true,
              margin: [8, 6, 8, 6],
            });
          });
          tableBody.push(headerRow);

          // Data rows
          rows.forEach((row, rowIndex) => {
            const dataRow: any[] = [];
            columns.forEach((col) => {
              const value = String(row[col.key]);
              
              if (col.key === 'status') {
                const completed = value === 'مكتمل';
                const badgeColor = completed ? COLORS.success : COLORS.pending;
                dataRow.push({
                  text: value,
                  style: 'statusBadge',
                  alignment: 'center',
                  fillColor: badgeColor,
                  color: 'white',
                  fontSize: 8.5,
                  bold: true,
                  margin: [10, 3, 10, 3],
                });
              } else {
                dataRow.push({
                  text: value,
                  style: 'tableCell',
                  alignment: col.align || 'right',
                  fillColor: rowIndex % 2 === 1 ? COLORS.rowAlt : 'white',
                  fontSize: 9.5,
                  color: COLORS.text,
                  margin: [8, 4, 8, 4],
                });
              }
            });
            tableBody.push(dataRow);
          });

          content.push({
            table: {
              headerRows: 1,
              widths: columns.map(col => col.width),
              body: tableBody,
            },
            margin: [0, 5, 0, 20],
            layout: {
              hLineWidth: function(i: number, node: any) {
                return (i === 0 || i === node.table.body.length) ? 1 : 0.5;
              },
              vLineWidth: function() { return 0.5; },
              hLineColor: function() { return COLORS.border; },
              vLineColor: function() { return COLORS.border; },
            }
          });
        });

        // Footer
        content.push({
          columns: [
            {
              width: '*',
              text: shapeArabicText(
                normalizeNumbers(`تم الإنشاء في ${new Date().toLocaleString('ar-EG')}`)
              ),
              style: 'footer',
              alignment: 'right',
              margin: [0, 0, 0, 0],
            },
            {
              width: 'auto',
              text: shapeArabicText(`صفحة ${studyTable.days.length}`),
              style: 'footer',
              alignment: 'left',
              margin: [0, 0, 0, 0],
            }
          ],
          margin: [0, 20, 0, 10],
        });

        // Document definition
        const docDefinition: TDocumentDefinitions = {
          content: content,
          styles: {
            header: {
              fontSize: 24,
              bold: true,
              color: COLORS.ink,
              font: 'NotoNaskhArabic',
            },
            subheader: {
              fontSize: 11,
              color: COLORS.muted,
              font: 'NotoNaskhArabic',
            },
            statValue: {
              fontSize: 20,
              bold: true,
              color: COLORS.ink,
              font: 'NotoNaskhArabic',
            },
            statValueDark: {
              fontSize: 20,
              bold: true,
              color: 'white',
              font: 'NotoNaskhArabic',
            },
            statLabel: {
              fontSize: 9.5,
              color: COLORS.muted,
              font: 'NotoNaskhArabic',
            },
            statLabelDark: {
              fontSize: 9.5,
              color: '#d7dcec',
              font: 'NotoNaskhArabic',
            },
            dayHeader: {
              fontSize: 13,
              bold: true,
              color: COLORS.ink,
              font: 'NotoNaskhArabic',
            },
            dayDate: {
              fontSize: 10,
              color: COLORS.muted,
              font: 'NotoNaskhArabic',
            },
            tableHeader: {
              fontSize: 10,
              bold: true,
              color: 'white',
              font: 'NotoNaskhArabic',
            },
            tableCell: {
              fontSize: 9.5,
              color: COLORS.text,
              font: 'NotoNaskhArabic',
            },
            statusBadge: {
              fontSize: 8.5,
              bold: true,
              font: 'NotoNaskhArabic',
            },
            emptyMessage: {
              fontSize: 10.5,
              color: COLORS.muted,
              font: 'NotoNaskhArabic',
            },
            footer: {
              fontSize: 8.5,
              color: COLORS.muted,
              font: 'NotoNaskhArabic',
            }
          },
          pageMargins: [50, 50, 50, 50],
          defaultStyle: {
            font: 'NotoNaskhArabic',
          },
        };

        // Create PDF
        // @ts-ignore
        const pdfDoc = PdfMake.createPdf(docDefinition);
        
        // Use getBuffer to get the PDF as a buffer
        // @ts-ignore
        pdfDoc.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });

      } catch (error) {
        reject(error);
      }
    });
  },
};