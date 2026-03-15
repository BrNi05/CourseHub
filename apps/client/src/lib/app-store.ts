import { reactive, watch } from 'vue';
import { isAxiosError } from 'axios';
import {
  errorReport,
  findAll,
  ping,
  readOne,
  search,
  suggest,
  updatePinnedCourses,
  type Course,
  type CreateSuggestionDto,
  type ErrorReportDto,
  type UniversityWithoutFacultiesDto,
  type User,
} from '@coursehub/sdk';
import { CLIENT_VERSION, getClientPlatform, type ClientPlatform } from './client-runtime';

type NoticeTone = 'info' | 'success' | 'danger';

// Notification structure
type Notice = {
  id: number;
  tone: NoticeTone;
  title: string;
  detail: string;
  durationMs: number;
};

// Session state structure
type SessionState = {
  token: string | null;
  userId: string | null;
  email: string | null;
};

type SearchFilters = {
  universityId: string;
  courseName: string;
  courseCode: string;
};

type LoginPayload = {
  sub?: string;
  email?: string;
  exp?: number;
};

type PingRegistry = Record<string, true>;

const API_BASE_URL = '/api';
const SESSION_STORAGE_KEY = 'coursehub.web.session';
const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
const PING_STORAGE_KEY = 'coursehub.web.client-pings';
const TOAST_DURATION_MS = 2600;

const state = reactive({
  initialized: false,
  loadingUniversities: false,
  searchingCourses: false,
  syncingCourses: false,
  submittingSuggestion: false,
  submittingErrorReport: false,
  loginInFlight: false,
  session: {
    token: null,
    userId: null,
    email: null,
  } as SessionState,
  universities: [] as UniversityWithoutFacultiesDto[],
  searchFilters: {
    universityId: '',
    courseName: '',
    courseCode: '',
  } as SearchFilters,
  selectedCourses: [] as Course[],
  searchResults: [] as Course[],
  notices: [] as Notice[],
});

let hydrated = false;
let initializePromise: Promise<void> | null = null;
let noticeSequence = 1;
let restoredPendingLogin = false;

hydrateFromStorage();
setupPersistence();

