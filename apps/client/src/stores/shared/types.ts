import type { Course, UniversityWithoutFacultiesDto } from '@coursehub/sdk';

export type NoticeTone = 'info' | 'success' | 'danger';

export type Notice = {
  id: number;
  tone: NoticeTone;
  title: string;
  detail: string;
  durationMs: number;
};

export type SessionState = {
  userId: string | null;
  email: string | null;
};

export type SearchFilters = {
  universityId: string;
  courseName: string;
  courseCode: string;
};

export type PingRegistry = Record<string, true>;

export type AppStoreState = {
  initialized: boolean;
  loadingUniversities: boolean;
  searchingCourses: boolean;
  syncingCourses: boolean;
  submittingSuggestion: boolean;
  submittingErrorReport: boolean;
  deletingProfile: boolean;
  loginInFlight: boolean;
  session: SessionState;
  universities: UniversityWithoutFacultiesDto[];
  searchFilters: SearchFilters;
  news: string[];
  selectedCourses: Course[];
  searchResults: Course[];
  notices: Notice[];
};
