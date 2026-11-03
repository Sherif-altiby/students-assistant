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
  ...studyTableGenerationService,
  ...studyTableCrudService,
  ...studyTableSessionsService,
  ...studyTableProgressService,
  async getConflicts(_userId: string) {
    return [];
  },
  async generatePDF(userId: string, tableId: string): Promise<Buffer> {
    const table = await studyTableCrudService.getById(userId, tableId);
    return pdfService.generateStudyTablePDF(table);
  },
};
