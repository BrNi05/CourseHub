import { reactive, watchEffect } from 'vue';

import type { AppStoreState } from '../shared/types';
import { appLifecycleState, initialize } from '../app-bootstrap';
import {
  authState,
  deleteProfile,
  isAuthenticated,
  loginWithGoogle,
  logout,
} from '../modules/auth.store';
import { contentState } from '../modules/content.store';
import {
  addCourse,
  clearSelectedCourses,
  coursesState,
  removeCourse,
  searchCourses,
} from '../modules/courses.store';
import { feedbackState, submitErrorReport, submitSuggestion } from '../modules/feedback.store';
import { dismissNotice, notificationsState, notify } from '../modules/notifications.store';
import {
  loadUniversities,
  selectedUniversity,
  universitiesState,
} from '../modules/universities.store';
import { clearCurrentUser } from '../modules/user.store';

const state = reactive<AppStoreState>({
  initialized: appLifecycleState.initialized,
  loadingUniversities: universitiesState.loadingUniversities,
  searchingCourses: coursesState.searchingCourses,
  syncingCourses: coursesState.syncingCourses,
  submittingSuggestion: feedbackState.submittingSuggestion,
  submittingErrorReport: feedbackState.submittingErrorReport,
  deletingProfile: authState.deletingProfile,
  loginInFlight: authState.loginInFlight,
  session: authState.session,
  universities: universitiesState.universities,
  searchFilters: coursesState.searchFilters,
  news: contentState.news,
  selectedCourses: coursesState.selectedCourses,
  searchResults: coursesState.searchResults,
  notices: notificationsState.notices,
});

watchEffect(() => {
  state.initialized = appLifecycleState.initialized;
  state.loadingUniversities = universitiesState.loadingUniversities;
  state.searchingCourses = coursesState.searchingCourses;
  state.syncingCourses = coursesState.syncingCourses;
  state.submittingSuggestion = feedbackState.submittingSuggestion;
  state.submittingErrorReport = feedbackState.submittingErrorReport;
  state.deletingProfile = authState.deletingProfile;
  state.loginInFlight = authState.loginInFlight;
  state.session = authState.session;
  state.universities = universitiesState.universities;
  state.searchFilters = coursesState.searchFilters;
  state.news = contentState.news;
  state.selectedCourses = coursesState.selectedCourses;
  state.searchResults = coursesState.searchResults;
  state.notices = notificationsState.notices;
});

async function logoutAndClearUser(): Promise<void> {
  await logout();
  clearCurrentUser();
}

async function deleteProfileAndClearData(): Promise<boolean> {
  const deleted: boolean = await deleteProfile();

  if (deleted) {
    clearCurrentUser();
    clearSelectedCourses();
  }

  return deleted;
}

export function useAppStore() {
  return {
    state,
    initialize,
    addCourse,
    removeCourse,
    loadUniversities,
    searchCourses,
    loginWithGoogle,
    logout: logoutAndClearUser,
    deleteProfile: deleteProfileAndClearData,
    dismissNotice,
    notify,
    submitSuggestion,
    submitErrorReport,
    selectedUniversity,
    isAuthenticated,
  };
}
