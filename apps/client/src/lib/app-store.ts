import { reactive, watch } from 'vue';
import { isAxiosError } from 'axios';
import {
  delete2 as deleteUser,
  errorReport,
  findAll,
  logout as logoutRequest,
  me,
  news,
  ping,
  readOne,
  search,
  suggest,
  updatePinnedCourses,
  type AuthSessionDto,
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
  userId: string | null;
  email: string | null;
};

type SearchFilters = {
  universityId: string;
  courseName: string;
  courseCode: string;
};

type PingRegistry = Record<string, true>;

const DRAFT_STORAGE_KEY = 'coursehub.web.draft-courses';
const PING_STORAGE_KEY = 'coursehub.web.client-pings';
const TOAST_DURATION_MS = 2400;
const MAX_VISIBLE_NOTIFICATIONS = 3;

const state = reactive({
  initialized: false,
  loadingUniversities: false,
  searchingCourses: false,
  syncingCourses: false,
  submittingSuggestion: false,
  submittingErrorReport: false,
  deletingProfile: false,
  loginInFlight: false,
  session: {
    userId: null,
    email: null,
  } as SessionState,
  universities: [] as UniversityWithoutFacultiesDto[],
  searchFilters: {
    universityId: '',
    courseName: '',
    courseCode: '',
  } as SearchFilters,
  news: [] as string[],
  selectedCourses: [] as Course[],
  searchResults: [] as Course[],
  notices: [] as Notice[],
});

let initializePromise: Promise<void> | null = null;
let sessionPromise: Promise<AuthSessionDto | null> | null = null;
let universitiesPromise: Promise<void> | null = null;
let noticeSequence = 1;
let pendingLoginNotice = false;
let cachedSession: AuthSessionDto | null = null;

hydrateFromStorage();
setupPersistence();

