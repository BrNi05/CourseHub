import { reactive, watch } from 'vue';
import { isAxiosError } from 'axios';
import {
  errorReport,
  findAll,
  listErrorReports,
  readOne,
  search,
  suggest,
  updatePinnedCourses,
  deleteErrorReport,
  type Course,
  type CreateSuggestionDto,
  type ErrorReportDto,
  type ErrorReportResponseDto,
  type UniversityWithoutFacultiesDto,
  type User,
} from '@coursehub/sdk';

type NoticeTone = 'info' | 'success' | 'danger';

type Notice = {
  id: number;
  tone: NoticeTone;
  title: string;
  detail: string;
  durationMs: number;
};

type SessionState = {
  token: string | null;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
};

type SearchFilters = {
  universityId: string;
  courseName: string;
  courseCode: string;
};

type LoginPayload = {
  sub?: string;
  email?: string;
};

const API_BASE_URL = '/api';
const SESSION_STORAGE_KEY = 'coursehub.web.session';
const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
const TOAST_DURATION_MS = 3600;

const state = reactive({
  initialized: false,
  bootstrapping: false,
  loadingUniversities: false,
  searchingCourses: false,
  syncingCourses: false,
  submittingSuggestion: false,
  submittingErrorReport: false,
  loadingAdminReports: false,
  loginInFlight: false,
  session: {
    token: null,
    userId: null,
    email: null,
    isAdmin: false,
  } as SessionState,
  universities: [] as UniversityWithoutFacultiesDto[],
  searchFilters: {
    universityId: '',
    courseName: '',
    courseCode: '',
  } as SearchFilters,
  selectedCourses: [] as Course[],
  searchResults: [] as Course[],
  adminErrorReports: [] as ErrorReportResponseDto[],
  notices: [] as Notice[],
});

let hydrated = false;
let initializePromise: Promise<void> | null = null;
let noticeSequence = 1;
let restoredPendingLogin = false;

hydrateFromStorage();
setupPersistence();

function hydrateFromStorage() {
  if (globalThis.window === undefined) {
    return;
  }

  const savedSession = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);
  const savedDraft = globalThis.localStorage.getItem(DRAFT_STORAGE_KEY);
  const callbackToken = readCallbackToken();

  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession) as SessionState;
      state.session.token = parsed.token ?? null;
      state.session.userId = parsed.userId ?? null;
      state.session.email = parsed.email ?? null;
      state.session.isAdmin = Boolean(parsed.isAdmin);
    } catch {
      globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  if (callbackToken) {
    applyToken(callbackToken);
    clearCallbackTokenFromUrl();
    restoredPendingLogin = true;
  }

  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft) as Course[];
      state.selectedCourses = dedupeCourses(parsed);
    } catch {
      globalThis.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }

  hydrated = true;
}

function setupPersistence() {
  watch(
    () => state.session,
    (session) => {
      if (!hydrated || globalThis.window === undefined) {
        return;
      }

      if (!session.token || !session.userId) {
        globalThis.localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
      }

      globalThis.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    },
    { deep: true }
  );

  watch(
    () => state.selectedCourses,
    (courses) => {
      if (!hydrated || globalThis.window === undefined) {
        return;
      }

      globalThis.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(courses));
    },
    { deep: true }
  );
}

function dedupeCourses(courses: Course[]) {
  const seen = new Set<string>();
  return courses.filter((course) => {
    if (!course.id || seen.has(course.id)) {
      return false;
    }

    seen.add(course.id);
    return true;
  });
}

function decodeJwtPayload(token: string): LoginPayload | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = globalThis.atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json) as LoginPayload;
  } catch {
    return null;
  }
}

function apiOptions(tokenOverride?: string | null) {
  const token = tokenOverride ?? state.session.token;

  return {
    auth: token ?? undefined,
    baseURL: API_BASE_URL,
    throwOnError: true as const,
  };
}

function readCallbackToken() {
  if (globalThis.window === undefined) {
    return null;
  }

  const hash = globalThis.location.hash.startsWith('#')
    ? globalThis.location.hash.slice(1)
    : globalThis.location.hash;

  if (!hash) {
    return null;
  }

  return new URLSearchParams(hash).get('token');
}

