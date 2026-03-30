<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  findOne as getUniversityById,
  findOne2 as getCourseById,
  getOne as getFacultyById,
  type Course,
  type CreateSuggestionDto,
} from '@coursehub/sdk';

import BaseButton from '@/components/BaseButton.vue';
import { useAppStore } from '@/stores/composables/use-app-store';

type SuggestionForm = {
  uniName: string;
  uniAbbrevName: string;
  facultyName: string;
  facultyAbbrevName: string;
  courseName: string;
  courseCode: string;
  coursePageUrl: string;
  courseTadUrl: string;
  courseMoodleUrl: string;
  courseSubmissionUrl: string;
  courseTeamsUrl: string;
  courseExtraUrl: string;
};

const app = useAppStore();
const route = useRoute();
const router = useRouter();
const editCourse = ref<Course>();

const form = reactive<SuggestionForm>({
  uniName: '',
  uniAbbrevName: '',
  facultyName: '',
  facultyAbbrevName: '',
  courseName: '',
  courseCode: '',
  coursePageUrl: '',
  courseTadUrl: '',
  courseMoodleUrl: '',
  courseSubmissionUrl: '',
  courseTeamsUrl: '',
  courseExtraUrl: '',
});

const editCourseId = computed(() => {
  const value = route.query.editCourseId;
  return typeof value === 'string' ? value : undefined;
});

let editPrefillSequence = 0;

function resetForm() {
  form.uniName = '';
  form.uniAbbrevName = '';
  form.facultyName = '';
  form.facultyAbbrevName = '';
  form.courseName = '';
  form.courseCode = '';
  form.coursePageUrl = '';
  form.courseTadUrl = '';
  form.courseMoodleUrl = '';
  form.courseSubmissionUrl = '';
  form.courseTeamsUrl = '';
  form.courseExtraUrl = '';
}

async function prefillFromCourseId(courseId?: string) {
  const sequence = ++editPrefillSequence; // stale request guard

  resetForm();
  editCourse.value = undefined;

  if (!courseId) return;

  try {
    const courseResponse = await getCourseById({
      baseURL: '/api',
      path: { id: courseId },
      throwOnError: true,
    });

    if (sequence !== editPrefillSequence) return;

    const course = courseResponse.data;
    editCourse.value = course;
    form.courseName = course.name;
    form.courseCode = course.code;
    form.coursePageUrl = course.coursePageUrl;
    form.courseTadUrl = course.courseTadUrl;
    form.courseMoodleUrl = course.courseMoodleUrl;
    form.courseSubmissionUrl = course.courseSubmissionUrl;
    form.courseTeamsUrl = course.courseTeamsUrl;
    form.courseExtraUrl = course.courseExtraUrl;

    const facultyResponse = await getFacultyById({
      baseURL: '/api',
      path: { id: course.facultyId },
      throwOnError: true,
    });

    if (sequence !== editPrefillSequence) return;

    const faculty = facultyResponse.data;
    form.facultyName = faculty.name;
    form.facultyAbbrevName = faculty.abbrevName;

    const universityResponse = await getUniversityById({
      baseURL: '/api',
      path: { id: faculty.universityId },
      throwOnError: true,
    });

    if (sequence !== editPrefillSequence) return;

    const university = universityResponse.data;
    form.uniName = university.name;
    form.uniAbbrevName = university.abbrevName;
  } catch (error) {
    if (sequence !== editPrefillSequence) return;
    app.notify(
      'danger',
      'Nem sikerült betölteni a tárgy adatait',
      error instanceof Error ? error.message : 'Próbáld meg kicsit később.'
    );
  }
}

watch(
  editCourseId,
  (courseId) => {
    void prefillFromCourseId(courseId);
  },
  { immediate: true }
);

async function submitForm() {
  const payload: CreateSuggestionDto = {
    uniName: form.uniName.trim(),
    uniAbbrevName: form.uniAbbrevName.trim(),
    facultyName: form.facultyName.trim(),
    facultyAbbrevName: form.facultyAbbrevName.trim(),
    courseName: form.courseName.trim(),
    courseCode: form.courseCode.trim(),
    coursePageUrl: form.coursePageUrl.trim() || undefined,
    courseTadUrl: form.courseTadUrl.trim() || undefined,
    courseMoodleUrl: form.courseMoodleUrl.trim() || undefined,
    courseSubmissionUrl: form.courseSubmissionUrl.trim() || undefined,
    courseTeamsUrl: form.courseTeamsUrl.trim() || undefined,
    courseExtraUrl: form.courseExtraUrl.trim() || undefined,
  };

  const ok = await app.submitSuggestion(payload);

  if (ok) {
    await router.push('/');
  }
}
</script>

