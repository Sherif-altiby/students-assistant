export interface Habit {
  id: string;
  title: string;
}

export interface HabitHistoryDay {
  date: string; // "YYYY-MM-DD"
  completedHabitIds: string[];
}

export interface HabitHistoryPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  dateRange: { start: string; end: string };
}

export interface HabitHistoryResponse {
  habits: Habit[];
  history: HabitHistoryDay[];
  pagination: HabitHistoryPagination;
}