function clearCallbackTokenFromUrl() {
  if (globalThis.window === undefined) {
    return;
  }

  const sanitizedUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
  globalThis.history.replaceState(null, '', sanitizedUrl);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const backendMessage = error.response?.data;

    if (
      backendMessage &&
      typeof backendMessage === 'object' &&
      'message' in backendMessage &&
      typeof backendMessage.message === 'string'
    ) {
      return backendMessage.message;
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function pushNotice(tone: NoticeTone, title: string, detail: string) {
  const notice: Notice = {
    id: noticeSequence++,
    tone,
    title,
    detail,
    durationMs: TOAST_DURATION_MS,
  };

  state.notices = [...state.notices, notice];

  globalThis.setTimeout(() => {
    dismissNotice(notice.id);
  }, TOAST_DURATION_MS);
}

function dismissNotice(id: number) {
  state.notices = state.notices.filter((notice) => notice.id !== id);
}

function selectedUniversity() {
  return (
    state.universities.find((university) => university.id === state.searchFilters.universityId) ??
    null
  );
}

function isAuthenticated() {
  return Boolean(state.session.token && state.session.userId);
}

function applyToken(token: string) {
  const payload = decodeJwtPayload(token);

  state.session.token = token;
  state.session.userId = payload?.sub ?? null;
  state.session.email = payload?.email ?? null;
}

function clearSession() {
  state.session.token = null;
  state.session.userId = null;
  state.session.email = null;
  state.session.isAdmin = false;
  state.adminErrorReports = [];
}

function handleUnauthorized(detail: string) {
  clearSession();
  pushNotice('danger', 'Login required again', detail);
}

async function loadUniversities() {
  state.loadingUniversities = true;

  try {
    const response = await findAll(apiOptions(null));
    state.universities = response.data;

    const [firstUniversity] = state.universities;

    if (!state.searchFilters.universityId && firstUniversity) {
      state.searchFilters.universityId = firstUniversity.id;
    }
  } catch (error) {
    pushNotice('danger', 'Could not load universities', getErrorMessage(error, 'Request failed.'));
  } finally {
    state.loadingUniversities = false;
  }
}

async function loadCurrentUser() {
  if (!state.session.userId || !state.session.token) {
    return;
  }

  try {
    const response = await readOne({
      ...apiOptions(),
      path: { id: state.session.userId },
    });
    applyUserResponse(response.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('Your saved JWT is no longer valid. Please sign in again.');
      return;
    }

    pushNotice('danger', 'Could not load your courses', getErrorMessage(error, 'Request failed.'));
  }
}

function applyUserResponse(user: User) {
  state.session.email = user.googleEmail;
  state.session.isAdmin = user.isAdmin;
  state.selectedCourses = dedupeCourses(user.pinnedCourses ?? []);
}

async function syncPinnedCourses(ids: string[], successTitle: string, successDetail: string) {
  if (!state.session.userId || !state.session.token) {
    pushNotice('info', successTitle, 'Saved locally. Log in to sync it to your account.');
    return;
  }

  state.syncingCourses = true;

  try {
    const response = await updatePinnedCourses({
      ...apiOptions(),
      body: { pinnedCourses: ids },
      path: { id: state.session.userId },
    });
    applyUserResponse(response.data);
    pushNotice('success', successTitle, successDetail);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('The backend rejected your session while saving course changes.');
      return;
    }

    pushNotice(
      'danger',
      'Could not save course changes',
      getErrorMessage(error, 'Request failed.')
    );
  } finally {
    state.syncingCourses = false;
  }
}

async function searchCourses() {
  if (!state.searchFilters.universityId) {
    pushNotice('info', 'University required', 'Choose a university before searching for courses.');
    return;
  }

  state.searchingCourses = true;

  try {
    const response = await search({
      ...apiOptions(null),
      query: {
        universityId: state.searchFilters.universityId,
        courseName: state.searchFilters.courseName.trim() || undefined,
        courseCode: state.searchFilters.courseCode.trim() || undefined,
      },
    });
    state.searchResults = response.data;
  } catch (error) {
    pushNotice('danger', 'Could not search courses', getErrorMessage(error, 'Request failed.'));
  } finally {
    state.searchingCourses = false;
  }
}

async function initialize() {
  if (state.initialized) {
    return;
  }

  if (initializePromise) {
    await initializePromise;
    return;
  }

  initializePromise = (async () => {
    state.bootstrapping = true;

    try {
      await loadUniversities();

      if (isAuthenticated()) {
        if (state.selectedCourses.length > 0) {
          const syncTitle = restoredPendingLogin ? 'Logged in' : 'Draft restored';
          const syncDetail = restoredPendingLogin
            ? 'Your current course setup was synced to the backend.'
            : 'Your locally saved course draft was synced to the backend.';

          await syncPinnedCourses(
            state.selectedCourses.map((course) => course.id),
            syncTitle,
            syncDetail
          );
          restoredPendingLogin = false;
        } else {
          await loadCurrentUser();
          if (restoredPendingLogin) {
            pushNotice('success', 'Logged in', 'Your Google session is active and ready.');
            restoredPendingLogin = false;
          }
        }
      } else if (state.selectedCourses.length > 0) {
        pushNotice(
          'info',
          'Draft restored',
          'Local course selections were restored. Log in to sync them to your account.'
        );
      }
      state.initialized = true;
    } finally {
      state.bootstrapping = false;
      initializePromise = null;
    }
  })();

  await initializePromise;
}

async function addCourse(course: Course) {
  state.selectedCourses = dedupeCourses([...state.selectedCourses, course]);
  await syncPinnedCourses(
    state.selectedCourses.map((entry) => entry.id),
    'Course added',
    `${course.name} is now part of your current course setup.`
  );
}

async function removeCourse(courseId: string) {
  const removedCourse = state.selectedCourses.find((course) => course.id === courseId);
  state.selectedCourses = state.selectedCourses.filter((course) => course.id !== courseId);

  await syncPinnedCourses(
    state.selectedCourses.map((entry) => entry.id),
    'Course removed',
    removedCourse
      ? `${removedCourse.name} was removed from your current course setup.`
      : 'The course was removed from your current course setup.'
  );
}

function loginWithGoogle() {
  if (state.loginInFlight) {
    return;
  }

  state.loginInFlight = true;
  globalThis.location.assign(`${API_BASE_URL}/auth/google`);
}

function logout() {
  clearSession();
  pushNotice('info', 'Logged out', 'Local draft courses remain available on this device.');
}

async function submitSuggestion(payload: CreateSuggestionDto) {
  if (!state.session.token) {
    pushNotice('info', 'Login required', 'Sign in with Google before sending a suggestion.');
    return false;
  }

  state.submittingSuggestion = true;

  try {
    await suggest({
      ...apiOptions(),
      body: payload,
    });
    pushNotice('success', 'Suggestion sent', 'The backend received your course update proposal.');
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('The backend rejected your session while sending the suggestion.');
      return false;
    }

    pushNotice('danger', 'Could not send suggestion', getErrorMessage(error, 'Request failed.'));
    return false;
  } finally {
    state.submittingSuggestion = false;
  }
}

