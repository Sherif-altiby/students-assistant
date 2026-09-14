import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const DAY_ORDER = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type LessonDatePdfItem = {
  id: string;
  subject: string;
  teacher: string;
  dayName: string;
  startTime: string;
  endTime: string;
};

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function buildRows(entries: LessonDatePdfItem[]) {
  const ordered = [...entries].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.dayName) - DAY_ORDER.indexOf(b.dayName);
    if (dayDiff !== 0) return dayDiff;
    return toMinutes(a.startTime) - toMinutes(b.startTime);
  });

  const rows: Array<Array<string | { text: string; bold?: boolean; fillColor?: string; color?: string }>> = [
    [
      { text: 'اليوم', bold: true, fillColor: '#0f172a', color: '#ffffff' },
      { text: 'المادة', bold: true, fillColor: '#0f172a', color: '#ffffff' },
      { text: 'المعلم', bold: true, fillColor: '#0f172a', color: '#ffffff' },
      { text: 'الوقت', bold: true, fillColor: '#0f172a', color: '#ffffff' },
    ],
  ];

  for (const day of DAY_ORDER) {
    const dayEntries = ordered.filter((item) => item.dayName === day);
    if (dayEntries.length === 0) continue;

    rows.push([
      { text: day, bold: true, fillColor: '#e2e8f0' },
      { text: '', bold: true },
      { text: '', bold: true },
      { text: '', bold: true },
    ]);

    for (const item of dayEntries) {
      rows.push(['', item.subject, item.teacher, `${item.startTime} - ${item.endTime}`]);
    }
  }

  return rows;
}

export const lessonDatePdfService = {
  async generateLessonDatesPdf(entries: LessonDatePdfItem[]): Promise<Buffer> {
    const data = buildRows(entries);
    const docDefinition = {
      content: [
        {
          text: 'مواعيد الدروس',
          style: 'header',
          alignment: 'center',
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*'],
            body: data,
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1',
            paddingLeft: () => 8,
            paddingRight: () => 8,
            paddingTop: () => 6,
            paddingBottom: () => 6,
          },
        },
      ],
      defaultStyle: {
        font: 'Roboto',
        direction: 'rtl',
      },
      styles: {
        header: {
          fontSize: 22,
          bold: true,
          margin: [0, 0, 0, 12],
        },
      },
      fonts: {
        Roboto: {
          normal: 'Roboto-Regular.ttf',
          bold: 'Roboto-Medium.ttf',
          italics: 'Roboto-Italic.ttf',
          bolditalics: 'Roboto-MediumItalic.ttf',
        },
      },
    } as any;

    const fontBundle = (pdfFonts as any)?.default ?? (pdfFonts as any);
    const vfs = fontBundle?.pdfMake?.vfs ?? fontBundle?.vfs ?? {};
    (pdfMake as any).vfs = vfs;

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const pdfDocGenerator = pdfMake.createPdf(docDefinition);
        void (async () => {
          const buffer = await (pdfDocGenerator as any).getBuffer();
          resolve(Buffer.from(buffer));
        })().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  },
};
