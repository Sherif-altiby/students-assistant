import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { StudyTableType } from '@prisma/client';
import { pdfService } from '../../src/modules/study-table/pdf.service';

test('study table PDFs paginate without a two-page cap', async () => {
  const start = new Date('2026-01-01T00:00:00.000Z');
  const days = Array.from({ length: 70 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      sessions: Array.from({ length: 3 }, (_, order) => ({
        order,
        status: order === 0 ? 'LATE' : 'UPCOMING',
        subject: { title: `المادة ${order + 1}` },
        lesson: {
          title: `الدرس ${index + 1} - ${order + 1}`,
          unit: { id: `unit-${order + 1}`, title: `الوحدة ${order + 1}` },
        },
      })),
    };
  });
  try {
    const pdf = await pdfService.generateStudyTablePDF({
      title: 'خطة متعددة الصفحات',
      type: StudyTableType.CUSTOM,
      startDate: '2026-01-01',
      endDate: '2026-03-11',
      days,
    });
    const document = await PDFDocument.load(pdf);
    assert.ok(document.getPageCount() > 2);
  } finally {
    await pdfService.closeBrowser();
  }
});