<template>
  <section class="form-page">
    <div class="form-page__intro">
      <h1>Új tárgy felvétele</h1>
      <p>
        Nem találod a keresett tárgyat? Küldj egy javaslatot a lenti űrlap kitöltésével, és az
        hamarosan mindenki számára elérhető lesz.
      </p>
    </div>

    <form class="form-card" autocomplete="off" @submit.prevent="submitForm">
      <div v-if="editCourse" class="helper-banner">
        Szerkesztés:
        <strong>{{ editCourse.name }} ({{ editCourse.code }})</strong>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Egyetem neve</span>
          <input
            v-model="form.uniName"
            autocomplete="on"
            name="uniName"
            required
            type="text"
            placeholder="Budapesti Műszaki és Gazdaságtudományi Egyetem"
          />
        </label>

        <label class="field">
          <span>Egyetem rövidített neve</span>
          <input
            v-model="form.uniAbbrevName"
            autocomplete="on"
            name="uniAbbrevName"
            required
            type="text"
            placeholder="BME"
          />
        </label>

        <label class="field">
          <span>Kar neve</span>
          <input
            v-model="form.facultyName"
            autocomplete="on"
            name="facultyName"
            required
            type="text"
            placeholder="Villamosmérnöki és Informatikai Kar"
          />
        </label>

        <label class="field">
          <span>Kar rövidített neve</span>
          <input
            v-model="form.facultyAbbrevName"
            autocomplete="on"
            name="facultyAbbrevName"
            required
            type="text"
            placeholder="VIK"
          />
        </label>

        <label class="field">
          <span>Tárgy neve</span>
          <input
            v-model="form.courseName"
            autocomplete="off"
            name="courseName"
            required
            type="text"
            placeholder="Programozás alapjai I."
          />
        </label>

        <label class="field">
          <span>Tárgykód</span>
          <input
            v-model="form.courseCode"
            autocomplete="off"
            name="courseCode"
            required
            type="text"
            placeholder="BMEVIEEAA00"
          />
        </label>

        <label class="field">
          <span>Tágyoldal URL</span>
          <input
            v-model="form.coursePageUrl"
            autocomplete="off"
            name="coursePageUrl"
            type="url"
            placeholder="https://infoc.eet.bme.hu/"
          />
        </label>

        <label class="field">
          <span>TAD URL</span>
          <input
            v-model="form.courseTadUrl"
            autocomplete="off"
            name="courseTadUrl"
            type="url"
            placeholder="https://portal.vik.bme.hu/kepzes/targyak/VIEEAA00/"
          />
        </label>

        <label class="field">
          <span>Moodle URL</span>
          <input
            v-model="form.courseMoodleUrl"
            autocomplete="off"
            name="courseMoodleUrl"
            type="url"
            placeholder="https://edu.vik.bme.hu/course/view.php?id=..."
          />
        </label>

        <label class="field">
          <span>HF beadó portál URL</span>
          <input
            v-model="form.courseSubmissionUrl"
            autocomplete="off"
            name="courseSubmissionUrl"
            type="url"
            placeholder="https://fecske.db.bme.hu/#/student"
          />
        </label>

        <label class="field">
          <span>Teams URL</span>
          <input
            v-model="form.courseTeamsUrl"
            autocomplete="off"
            name="courseTeamsUrl"
            type="url"
            placeholder="https://teams.microsoft.com/l/team/...thread.tacv2/conversations?groupId=...&tenantId=..."
          />
        </label>

        <label class="field field--wide">
          <span>Extra URL</span>
          <input
            v-model="form.courseExtraUrl"
            autocomplete="off"
            name="courseExtraUrl"
            type="url"
            placeholder="https://example.com/extra"
          />
        </label>
      </div>

      <div class="form-actions">
        <BaseButton kind="ghost" type="button" @click="router.push('/')">
          Vissza a főoldalra
        </BaseButton>
        <BaseButton :disabled="app.state.submittingSuggestion" type="submit">
          {{ app.state.submittingSuggestion ? 'Küldés...' : 'Javaslat küldése' }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-page {
  display: grid;
  gap: 1.55rem;
}

.form-page__intro {
  display: grid;
  gap: 0.85rem;
  max-width: 60rem;
  padding-top: 1.2rem;
}

.form-page h1 {
  margin: 0;
}

.form-page p {
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.form-card {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.8rem;
  box-shadow: var(--shadow-large);
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.helper-banner {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.16), rgba(139, 92, 246, 0.14));
  border: 1px solid rgba(129, 140, 248, 0.28);
  border-radius: 1rem;
  color: #dbeafe;
  padding: 0.9rem 1rem;
}

.form-grid {
  align-items: start;
  display: grid;
  gap: 1.4em;
  grid-template-columns: minmax(0, 1fr);
}

.field {
  display: grid;
  gap: 0.65rem;
  min-width: 0;
}

.field--wide {
  grid-column: 1 / -1;
}

.field span {
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.35;
}

.field input {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  max-width: 100%;
  min-height: 3rem;
  padding: 0 0.95rem;
  width: 100%;
}

.field input:-webkit-autofill,
.field input:-webkit-autofill:hover,
.field input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0 1000px rgb(15 23 42) inset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  background-color: transparent !important;
  border: 1px solid var(--border-soft);
  caret-color: var(--text-primary);
  box-shadow: 0 0 0 1000px rgb(15 23 42) inset !important;
  transition:
    background-color 999999s ease-in-out 0s,
    color 999999s ease-in-out 0s;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: space-between;
  margin-top: 0.5rem;
}
</style>
