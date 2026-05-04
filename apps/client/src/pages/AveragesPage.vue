<script setup lang="ts">
import { isAxiosError } from 'axios';
import { computed, onMounted, reactive, watch } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import { fetchOwnCreditProfile, saveOwnCreditProfile } from '@/api/credits.api';
import { rememberRouteIntent } from '@/router/routing-manager';
import { useAppStore } from '@/stores/composables/use-app-store';

type CalculatorCourse = {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: number | null;
  completed: boolean;
};

type Semester = {
  id: string;
  name: string;
  courses: CalculatorCourse[];
};

type SemesterDraft = {
  name: string;
  code: string;
  credits: number;
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

const state = reactive({
  loadedFromServer: false,
  loadingServer: false,
  savingServer: false,
  data: hydrateAveragesCalculator(),
  drafts: {} as Record<string, SemesterDraft>,
});

// Returns all courses that are marked as completed and have a valid grade
const completedCourses = computed(() => {
  return state.data.semesters.flatMap((semester) =>
    semester.courses.filter((course) => course.completed && course.grade !== null)
  );
});

// Returns the total number of attempted credits across all semesters
const attemptedCredits = computed(() => {
  return state.data.semesters.reduce((total, semester) => {
    return (
      total + semester.courses.reduce((sum, course) => sum + normalizeCredits(course.credits), 0)
    );
  }, 0);
});

// Returns the total number of completed credits across all semesters
const completedCredits = computed(() => {
  return state.data.semesters.reduce((total, semester) => {
    return (
      total +
      semester.courses.reduce((sum, course) => {
        return course.completed ? sum + normalizeCredits(course.credits) : sum;
      }, 0)
    );
  }, 0);
});

// Returns the latest semester based on the order in the array
const latestSemester = computed(() => {
  return state.data.semesters.at(-1) ?? null;
});

const cumulativeWeightedAverage = computed(() => {
  return calculateWeightedAverage(completedCourses.value);
});

const latestWeightedAverage = computed(() => {
  if (!latestSemester.value) return null;
  return calculateWeightedAverage(
    latestSemester.value.courses.filter((course) => course.completed && course.grade !== null)
  );
});

const creditIndex = computed(() => {
  if (!latestSemester.value) return null;
  return calculateCreditIndex(latestSemester.value.courses);
});

const cumulativeCorrectedCreditIndex = computed(() => {
  const semesterCount = state.data.semesters.length;
  if (semesterCount === 0 || attemptedCredits.value === 0) return null;

  const points = completedCourses.value.reduce((sum, course) => {
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);
  const cumulativeIndex = points / (semesterCount * CREDITS_PER_SEMESTER);

  return cumulativeIndex * (completedCredits.value / attemptedCredits.value);
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

onMounted(() => {
  void loadServerProfile();
});

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
    completed: value.completed === true,
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
  state.drafts = {};
}

function addSemester(): void {
  const nextIndex = state.data.semesters.length + 1;
  const semester: Semester = {
    id: createId('semester'),
    name: `${nextIndex}. félév`,
    courses: [],
  };

  state.data.semesters.push(semester);
  state.drafts[semester.id] = { name: '', code: '', credits: 0 };
}

function removeSemester(semesterId: string): void {
  state.data.semesters = state.data.semesters.filter((semester) => semester.id !== semesterId);
  delete state.drafts[semesterId];
}

function getDraft(semesterId: string): SemesterDraft {
  state.drafts[semesterId] ??= { name: '', code: '', credits: 0 };
  return state.drafts[semesterId];
}

function addDraftCourse(semester: Semester): void {
  const draft = getDraft(semester.id);
  const name = draft.name.trim();
  const code = draft.code.trim();

  if (!name || !code) {
    app.notify('info', 'Hiányzó tárgyadat', 'A tárgynév és a tárgykód kötelező.');
    return;
  }

  semester.courses.push({
    id: createId('course'),
    name,
    code,
    credits: normalizeCredits(draft.credits),
    grade: null,
    completed: false,
  });
  state.drafts[semester.id] = { name: '', code: '', credits: 0 };
}

function addPinnedCourse(semester: Semester, courseId: string): void {
  const course = selectedCourseOptions.value.find((entry) => entry.id === courseId);
  if (!course) return;

  semester.courses.push({
    id: createId('course'),
    name: course.name,
    code: course.code,
    credits: course.credits,
    grade: null,
    completed: false,
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

function calculateWeightedAverage(courses: CalculatorCourse[]): number | null {
  const creditSum = courses.reduce((sum, course) => sum + normalizeCredits(course.credits), 0);
  if (creditSum === 0) return null;

  const weightedSum = courses.reduce((sum, course) => {
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);

  return weightedSum / creditSum;
}

function calculateCreditIndex(courses: CalculatorCourse[]): number | null {
  if (courses.length === 0) return null;
  const weightedSum = courses.reduce((sum, course) => {
    if (!course.completed || course.grade === null) return sum;
    return sum + normalizeCredits(course.credits) * Number(course.grade);
  }, 0);

  return weightedSum / CREDITS_PER_SEMESTER;
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
        completed: course.completed,
      })),
    })),
  };
}

