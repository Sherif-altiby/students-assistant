import { prisma } from '../../config/prisma';
import { lessonDatePdfService } from './lesson-date-pdf.service';

export const lessonDatesService = {
  async generatePDF(userId: string): Promise<Buffer> {
    const entries = await prisma.lessonDate.findMany({
      where: { userId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return lessonDatePdfService.generateLessonDatesPdf(
      entries.map((entry) => ({
        id: entry.id,
        subject: entry.subject,
        teacher: entry.teacher,
        dayName: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
      }))
    );
  },
};