async function submitErrorReport(payload: ErrorReportDto) {
  if (!state.session.token) {
    pushNotice('info', 'Login required', 'Sign in with Google before sending an error report.');
    return false;
  }

  state.submittingErrorReport = true;

  try {
    await errorReport({
      ...apiOptions(),
      body: payload,
    });
    pushNotice('success', 'Error report sent', 'The backend team can review the report now.');
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('The backend rejected your session while sending the error report.');
      return false;
    }

    pushNotice('danger', 'Could not send error report', getErrorMessage(error, 'Request failed.'));
    return false;
  } finally {
    state.submittingErrorReport = false;
  }
}

async function loadAdminErrorReports() {
  if (!state.session.isAdmin || !state.session.token) {
    return;
  }

  state.loadingAdminReports = true;

  try {
    const response = await listErrorReports(apiOptions());
    state.adminErrorReports = response.data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('The backend rejected your session while loading admin error reports.');
      return;
    }

    pushNotice('danger', 'Could not load admin reports', getErrorMessage(error, 'Request failed.'));
  } finally {
    state.loadingAdminReports = false;
  }
}

async function removeAdminErrorReport(fileName: string) {
  try {
    await deleteErrorReport({
      ...apiOptions(),
      path: { fileName },
    });
    state.adminErrorReports = state.adminErrorReports.filter(
      (report) => `${report.userId}-${report.receivedAt}` !== fileName
    );
    pushNotice('success', 'Admin report removed', 'The stored backend report was deleted.');
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized('The backend rejected your session while deleting an admin report.');
      return;
    }

    pushNotice(
      'danger',
      'Could not delete admin report',
      getErrorMessage(error, 'Request failed.')
    );
  }
}

export function useAppStore() {
  return {
    state,
    initialize,
    addCourse,
    removeCourse,
    searchCourses,
    loginWithGoogle,
    logout,
    dismissNotice,
    submitSuggestion,
    submitErrorReport,
    loadAdminErrorReports,
    removeAdminErrorReport,
    selectedUniversity,
    isAuthenticated,
  };
}