function hydrateFromStorage() {
  if (globalThis.window === undefined) return;

  const savedSession = globalThis.localStorage.getItem(SESSION_STORAGE_KEY);
  const savedDraft = globalThis.localStorage.getItem(DRAFT_STORAGE_KEY);
  const callbackToken = readCallbackToken();

  if (savedSession) {
    try {
      const parsed = JSON.parse(savedSession) as SessionState;
      restoreSession(parsed);
    } catch {
      clearSession();
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
    { deep: true, immediate: true }
  );

  watch(
    () => state.selectedCourses,
    (courses) => {
      if (!hydrated || globalThis.window === undefined) {
        return;
      }

      globalThis.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(courses));
    },
    { deep: true, immediate: true }
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
    if (!base64Url) return null;

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
  if (globalThis.window === undefined) return null;

  const hash = globalThis.location.hash.startsWith('#')
    ? globalThis.location.hash.slice(1)
    : globalThis.location.hash;

  if (!hash) return null;

  return new URLSearchParams(hash).get('token');
}

function clearCallbackTokenFromUrl() {
  if (globalThis.window === undefined) return;

  const sanitizedUrl = `${globalThis.location.pathname}${globalThis.location.search}`;
  globalThis.history.replaceState(null, '', sanitizedUrl);
}

function pingDayKey(now: Date = new Date()) {
  return now.toISOString().slice(0, 10);
}

function pingStorageKey(userId: string, platform: ClientPlatform, day: string = pingDayKey()) {
  return `${userId}:${platform}:${day}`;
}

function readPingRegistry(): PingRegistry {
  if (globalThis.window === undefined) return {};

  const savedRegistry = globalThis.localStorage.getItem(PING_STORAGE_KEY);

  if (!savedRegistry) return {};

  try {
    const parsed = JSON.parse(savedRegistry) as PingRegistry;

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through and reset invalid storage.
  }

  globalThis.localStorage.removeItem(PING_STORAGE_KEY);
  return {};
}

function writePingRegistry(registry: PingRegistry) {
  if (globalThis.window === undefined) return;

  const today = pingDayKey();
  const entries = Object.keys(registry)
    .filter((key) => key.endsWith(`:${today}`))
    .slice(-20)
    .reduce<PingRegistry>((nextRegistry, key) => {
      nextRegistry[key] = true;
      return nextRegistry;
    }, {});

  globalThis.localStorage.setItem(PING_STORAGE_KEY, JSON.stringify(entries));
}

function hasPingedToday(userId: string, platform: ClientPlatform) {
  const registry = readPingRegistry();
  return registry[pingStorageKey(userId, platform)] === true;
}

function markPingedToday(userId: string, platform: ClientPlatform) {
  const registry = readPingRegistry();
  registry[pingStorageKey(userId, platform)] = true;
  writePingRegistry(registry);
}

function getErrorMessage(
  error: unknown,
  fallback: string = 'A művelet sikertelen. Próbáld meg kicsit később.'
) {
  if (isAxiosError(error)) {
    const backendMessage = error.response?.data;

    if (
      backendMessage &&
      typeof backendMessage === 'object' &&
      'message' in backendMessage &&
      typeof backendMessage.message === 'string'
    ) {
      return String(backendMessage.message);
    }

    return error.message || fallback;
  }

  if (error instanceof Error) return error.message;

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

function isExpiredJwtPayload(payload: LoginPayload | null) {
  return typeof payload?.exp === 'number' && payload.exp * 1000 <= Date.now();
}

function applyToken(token: string) {
  const payload = decodeJwtPayload(token);

  if (!payload?.sub || isExpiredJwtPayload(payload)) {
    clearSession();
    return false;
  }

  state.session.token = token;
  state.session.userId = payload.sub;
  state.session.email = payload.email ?? null;
  return true;
}

function restoreSession(session: SessionState) {
  if (!session.token) {
    clearSession();
    return;
  }

  const restored = applyToken(session.token);

  if (!restored) return;

  if (!state.session.email && session.email) {
    state.session.email = session.email;
  }
}

function clearSession() {
  state.session.token = null;
  state.session.userId = null;
  state.session.email = null;
}

function handleUnauthorized() {
  clearSession();
  pushNotice('danger', 'Jelentkezz be', 'A munkamenet lejárt. Jelentkezz be újra a folytatáshoz.');
}

async function pingClient() {
  if (!state.session.userId || !state.session.token) return;

  const platform = getClientPlatform();

  if (hasPingedToday(state.session.userId, platform)) return;

  try {
    await ping({
      ...apiOptions(),
      body: {
        platform,
        version: CLIENT_VERSION,
      },
    });
    markPingedToday(state.session.userId, platform);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    // eslint-disable-next-line no-console
    console.error('Failed to send client ping.', error);
  }
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
    pushNotice('danger', 'Nem sikerült betölteni az egyetemeket', getErrorMessage(error));
  } finally {
    state.loadingUniversities = false;
  }
}

async function loadCurrentUser() {
  if (!state.session.userId || !state.session.token) return;

  try {
    const response = await readOne({
      ...apiOptions(),
      path: { id: state.session.userId },
    });
    applyUserResponse(response.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    pushNotice('danger', 'Nem sikerült betölteni a tárgyaidat', getErrorMessage(error));
  }
}

function applyUserResponse(user: User) {
  state.session.email = user.googleEmail;
  state.selectedCourses = dedupeCourses(user.pinnedCourses ?? []);
}

async function syncPinnedCourses(ids: string[], successTitle: string, successDetail: string) {
  if (!state.session.userId || !state.session.token) {
    pushNotice(
      'info',
      successTitle,
      'A választásaid a mentésre kerültek a böngésződben. Jelentkezz be, hogy minden eszközödön elérhesd őket.'
    );
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
      handleUnauthorized();
      return;
    }

    pushNotice('danger', 'Nem sikerült menteni a tárgyváltoztatásokat', getErrorMessage(error));
  } finally {
    state.syncingCourses = false;
  }
}

async function searchCourses() {
  if (!state.searchFilters.universityId) {
    pushNotice(
      'info',
      'Válassz egy egyetemet',
      'A keresési művelet adott egyetem tárgyain fog futni.'
    );
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
    pushNotice('danger', 'Nem sikerült keresni a tárgyak között', getErrorMessage(error));
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
    try {
      await loadUniversities();

      if (isAuthenticated()) {
        if (restoredPendingLogin && state.selectedCourses.length > 0) {
          await syncPinnedCourses(
            state.selectedCourses.map((course) => course.id),
            'Bejelentkezve',
            'A tárgyaid szinkronizálva lettek.'
          );
          restoredPendingLogin = false;
        } else {
          await loadCurrentUser();
          if (restoredPendingLogin) {
            pushNotice('success', 'Bejelentkezve', 'A tárgyaid szinkronizálva lettek.');
            restoredPendingLogin = false;
          }
        }

        await pingClient();
      } else if (state.selectedCourses.length > 0) {
        pushNotice(
          'info',
          'Helyi mentés betöltve',
          'A helyi mentésed betöltöttük. Jelentkezz be, hogy szinkronizáld a tárgyaidat.'
        );
      }
      state.initialized = true;
    } finally {
      initializePromise = null;
    }
  })();

  await initializePromise;
}