async function loadServerProfile(): Promise<void> {
  if (!app.isAuthenticated()) return;

  state.loadingServer = true;

  try {
    const profile = await fetchOwnCreditProfile();
    const data = normalizeCalculatorData(profile.data);

    if (data.semesters.length > 0) {
      replaceCalculatorData(data);
      state.loadedFromServer = true;
    }
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) return;
    app.notify('danger', 'Nem sikerült betölteni a szerver mentést', 'Próbáld meg később.');
  } finally {
    state.loadingServer = false;
  }
}

async function saveToServer(): Promise<void> {
  if (!app.isAuthenticated()) {
    rememberRouteIntent('/credits');
    app.loginWithGoogle();
    return;
  }

  state.savingServer = true;

  try {
    const profile = await saveOwnCreditProfile(serializeCalculator());
    replaceCalculatorData(normalizeCalculatorData(profile.data));
    state.loadedFromServer = true;
    app.notify('success', 'Szerver mentés kész', 'A kreditkalkulátor mentve lett a profilodba.');
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) {
      rememberRouteIntent('/credits');
      app.loginWithGoogle();
      return;
    }

    app.notify('danger', 'Nem sikerült menteni', 'A helyi mentésed megmaradt a böngésződben.');
  } finally {
    state.savingServer = false;
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
        <BaseButton kind="secondary" type="button" @click="addSemester"
          >Félév hozzáadása</BaseButton
        >
        <BaseButton
          :disabled="state.savingServer || state.loadingServer"
          type="button"
          @click="saveToServer"
        >
          {{ state.savingServer ? 'Mentés...' : 'Mentés szerverre' }}
        </BaseButton>
      </div>
    </div>

    <section class="metrics-grid" aria-label="Kreditstatisztikák">
      <article class="metric">
        <span>Megszerzett kreditek</span>
        <strong>{{ completedCredits }}</strong>
      </article>
      <article class="metric">
        <span>Súlyozott tanulmányi átlag</span>
        <strong>{{ formatMetric(latestWeightedAverage) }}</strong>
      </article>
      <article class="metric">
        <span>Kumulált súlyozott átlag</span>
        <strong>{{ formatMetric(cumulativeWeightedAverage) }}</strong>
      </article>
      <article class="metric">
        <span>Kreditindex</span>
        <strong>{{ formatMetric(creditIndex) }}</strong>
      </article>
      <article class="metric">
        <span>Összesített korrigált kreditindex</span>
        <strong>{{ formatMetric(cumulativeCorrectedCreditIndex) }}</strong>
      </article>
    </section>

    <div v-if="state.data.semesters.length === 0" class="empty-state">
      <h3>Nincs félév</h3>
      <BaseButton type="button" @click="addSemester">Első félév hozzáadása</BaseButton>
    </div>

    <div v-else class="semester-list">
      <section v-for="semester in state.data.semesters" :key="semester.id" class="semester">
        <div class="semester__header">
          <input
            v-model="semester.name"
            aria-label="Félév neve"
            class="semester__title"
            type="text"
          />
          <BaseButton kind="ghost" type="button" @click="removeSemester(semester.id)"
            >Törlés</BaseButton
          >
        </div>

        <div class="course-editor">
          <label>
            <span>Tárgy neve</span>
            <input v-model="getDraft(semester.id).name" type="text" />
          </label>
          <label>
            <span>Tárgykód</span>
            <input v-model="getDraft(semester.id).code" type="text" />
          </label>
          <label>
            <span>Kredit</span>
            <input v-model.number="getDraft(semester.id).credits" min="0" max="60" type="number" />
          </label>
          <BaseButton kind="secondary" type="button" @click="addDraftCourse(semester)"
            >Hozzáadás</BaseButton
          >
        </div>

        <label v-if="selectedCourseOptions.length > 0" class="select-pinned">
          <span>Felvett tárgyból</span>
          <select @change="handlePinnedCourseSelect(semester, $event)">
            <option value="">Válassz tárgyat</option>
            <option v-for="course in selectedCourseOptions" :key="course.id" :value="course.id">
              {{ course.name }} · {{ course.code }} · {{ course.credits }} kredit
            </option>
          </select>
        </label>

        <div v-if="semester.courses.length > 0" class="course-table">
          <div class="course-table__head">
            <span>Tárgy</span>
            <span>Kredit</span>
            <span>Jegy</span>
            <span>Megszerzett</span>
            <span></span>
          </div>

          <div v-for="course in semester.courses" :key="course.id" class="course-row">
            <div class="course-row__name">
              <strong>{{ course.name }}</strong>
              <span>{{ course.code }}</span>
            </div>
            <input
              v-model.number="course.credits"
              aria-label="Kredit"
              min="0"
              max="60"
              type="number"
            />
            <select v-model="course.grade" aria-label="Jegy">
              <option :value="null">-</option>
              <option v-for="grade in [1, 2, 3, 4, 5]" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
            <label class="switch">
              <input v-model="course.completed" type="checkbox" />
              <span></span>
            </label>
            <BaseButton kind="ghost" type="button" @click="removeCourse(semester, course.id)"
              >Törlés</BaseButton
            >
          </div>
        </div>
      </section>
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
.credits-page p,
.empty-state h3 {
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
  grid-template-columns: repeat(auto-fit, minmax(12.5rem, 1fr));
}

.metric,
.semester,
.empty-state {
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

.semester,
.empty-state {
  border-radius: 1.4rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.empty-state {
  justify-items: start;
}

.semester__header {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.semester__title {
  background: transparent;
  border: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 800;
  min-width: 0;
  width: 100%;
}

.course-editor {
  align-items: end;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(12rem, 1.6fr) minmax(9rem, 1fr) minmax(6rem, 0.55fr) auto;
}

.course-editor label,
.select-pinned {
  display: grid;
  gap: 0.45rem;
}

.course-editor span,
.select-pinned span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

input,
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

.select-pinned {
  max-width: 34rem;
}

.course-table {
  display: grid;
  gap: 0.55rem;
  overflow-x: auto;
}

.course-table__head,
.course-row {
  align-items: center;
  display: grid;
  gap: 0.65rem;
  grid-template-columns: minmax(14rem, 1fr) 5.5rem 5.5rem 6.5rem auto;
  min-width: 44rem;
}

.course-table__head {
  color: var(--text-subtle);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0 0.2rem;
}

.course-row {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(129, 140, 248, 0.12);
  border-radius: 0.9rem;
  padding: 0.6rem;
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

.switch {
  align-items: center;
  display: inline-flex;
  justify-content: center;
}

.switch input {
  height: 1px;
  opacity: 0;
  position: absolute;
  width: 1px;
}

.switch span {
  background: rgba(148, 163, 184, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  cursor: pointer;
  display: block;
  height: 1.55rem;
  position: relative;
  width: 2.8rem;
}

.switch span::after {
  background: #e2e8f0;
  border-radius: 50%;
  content: '';
  height: 1.05rem;
  left: 0.22rem;
  position: absolute;
  top: 0.2rem;
  transition:
    background-color 140ms ease,
    transform 140ms ease;
  width: 1.05rem;
}

.switch input:checked + span {
  background: rgba(52, 211, 153, 0.28);
}

.switch input:checked + span::after {
  background: #bbf7d0;
  transform: translateX(1.2rem);
}

@media (max-width: 760px) {
  .course-editor {
    grid-template-columns: 1fr;
  }

  .credits-page__actions {
    width: 100%;
  }
}
</style>
