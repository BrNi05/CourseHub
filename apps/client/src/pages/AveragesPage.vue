<script setup lang="ts">
import { isAxiosError } from 'axios';
import { computed, reactive, watch } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import {
  deleteOwnCreditProfile,
  fetchOwnCreditProfile,
  saveOwnCreditProfile,
} from '@/api/averages.api';
import { rememberRouteIntent } from '@/router/routing-manager';
import { useAppStore } from '@/stores/composables/use-app-store';

type CalculatorCourse = {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: number | null;
};

type Semester = {
  id: string;
  name: string;
  courses: CalculatorCourse[];
};

type SelectedCourseOption = {
  id: string;
  name: string;
  code: string;
  credits: number;
};

type CreditCalculatorData = {
  semesters: Semester[];
};

const CREDIT_CALCULATOR_STORAGE_KEY = 'coursehub.web.averages-calculator';
const CREDITS_PER_SEMESTER = 30;

const app = useAppStore();
let serverProfileLoadedForUserId: string | null = null;
const initialCalculatorData = hydrateAveragesCalculator();

const state = reactive({
  loadedFromServer: false,
  serverHasSavedProfile: false,
  loadingServer: false,
  savingServer: false,
  deletingServer: false,
  selectedSemesterId: initialCalculatorData.semesters.at(-1)?.id ?? null,
  data: initialCalculatorData,
});

const selectedSemester = computed(() => {
  return (
    state.data.semesters.find((semester) => semester.id === state.selectedSemesterId) ??
    state.data.semesters.at(-1) ??
    null
  );
});

const selectedSemesterIndex = computed(() => {
  if (!selectedSemester.value) return -1;
  return state.data.semesters.findIndex((semester) => semester.id === selectedSemester.value?.id);
});

const semestersUntilSelected = computed(() => {
  if (selectedSemesterIndex.value < 0) return [];
  return state.data.semesters.slice(0, selectedSemesterIndex.value + 1);
});

const selectedSemesterCourses = computed(() => {
  return selectedSemester.value?.courses ?? [];
});

const cumulativeCourses = computed(() => {
  return semestersUntilSelected.value.flatMap((semester) => semester.courses);
});

const selectedGradedCourses = computed(() => {
  return selectedSemesterCourses.value.filter(hasGrade);
});

const cumulativeGradedCourses = computed(() => {
  return cumulativeCourses.value.filter(hasGrade);
});

const selectedAttemptedCredits = computed(() => {
  return sumCredits(selectedSemesterCourses.value);
});

const selectedCompletedCredits = computed(() => {
  return sumCredits(selectedGradedCourses.value);
});

const cumulativeAttemptedCredits = computed(() => {
  return sumCredits(cumulativeCourses.value);
});

const selectedWeightedAverage = computed(() => {
  return calculateWeightedAverage(selectedGradedCourses.value);
});

const cumulativeWeightedAverage = computed(() => {
  return calculateWeightedAverage(cumulativeGradedCourses.value);
});

const creditIndex = computed(() => {
  return calculateCreditIndex(selectedGradedCourses.value);
});

const correctedCreditIndex = computed(() => {
  return calculateCorrectedCreditIndex(
    creditIndex.value,
    selectedCompletedCredits.value,
    selectedAttemptedCredits.value
  );
});

const cumulativeCorrectedCreditIndex = computed(() => {
  return calculateCorrectedCreditIndex(
    calculateCumulativeCreditIndex(cumulativeGradedCourses.value),
    sumCredits(cumulativeGradedCourses.value),
    cumulativeAttemptedCredits.value
  );
});

const canDeleteServerProfile = computed(() => {
  return Boolean(app.state.session.userId) && state.serverHasSavedProfile;
});

// Returns a list of courses from the user's selected courses that can be added to semesters
const selectedCourseOptions = computed<SelectedCourseOption[]>(() => {
  const courses = app.state.selectedCourses as Array<{
    id: string;
    name: string;
    code: string;
    credits?: unknown;
  }>;

  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code,
    credits: normalizeCredits(course.credits),
  }));
});