async function addCourse(course: Course) {
  state.selectedCourses = dedupeCourses([...state.selectedCourses, course]);
  await syncPinnedCourses(
    state.selectedCourses.map((entry) => entry.id),
    'Tárgy felvéve',
    `A(z) ${course.name} tárgyat inenntől láthatod a főoldalon.`
  );
}

async function removeCourse(courseId: string) {
  const removedCourse = state.selectedCourses.find((course) => course.id === courseId);
  state.selectedCourses = state.selectedCourses.filter((course) => course.id !== courseId);

  await syncPinnedCourses(
    state.selectedCourses.map((entry) => entry.id),
    'Tárgy eltávolítva',
    removedCourse
      ? `A(z) ${removedCourse.name} tárgy törölve lett a felvettek közül.`
      : 'A tárgy törölve lett a felvettek közül.'
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
  pushNotice(
    'info',
    'Kijelentkezve',
    'A módosításaid innentől csak a böngésződben lesznek elmentve.'
  );
}

async function submitSuggestion(payload: CreateSuggestionDto) {
  if (!state.session.token) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a javaslat elküldése előtt.');
    return false;
  }

  state.submittingSuggestion = true;

  try {
    await suggest({
      ...apiOptions(),
      body: payload,
    });
    pushNotice(
      'success',
      'Javaslat elküldve',
      'A javaslat sikeresen elküldve, és hamarosan feldolgozásra kerül.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice('danger', 'Nem sikerült elküldeni a javaslatot', getErrorMessage(error));
    return false;
  } finally {
    state.submittingSuggestion = false;
  }
}

async function submitErrorReport(payload: ErrorReportDto) {
  if (!state.session.token) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a hibajelentés elküldése előtt.');
    return false;
  }

  state.submittingErrorReport = true;

  try {
    await errorReport({
      ...apiOptions(),
      body: payload,
    });
    pushNotice(
      'success',
      'Hibajelentés elküldve',
      'A hibajelentés sikeresen elküldve, és hamarosan feldolgozásra kerül.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice(
      'danger',
      'Nem sikerült elküldeni a hibajelentést. Ironikus, nemde?',
      getErrorMessage(error)
    );
    return false;
  } finally {
    state.submittingErrorReport = false;
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
    selectedUniversity,
    isAuthenticated,
  };
}
