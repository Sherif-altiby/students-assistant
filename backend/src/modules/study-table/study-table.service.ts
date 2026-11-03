import { pdfService } from './pdf.service';
import { studyTableCrudService } from './study-table-crud.service';
import { studyTableGenerationService } from './study-table-generation.service';
import { studyTableProgressService } from './study-table-progress.service';
import { studyTableSessionsService } from './study-table-sessions.service';

export {
  getAvailableMonthRanges,
  getSessionCompletionUpdate,
  getUpdatedRange,
} from './study-table.helpers';
export type { Range, StudySessionResponse } from './study-table.helpers';

export const studyTableService = {
  create: studyTableGenerationService.create,
  getAvailableMonths: studyTableGenerationService.getAvailableMonths,
  generate: studyTableGenerationService.generate,
  getMyTables: studyTableCrudService.getMyTables,
  getById: studyTableCrudService.getById,
  update: studyTableCrudService.update,
  delete: studyTableCrudService.delete,
  createSession: studyTableSessionsService.createSession,
  updateSession: studyTableSessionsService.updateSession,
  deleteSession: studyTableSessionsService.deleteSession,
  replaceDaySessions: studyTableSessionsService.replaceDaySessions,
  completeSession: studyTableSessionsService.completeSession,
  getProgress: studyTableProgressService.getProgress,
  async getConflicts(_userId: string) {
    return [];
  },
  async generatePDF(userId: string, tableId: string): Promise<Buffer> {
    const table = await studyTableCrudService.getPdfData(userId, tableId);
    return pdfService.generateStudyTablePDF(table);
  },
};
