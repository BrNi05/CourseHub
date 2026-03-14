<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { Course, CreateSuggestionDto } from '@coursehub/sdk';

import BaseButton from '@/components/BaseButton.vue';
import { useAppStore } from '@/lib/app-store';

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
  courseTeamsUrl: string;
  courseExtraUrl: string;
};

const app = useAppStore();
const route = useRoute();
const router = useRouter();
const selectedCourses = app.state.selectedCourses as Course[];

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
  courseTeamsUrl: '',
  courseExtraUrl: '',
});

const editCourseId = computed(() => {
  const value = route.query.editCourseId;
  return typeof value === 'string' ? value : undefined;
});

const editCourse = computed<Course | undefined>(() => {
  const courseId = editCourseId.value;
  if (!courseId) return undefined;
  return selectedCourses.find((course) => course.id === courseId);
});

function prefillFromRouteCourse() {
  if (!editCourse.value) return;

  const selectedUniversity = app.selectedUniversity();

  form.uniName = form.uniName || selectedUniversity?.name || '';
  form.uniAbbrevName = form.uniAbbrevName || selectedUniversity?.abbrevName || '';
  form.courseName = editCourse.value.name;
  form.courseCode = editCourse.value.code;
  form.coursePageUrl = editCourse.value.coursePageUrl;
  form.courseTadUrl = editCourse.value.courseTadUrl;
  form.courseMoodleUrl = editCourse.value.courseMoodleUrl;
  form.courseTeamsUrl = editCourse.value.courseTeamsUrl;
  form.courseExtraUrl = editCourse.value.courseExtraUrl;
}

watch(editCourse, prefillFromRouteCourse, { immediate: true });

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

    <form class="form-card" @submit.prevent="submitForm">
      <div v-if="editCourse" class="helper-banner">
        Szerkesztés:
        <strong>{{ editCourse.name }} ({{ editCourse.code }})</strong>
      </div>

      <div class="form-grid">
        <label class="field">
          <span>Egyetem neve</span>
          <input
            v-model="form.uniName"
            required
            type="text"
            placeholder="Budapesti Műszaki és Gazdaságtudományi Egyetem"
          />
        </label>

        <label class="field">
          <span>Egyetem rövidített neve</span>
          <input v-model="form.uniAbbrevName" required type="text" placeholder="BME" />
        </label>

        <label class="field">
          <span>Kar neve</span>
          <input
            v-model="form.facultyName"
            required
            type="text"
            placeholder="Villamosmérnöki és Informatikai Kar"
          />
        </label>

        <label class="field">
          <span>Kar rövidített neve</span>
          <input v-model="form.facultyAbbrevName" required type="text" placeholder="VIK" />
        </label>

        <label class="field">
          <span>Tárgy neve</span>
          <input
            v-model="form.courseName"
            required
            type="text"
            placeholder="Programozás alapjai I."
          />
        </label>

        <label class="field">
          <span>Tárgykód</span>
          <input v-model="form.courseCode" required type="text" placeholder="BMEVIEEAA00" />
        </label>

        <label class="field">
          <span>Tágyoldal URL</span>
          <input v-model="form.coursePageUrl" type="url" placeholder="https://infoc.eet.bme.hu/" />
        </label>

        <label class="field">
          <span>TAD URL</span>
          <input
            v-model="form.courseTadUrl"
            type="url"
            placeholder="https://portal.vik.bme.hu/kepzes/targyak/VIEEAA00/"
          />
        </label>

        <label class="field">
          <span>Moodle URL</span>
          <input
            v-model="form.courseMoodleUrl"
            type="url"
            placeholder="https://edu.vik.bme.hu/course/view.php?id=..."
          />
        </label>

        <label class="field">
          <span>Teams URL</span>
          <input
            v-model="form.courseTeamsUrl"
            type="url"
            placeholder="https://teams.microsoft.com/l/channel/..."
          />
        </label>

        <label class="field field--wide">
          <span>Extra URL</span>
          <input v-model="form.courseExtraUrl" type="url" placeholder="https://example.com/extra" />
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
}

.form-page__eyebrow {
  color: var(--text-subtle);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  margin: 0 0 0.45rem;
  text-transform: uppercase;
}

.form-page h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.06;
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: space-between;
  margin-top: 0.5rem;
}
</style>