function hydrateFromStorage() {
  if (globalThis.window === undefined) return;

  const savedDraft = globalThis.localStorage.getItem(DRAFT_STORAGE_KEY);
  pendingLoginNotice = readLoginResultFromUrl() === 'success';
  clearLoginResultFromUrl();

  if (savedDraft) {
    try {
      const parsed = JSON.parse(savedDraft) as Course[];
      state.selectedCourses = dedupeCourses(parsed);
    } catch {
      globalThis.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }
}

function setupPersistence() {
  watch(
    () => state.selectedCourses,
    (courses) => {
      if (globalThis.window === undefined) {
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

function normalizeNewsItems(items: string[]) {
  return [...items]
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .reverse();
}

function apiOptions() {
  return {
    baseURL: '/api',
    withCredentials: true,
    throwOnError: true as const,
  };
}

function readLoginResultFromUrl() {
  if (globalThis.window === undefined) return null;

  return new URLSearchParams(globalThis.location.search).get('login');
}

function clearLoginResultFromUrl() {
  if (globalThis.window === undefined) return;

  const url = new URL(globalThis.location.href);
  url.searchParams.delete('login');
  globalThis.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
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

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // Fall through and reset invalid storage
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

    if (backendMessage && typeof backendMessage === 'object' && 'message' in backendMessage) {
      const message = backendMessage.message;

      if (typeof message === 'string') return message;

      if (Array.isArray(message)) {
        const normalized = message.filter((item): item is string => typeof item === 'string');

        if (normalized.length > 0) return normalized.join('\n\n');
      }
    }

    if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
      return backendMessage;
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

  const visibleNotifications = state.notices.slice(-(MAX_VISIBLE_NOTIFICATIONS - 1));
  state.notices = [...visibleNotifications, notice];

  globalThis.setTimeout(() => {
    dismissNotice(notice.id);
  }, TOAST_DURATION_MS);
}

function dismissNotice(id: number) {
  state.notices = state.notices.filter((notice) => notice.id !== id);
}

// Can be called from components to trigger a notification toast
function notify(tone: NoticeTone, title: string, detail: string) {
  pushNotice(tone, title, detail);
}

function selectedUniversity() {
  return (
    state.universities.find((university) => university.id === state.searchFilters.universityId) ??
    null
  );
}

function isAuthenticated() {
  return Boolean(state.session.userId);
}

function applyAuthSession(session: AuthSessionDto) {
  cachedSession = session;
  state.session.userId = session.id;
}

function clearSession() {
  cachedSession = null;
  sessionPromise = null;
  state.session.userId = null;
  state.session.email = null;

  if (globalThis.window !== undefined) {
    globalThis.localStorage.removeItem(PING_STORAGE_KEY);
  }
}

function handleUnauthorized(showNotice: boolean = true) {
  clearSession();

  if (!showNotice) return;

  pushNotice('danger', 'Jelentkezz be', 'A munkamenet lejárt. Jelentkezz be újra a folytatáshoz.');
}

async function getCurrentSession(notifyOnUnauthorized: boolean = true) {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionPromise) {
    return await sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      const sessionResponse = await me(apiOptions());
      applyAuthSession(sessionResponse.data);
      return sessionResponse.data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        handleUnauthorized(notifyOnUnauthorized);
        return null;
      }

      pushNotice('danger', 'Nem sikerült betölteni a tárgyaidat', getErrorMessage(error));
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return await sessionPromise;
}

async function pingClient() {
  if (!state.session.userId) return;

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
  if (state.universities.length > 0) return;

  if (universitiesPromise) {
    await universitiesPromise;
    return;
  }

  universitiesPromise = (async () => {
    state.loadingUniversities = true;

    try {
      const response = await findAll(apiOptions());
      state.universities = response.data;

      const [firstUniversity] = state.universities;

      if (!state.searchFilters.universityId && firstUniversity) {
        state.searchFilters.universityId = firstUniversity.id;
      }
    } catch (error) {
      pushNotice('danger', 'Nem sikerült betölteni az egyetemeket', getErrorMessage(error));
    } finally {
      state.loadingUniversities = false;
      universitiesPromise = null;
    }
  })();

  await universitiesPromise;
}

async function loadNews() {
  try {
    const response = await news(apiOptions());
    state.news = normalizeNewsItems(response.data);
  } catch (error) {
    pushNotice('danger', 'Nem sikerült betölteni a híreket', getErrorMessage(error));
  }
}

async function loadCurrentUser(notifyOnUnauthorized: boolean = true) {
  const session = await getCurrentSession(notifyOnUnauthorized);
  if (!session) return false;

  try {
    const response = await readOne({
      ...apiOptions(),
      path: { id: session.id },
    });
    applyUserResponse(response.data);
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized(notifyOnUnauthorized);
      return false;
    }

    pushNotice('danger', 'Nem sikerült betölteni a tárgyaidat', getErrorMessage(error));
    return false;
  }
}

function applyUserResponse(user: User) {
  state.session.userId = user.id;
  state.session.email = user.googleEmail;
  state.selectedCourses = dedupeCourses(user.pinnedCourses ?? []);
}

async function syncPinnedCourses(ids: string[], successTitle: string, successDetail: string) {
  if (!state.session.userId) {
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
      ...apiOptions(),
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
      await loadNews();

      const userLoaded = await loadCurrentUser(false);
      if (userLoaded) {
        if (pendingLoginNotice) {
          pushNotice('success', 'Bejelentkezve', 'Mentett tárgyak betöltve.');
        }
        await pingClient();
      } else if (pendingLoginNotice) {
        pushNotice(
          'danger',
          'A bejelentkezés nem sikerült',
          'Ellenőrizd a sütibeállításokat, majd próbáld újra.'
        );
      } else if (state.selectedCourses.length > 0) {
        pushNotice(
          'info',
          'Helyi mentés betöltve',
          'A helyi mentésed betöltöttük. Jelentkezz be, hogy szinkronizáld a tárgyaidat.'
        );
      }

      pendingLoginNotice = false;
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
  if (state.loginInFlight) return;

  state.loginInFlight = true;
  globalThis.setTimeout(() => {
    state.loginInFlight = false;
  }, 3000);
  globalThis.location.assign(`api/auth/google`);
}

async function logout() {
  try {
    await logoutRequest(apiOptions());
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      clearSession();
    } else {
      pushNotice('danger', 'Nem sikerült kijelentkezni', getErrorMessage(error));
      return;
    }
  }

  clearSession();
  pushNotice(
    'info',
    'Kijelentkezve',
    'A módosításaid innentől csak a böngésződben lesznek elmentve.'
  );
}

async function deleteProfile() {
  if (!state.session.userId) {
    pushNotice('info', 'Bejelentkezés szükséges', 'Jelentkezz be a profil törléséhez.');
    return false;
  }

  state.deletingProfile = true;

  try {
    await deleteUser({
      ...apiOptions(),
      path: { id: state.session.userId },
    });

    clearSession();
    state.selectedCourses = [];

    pushNotice(
      'success',
      'Profil törölve',
      'A fiókod és a szerveren tárolt felvett tárgyaid törölve lettek.'
    );
    return true;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      handleUnauthorized();
      return false;
    }

    pushNotice('danger', 'Nem sikerült törölni a profilt', getErrorMessage(error));
    return false;
  } finally {
    state.deletingProfile = false;
  }
}

async function submitSuggestion(payload: CreateSuggestionDto) {
  if (!isAuthenticated()) {
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
  if (!isAuthenticated()) {
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
    loadUniversities,
    searchCourses,
    loginWithGoogle,
    logout,
    deleteProfile,
    dismissNotice,
    notify,
    submitSuggestion,
    submitErrorReport,
    selectedUniversity,
    isAuthenticated,
  };
}
