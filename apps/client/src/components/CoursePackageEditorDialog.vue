<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import BaseButton from './BaseButton.vue';
import BaseDialog from './BaseDialog.vue';

import type { Course, CoursePackage, CreateCoursePackageDto } from '@coursehub/sdk';

type EditableCoursePackagePayload = CreateCoursePackageDto;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    packageItem?: CoursePackage | null;
    availableCourses: Course[];
    busy?: boolean;
  }>(),
  {
    packageItem: null,
    busy: false,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: EditableCoursePackagePayload];
}>();

const form = reactive({
  name: '',
  description: '',
  selectedCourseIds: [] as string[],
  courseQuery: '',
});

const validationMessage = ref('');

const dedupedAvailableCourses = computed(() => {
  const entries = new Map<string, Course>();

  for (const course of props.availableCourses) {
    entries.set(course.id, course);
  }

  return [...entries.values()].sort((left, right) => left.name.localeCompare(right.name, 'hu'));
});

const selectedCourseIdSet = computed(() => new Set(form.selectedCourseIds));

const selectedCourses = computed(() =>
  dedupedAvailableCourses.value.filter((course) => selectedCourseIdSet.value.has(course.id))
);

const selectedFacultyId = computed(() => {
  const [firstSelectedCourseId] = form.selectedCourseIds;
  return (
    dedupedAvailableCourses.value.find((course) => course.id === firstSelectedCourseId)
      ?.facultyId ?? ''
  );
});

const selectableCourses = computed(() =>
  dedupedAvailableCourses.value.filter((course) => !selectedCourseIdSet.value.has(course.id))
);

const filteredCourses = computed(() => {
  const query = form.courseQuery.trim().toLowerCase();

  return selectableCourses.value.filter((course) => {
    if (!query) return true;

    return course.name.toLowerCase().includes(query) || course.code.toLowerCase().includes(query);
  });
});

function resetForm() {
  form.name = props.packageItem?.name ?? '';
  form.description = props.packageItem?.description ?? '';
  form.selectedCourseIds = props.packageItem?.courses?.map((course) => course.id) ?? [];
  form.courseQuery = '';
  validationMessage.value = '';
}

function toggleCourse(courseId: string) {
  if (form.selectedCourseIds.includes(courseId)) {
    form.selectedCourseIds = form.selectedCourseIds.filter((entry) => entry !== courseId);
    return;
  }

  form.selectedCourseIds = [...form.selectedCourseIds, courseId];
}

function submit() {
  const name = form.name.trim();

  if (!name) {
    validationMessage.value = 'Adj nevet a csomagnak.';
    return;
  }

  if (form.selectedCourseIds.length === 0) {
    validationMessage.value = 'Legalább egy tárgyat válassz ki.';
    return;
  }

  if (!selectedFacultyId.value) {
    validationMessage.value = 'A csomag karát nem sikerült meghatározni.';
    return;
  }

  validationMessage.value = '';

  emit('submit', {
    name,
    description: form.description.trim(),
    facultyId: selectedFacultyId.value,
    courseIds: form.selectedCourseIds,
  });
}

watch(
  () => [props.modelValue, props.packageItem?.id, props.availableCourses.length],
  ([isOpen]) => {
    if (!isOpen) return;
    resetForm();
  },
  { immediate: true }
);
</script>