watch(
  () => state.data,
  (data) => {
    persistCreditCalculator(data);
  },
  { deep: true }
);

watch(
  () => [app.state.initialized, app.state.session.userId] as const,
  ([initialized, userId]) => {
    if (!userId) {
      serverProfileLoadedForUserId = null;
      state.serverHasSavedProfile = false;
      state.loadedFromServer = false;
      return;
    }

    if (!initialized || state.loadingServer || serverProfileLoadedForUserId === userId) return;

    serverProfileLoadedForUserId = userId;
    void loadServerProfile();
  },
  { immediate: true }
);

function createId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCredits(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(60, Math.trunc(parsed)));
}

function normalizeGrade(value: unknown): number | null {
  if (value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) return null;
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCourse(value: unknown): CalculatorCourse | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const code = typeof value.code === 'string' ? value.code.trim() : '';

  if (!name || !code) return null;

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId('course'),
    name,
    code,
    credits: normalizeCredits(value.credits),
    grade: normalizeGrade(value.grade),
  };
}

function normalizeSemester(value: unknown, index: number): Semester | null {
  if (!isRecord(value)) return null;

  const courses = Array.isArray(value.courses)
    ? value.courses
        .map(normalizeCourse)
        .filter((course): course is CalculatorCourse => Boolean(course))
    : [];

  return {
    id: typeof value.id === 'string' && value.id ? value.id : createId('semester'),
    name:
      typeof value.name === 'string' && value.name.trim()
        ? value.name.trim()
        : `${index + 1}. félév`,
    courses,
  };
}

function normalizeCalculatorData(value: unknown): CreditCalculatorData {
  if (!isRecord(value) || !Array.isArray(value.semesters)) return { semesters: [] };

  return {
    semesters: value.semesters
      .map(normalizeSemester)
      .filter((semester): semester is Semester => Boolean(semester)),
  };
}

function hydrateAveragesCalculator(): CreditCalculatorData {
  const saved = globalThis.localStorage.getItem(CREDIT_CALCULATOR_STORAGE_KEY);
  if (!saved) return { semesters: [] };

  try {
    return normalizeCalculatorData(JSON.parse(saved));
  } catch {
    globalThis.localStorage.removeItem(CREDIT_CALCULATOR_STORAGE_KEY);
    return { semesters: [] };
  }
}

function persistCreditCalculator(data: CreditCalculatorData): void {
  globalThis.localStorage.setItem(CREDIT_CALCULATOR_STORAGE_KEY, JSON.stringify(data));
}

function replaceCalculatorData(data: CreditCalculatorData): void {
  state.data.semesters = data.semesters;
  state.selectedSemesterId = data.semesters.at(-1)?.id ?? null;
}

function addSemester(): void {
  const nextIndex = state.data.semesters.length + 1;
  const semester: Semester = {
    id: createId('semester'),
    name: `${nextIndex}. félév`,
    courses: [],
  };

  state.data.semesters.push(semester);
  state.selectedSemesterId = semester.id;
}

function removeSemester(semesterId: string): void {
  const removedIndex = state.data.semesters.findIndex((semester) => semester.id === semesterId);
  state.data.semesters = state.data.semesters.filter((semester) => semester.id !== semesterId);
  renameSemesters();

  if (state.selectedSemesterId !== semesterId) return;

  state.selectedSemesterId =
    state.data.semesters[Math.min(Math.max(removedIndex, 0), state.data.semesters.length - 1)]
      ?.id ?? null;
}

function addPinnedCourse(semester: Semester, courseId: string): void {
  const course = getAvailableCourseOptions(semester).find((entry) => entry.id === courseId);
  if (!course) return;

  semester.courses.push({
    id: createId('course'),
    name: course.name,
    code: course.code,
    credits: course.credits,
    grade: null,
  });
}

function getAvailableCourseOptions(semester: Semester): SelectedCourseOption[] {
  const selectedCodes = new Set(semester.courses.map((course) => course.code));
  return selectedCourseOptions.value.filter((course) => !selectedCodes.has(course.code));
}

function renameSemesters(): void {
  state.data.semesters.forEach((semester, index) => {
    semester.name = `${index + 1}. félév`;
  });
}

function handlePinnedCourseSelect(semester: Semester, event: Event): void {
  const select = event.target;
  if (!(select instanceof HTMLSelectElement)) return;

  addPinnedCourse(semester, select.value);
  select.value = '';
}

function removeCourse(semester: Semester, courseId: string): void {
  semester.courses = semester.courses.filter((course) => course.id !== courseId);
}

function selectSemester(semesterId: string): void {
  state.selectedSemesterId = semesterId;
}

function hasGrade(course: CalculatorCourse): boolean {
  return course.grade !== null;
}

function sumCredits(courses: CalculatorCourse[]): number {
  return courses.reduce((sum, course) => sum + normalizeCredits(course.credits), 0);
}

function calculateWeightedAverage(courses: CalculatorCourse[]): number | null {
  const creditSum = sumCredits(courses);
  if (creditSum === 0) return null;

  const weightedSum = courses.reduce((sum, course) => {
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);

  return weightedSum / creditSum;
}

function calculateCreditIndex(courses: CalculatorCourse[]): number | null {
  if (courses.length === 0) return null;
  const weightedSum = courses.reduce((sum, course) => {
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);

  return weightedSum / CREDITS_PER_SEMESTER;
}

function calculateCumulativeCreditIndex(courses: CalculatorCourse[]): number | null {
  const semesterCount = semestersUntilSelected.value.length;
  if (semesterCount === 0 || courses.length === 0) return null;

  const weightedSum = courses.reduce((sum, course) => {
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);

  return weightedSum / (semesterCount * CREDITS_PER_SEMESTER);
}

function calculateCorrectedCreditIndex(
  index: number | null,
  completedCredits: number,
  attemptedCredits: number
): number | null {
  if (index === null || attemptedCredits === 0) return null;
  return index * (completedCredits / attemptedCredits);
}

function formatCredit(value: number): string {
  return new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(value);
}

function formatMetric(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '-';
  return new Intl.NumberFormat('hu-HU', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);
}

function serializeCalculator(): Record<string, unknown> {
  return {
    semesters: state.data.semesters.map((semester) => ({
      id: semester.id,
      name: semester.name,
      courses: semester.courses.map((course) => ({
        id: course.id,
        name: course.name,
        code: course.code,
        credits: normalizeCredits(course.credits),
        grade: course.grade,
      })),
    })),
  };
}

function hasSavedCalculatorData(value: unknown): boolean {
  return normalizeCalculatorData(value).semesters.length > 0;
}

async function loadServerProfile(): Promise<void> {
  if (!app.isAuthenticated()) return;

  state.loadingServer = true;

  try {
    const profile = await fetchOwnCreditProfile();
    const data = normalizeCalculatorData(profile.data);
    state.serverHasSavedProfile = hasSavedCalculatorData(profile.data);

    if (data.semesters.length > 0) {
      replaceCalculatorData(data);
      state.loadedFromServer = true;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return;
    app.notify('danger', 'Betöltési hiba', 'Nem sikerült betölteni a felhő mentést.');
  } finally {
    state.loadingServer = false;
  }
}

async function saveToServer(): Promise<void> {
  if (!app.isAuthenticated()) {
    rememberRouteIntent('/averages');
    app.loginWithGoogle();
    return;
  }

  state.savingServer = true;

  try {
    const profile = await saveOwnCreditProfile(serializeCalculator());
    replaceCalculatorData(normalizeCalculatorData(profile.data));
    state.serverHasSavedProfile = hasSavedCalculatorData(profile.data);
    state.loadedFromServer = state.serverHasSavedProfile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      rememberRouteIntent('/averages');
      app.loginWithGoogle();
      return;
    }

    app.notify('danger', 'Nem sikerült menteni', 'A helyi mentésed megmaradt a böngésződben.');
  } finally {
    state.savingServer = false;
  }
}

async function deleteFromServer(): Promise<void> {
  if (!app.isAuthenticated()) return;

  state.deletingServer = true;

  try {
    await deleteOwnCreditProfile();
    state.serverHasSavedProfile = false;
    state.loadedFromServer = false;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      rememberRouteIntent('/averages');
      app.loginWithGoogle();
      return;
    }

    app.notify('danger', 'Nem sikerült törölni', 'A helyi mentésed megmaradt a böngésződben.');
  } finally {
    state.deletingServer = false;
  }
}
</script>

<template>
  <section class="credits-page">
    <div class="credits-page__header">
      <div>
        <h1>Átlag kalkulátor</h1>
        <p>{{ state.loadedFromServer ? 'Felhő mentés aktív' : 'Helyi mentés aktív' }}</p>
      </div>

      <div class="credits-page__actions">
        <BaseButton
          v-if="canDeleteServerProfile"
          :disabled="state.deletingServer || state.savingServer || state.loadingServer"
          kind="danger"
          type="button"
          @click="deleteFromServer"
        >
          {{ state.deletingServer ? 'Törlés...' : 'Törlés a felhőből' }}
        </BaseButton>
        <BaseButton
          :disabled="state.savingServer || state.loadingServer || state.deletingServer"
          type="button"
          @click="saveToServer"
        >
          {{ state.savingServer ? 'Mentés...' : 'Mentés felhőbe' }}
        </BaseButton>
      </div>
    </div>

    <section class="metrics-grid" aria-label="Kreditstatisztikák">
      <article class="metric">
        <span>Felvett kredit</span>
        <strong>{{ formatCredit(selectedAttemptedCredits) }}</strong>
      </article>
      <article class="metric">
        <span>Megszerzett kredit</span>
        <strong>{{ formatCredit(selectedCompletedCredits) }}</strong>
      </article>
      <article class="metric">
        <span>Kum. felvett kredit</span>
        <strong>{{ formatCredit(cumulativeAttemptedCredits) }}</strong>
      </article>
      <article class="metric">
        <span>Súlyozott tanulmányi átlag</span>
        <strong>{{ formatMetric(selectedWeightedAverage) }}</strong>
      </article>
      <article class="metric">
        <span>Kum. súlyozott tanulmányi átlag</span>
        <strong>{{ formatMetric(cumulativeWeightedAverage) }}</strong>
      </article>
      <article class="metric">
        <span>Kreditindex</span>
        <strong>{{ formatMetric(creditIndex) }}</strong>
      </article>
      <article class="metric">
        <span>Korr. kreditindex</span>
        <strong>{{ formatMetric(correctedCreditIndex) }}</strong>
      </article>
      <article class="metric">
        <span>Össz. korrigált kreditindex</span>
        <strong>{{ formatMetric(cumulativeCorrectedCreditIndex) }}</strong>
      </article>
    </section>

    <div class="semester-list">
      <section v-for="semester in state.data.semesters" :key="semester.id" class="semester">
        <div class="semester__header">
          <h2 class="semester__title">{{ semester.name }}</h2>
          <div class="semester__actions">
            <BaseButton
              :disabled="selectedSemester?.id === semester.id"
              kind="secondary"
              type="button"
              @click="selectSemester(semester.id)"
            >
              {{ selectedSemester?.id === semester.id ? 'Kiválasztva' : 'Kiválaszt' }}
            </BaseButton>
            <BaseButton kind="danger" type="button" @click="removeSemester(semester.id)"
              >Törlés</BaseButton
            >
          </div>
        </div>

        <label class="select-pinned">
          <span>Választás felvett tárgyak közül</span>
          <select
            :disabled="getAvailableCourseOptions(semester).length === 0"
            @change="handlePinnedCourseSelect(semester, $event)"
          >
            <option value="">
              {{
                getAvailableCourseOptions(semester).length === 0
                  ? 'Nincs választható tárgy'
                  : 'Válassz tárgyat'
              }}
            </option>
            <option
              v-for="course in getAvailableCourseOptions(semester)"
              :key="course.id"
              :value="course.id"
            >
              {{ course.name }} · {{ course.code }} · {{ course.credits }} kredit
            </option>
          </select>
        </label>

        <div v-if="semester.courses.length > 0" class="course-table">
          <h3 class="course-table__title">Tárgyak</h3>

          <div v-for="course in semester.courses" :key="course.id" class="course-row">
            <div class="course-row__name">
              <strong>{{ course.name }} ({{ course.credits }})</strong>
              <span>{{ course.code }}</span>
            </div>
            <select v-model="course.grade" aria-label="Jegy" class="course-row__grade">
              <option :value="null">-</option>
              <option v-for="grade in [1, 2, 3, 4, 5]" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
            <BaseButton
              class="course-row__delete"
              kind="danger"
              type="button"
              @click="removeCourse(semester, course.id)"
              >Törlés</BaseButton
            >
          </div>
        </div>
      </section>

      <button class="add-semester-card" type="button" @click="addSemester">
        <span aria-hidden="true">+</span>
        <strong>Félév hozzáadása</strong>
      </button>
    </div>
  </section>
</template>

<style scoped>
.credits-page {
  display: grid;
  gap: 1.4rem;
}

.credits-page__header {
  align-items: start;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  padding-top: 1.2rem;
}

.credits-page h1,
.credits-page p {
  margin: 0;
}

.credits-page p {
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.credits-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.metrics-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric,
.semester {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-large);
}

.metric {
  border-radius: 1rem;
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
}

.metric span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.metric strong {
  font-size: 1.45rem;
  line-height: 1.15;
}

.semester-list {
  display: grid;
  gap: 1rem;
}

.semester {
  border-radius: 1.4rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.semester__header {
  align-items: flex-start;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.semester__actions {
  display: flex;
  gap: 0.55rem;
  justify-content: flex-end;
  white-space: nowrap;
}

.semester__title {
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 0;
  min-width: 0;
  width: 100%;
}

.select-pinned {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
  max-width: 34rem;
}

.select-pinned span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  padding-left: 0.4rem;
}

select {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 0.85rem;
  color: var(--text-primary);
  font: inherit;
  min-height: 2.65rem;
  padding: 0 0.8rem;
  width: 100%;
}

.course-table {
  display: grid;
  gap: 0.55rem;
  overflow-x: auto;
}

.course-row {
  align-items: center;
  display: grid;
  column-gap: 1.1rem;
  grid-template-columns: minmax(13rem, 1fr) 5.2rem max-content;
  min-width: 28rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(129, 140, 248, 0.12);
  border-radius: 0.9rem;
  padding: 0.6rem;
}

.course-table__title {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  margin: 0;
  padding-left: 0.4rem;
}

.course-row__name {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.course-row__name strong,
.course-row__name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-row__name span {
  color: var(--text-subtle);
  font-size: 0.85rem;
}

.course-row__grade {
  justify-self: end;
  width: 5.2rem;
}

.course-row__delete {
  justify-self: end;
  min-height: 2.45rem;
  padding: 0 0.9rem;
}

@media (min-width: 900px) {
  .course-row {
    grid-template-columns: minmax(18rem, 1fr) 5.2rem max-content;
    column-gap: 1.55rem;
    min-width: 36rem;
  }
}

.add-semester-card {
  align-items: center;
  appearance: none;
  backdrop-filter: blur(18px);
  background: rgba(148, 163, 184, 0.08);
  border: 1px dashed rgba(226, 232, 240, 0.28);
  border-radius: 1.4rem;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  gap: 0.8rem;
  justify-content: center;
  min-height: 6.5rem;
  padding: 1rem;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
  width: 100%;
}

.add-semester-card:hover {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(226, 232, 240, 0.44);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.add-semester-card span {
  align-items: center;
  background: rgba(226, 232, 240, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.18);
  border-radius: 999px;
  display: inline-flex;
  font-size: 1.6rem;
  font-weight: 500;
  height: 2.5rem;
  justify-content: center;
  line-height: 1;
  width: 2.5rem;
}

.add-semester-card strong {
  font: inherit;
  font-weight: 800;
}

@media (max-width: 760px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .credits-page__actions {
    width: 100%;
  }
}
</style>