<template>
  <BaseDialog
    :model-value="props.modelValue"
    :title="props.packageItem ? 'Csomag módosítása' : 'Új csomag létrehozása'"
    width="md"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <form class="editor" @submit.prevent="submit">
      <label class="field">
        <span>Csomag neve</span>
        <input
          v-model="form.name"
          maxlength="120"
          required
          type="text"
          placeholder="BME VIK Mérnökinfo 1. félév"
        />
      </label>

      <label class="field">
        <span>Leírás</span>
        <textarea
          v-model="form.description"
          maxlength="600"
          placeholder="BSc képzés"
          rows="3"
        ></textarea>
      </label>

      <div class="editor__section">
        <div class="editor__section-head">
          <div>
            <p class="editor__eyebrow">Tárgyak</p>
            <p class="editor__hint">
              Az első kiválasztott tárgy határozza meg a csomag karát és egyetemét, de a felvett
              tárgyaid közül bármelyiket beteheted a csomagba.
            </p>
          </div>

          <span class="editor__counter">{{ form.selectedCourseIds.length }} kiválasztva</span>
        </div>

        <label class="field">
          <span>Szűrés név vagy kód alapján</span>
          <input v-model="form.courseQuery" placeholder="Adatb, BMEV..." type="text" />
        </label>

        <div v-if="selectedCourses.length > 0" class="editor__selected">
          <p class="editor__eyebrow">Kiválasztott tárgyak</p>

          <div class="editor__selected-list">
            <button
              v-for="course in selectedCourses"
              :key="course.id"
              class="editor__chip"
              type="button"
              @click="toggleCourse(course.id)"
            >
              <strong>{{ course.name }}</strong>
              <span>{{ course.code }}</span>
              <small>Kattints az eltávolításhoz</small>
            </button>
          </div>
        </div>

        <div v-if="filteredCourses.length > 0" class="editor__course-list">
          <button
            v-for="course in filteredCourses"
            :key="course.id"
            class="editor__course-option"
            type="button"
            @click="toggleCourse(course.id)"
          >
            <strong>{{ course.name }}</strong>
            <span>{{ course.code }}</span>
            <small>Tárgy kijelölése</small>
          </button>
        </div>

        <p v-else class="editor__empty">
          {{
            dedupedAvailableCourses.length === 0
              ? 'Nincs használható tárgy. Először vegyél fel tárgyakat a Tárgyaim vagy Tárgyak keresése oldalon.'
              : 'Nincs a szűrésnek megfelelő további tárgy.'
          }}
        </p>
      </div>

      <p v-if="validationMessage" class="editor__validation">{{ validationMessage }}</p>

      <div class="editor__actions">
        <BaseButton :disabled="props.busy" kind="ghost" @click="emit('update:modelValue', false)">
          Mégse
        </BaseButton>

        <BaseButton :disabled="props.busy" kind="primary" type="submit">
          {{ props.busy ? 'Mentés...' : props.packageItem ? 'Mentés' : 'Létrehozás' }}
        </BaseButton>
      </div>
    </form>
  </BaseDialog>
</template>

<style scoped>
.editor {
  display: grid;
  gap: 1rem;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span,
.editor__eyebrow,
.editor__hint,
.editor__empty,
.editor__validation {
  margin: 0;
}

.field span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.field input,
.field textarea {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  padding: 0.8rem 0.95rem;
  width: 100%;
}

.field textarea {
  min-height: 6rem;
  resize: vertical;
}

.editor__section {
  display: grid;
  gap: 0.85rem;
}

.editor__section-head {
  align-items: start;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: space-between;
}

.editor__eyebrow {
  color: var(--text-subtle);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.editor__hint,
.editor__empty {
  color: var(--text-muted);
  line-height: 1.5;
}

.editor__counter {
  background: rgba(59, 130, 246, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 0.75rem;
}

.editor__selected,
.editor__course-list,
.editor__selected-list {
  display: grid;
  gap: 0.7rem;
}

.editor__selected-list {
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.editor__chip,
.editor__course-option {
  border-radius: 1rem;
  color: var(--text-primary);
  cursor: pointer;
  display: grid;
  gap: 0.2rem;
  padding: 0.9rem 0.95rem;
  text-align: left;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease;
}

.editor__chip {
  background: linear-gradient(180deg, rgba(52, 211, 153, 0.12), rgba(15, 23, 42, 0.86));
  border: 1px solid rgba(52, 211, 153, 0.32);
  box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.08);
}

.editor__course-option {
  background: rgba(15, 23, 42, 0.74);
  border: 1px solid rgba(96, 165, 250, 0.14);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.editor__chip:hover,
.editor__course-option:hover {
  border-color: rgba(96, 165, 250, 0.3);
  transform: translateY(-1px);
}

.editor__chip span,
.editor__course-option span,
.editor__chip small,
.editor__course-option small {
  color: var(--text-subtle);
  font-size: 0.85rem;
}

.editor__chip small {
  color: #d1fae5;
}

.editor__validation {
  color: #ef4444;
  line-height: 1.45;
}

.editor__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}
</style>
