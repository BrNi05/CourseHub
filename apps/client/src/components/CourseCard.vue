<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import BaseButton from './BaseButton.vue';
import type { Course } from '@coursehub/sdk';

const props = defineProps<{
  course: Course;
  mode: 'saved' | 'search';
  busy?: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  add: [course: Course];
  remove: [courseId: string];
}>();

const links = computed(() =>
  [
    { label: 'Page', value: props.course.coursePageUrl },
    { label: 'TAD', value: props.course.courseTadUrl },
    { label: 'Moodle', value: props.course.courseMoodleUrl },
    { label: 'Teams', value: props.course.courseTeamsUrl },
    { label: 'Extra', value: props.course.courseExtraUrl },
  ].filter((entry) => Boolean(entry.value))
);
</script>

<template>
  <article class="course-card">
    <div class="course-card__top">
      <div>
        <p class="course-card__eyebrow">
          {{ props.mode === 'saved' ? 'Current setup' : 'Course search' }}
        </p>
        <h3>{{ props.course.name }}</h3>
      </div>

      <span class="course-card__code">{{ props.course.code }}</span>
    </div>

    <div class="course-card__links">
      <a
        v-for="entry in links"
        :key="entry.label"
        :href="entry.value"
        class="course-card__link"
        rel="noreferrer"
        target="_blank"
      >
        <span class="course-card__dot"></span>
        <span>{{ entry.label }}</span>
      </a>

      <p v-if="links.length === 0" class="course-card__muted">
        No external links stored for this course yet.
      </p>
    </div>

    <div class="course-card__actions">
      <BaseButton
        v-if="props.mode === 'saved'"
        :disabled="props.busy"
        kind="danger"
        @click="emit('remove', props.course.id)"
      >
        Remove
      </BaseButton>

      <BaseButton
        v-else
        :disabled="props.busy || props.selected"
        :kind="props.selected ? 'ghost' : 'primary'"
        @click="emit('add', props.course)"
      >
        {{ props.selected ? 'Already added' : 'Add course' }}
      </BaseButton>

      <RouterLink
        :to="{ name: 'suggest', query: { editCourseId: props.course.id } }"
        class="course-card__edit"
      >
        Edit as suggestion
      </RouterLink>
    </div>
  </article>
</template>

<style scoped>
.course-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.5rem;
  box-shadow: 0 22px 50px rgba(2, 6, 23, 0.34);
  display: grid;
  gap: 1rem;
  min-height: 100%;
  padding: 1.2rem;
}

.course-card__top {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.course-card__eyebrow {
  color: var(--text-subtle);
  font-size: 0.74rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.45rem;
  text-transform: uppercase;
}

.course-card h3 {
  font-size: 1.08rem;
  line-height: 1.35;
  margin: 0;
}

.course-card__code {
  background: rgba(99, 102, 241, 0.18);
  border-radius: 999px;
  color: #dbeafe;
  font-size: 0.84rem;
  font-weight: 700;
  padding: 0.55rem 0.8rem;
}

.course-card__links {
  display: grid;
  gap: 0.55rem;
}

.course-card__link {
  align-items: center;
  color: var(--text-primary);
  display: inline-flex;
  gap: 0.55rem;
  text-decoration: none;
}

.course-card__dot {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-green));
  border-radius: 999px;
  display: inline-block;
  height: 0.55rem;
  width: 0.55rem;
}

.course-card__muted {
  color: var(--text-subtle);
  margin: 0;
}

.course-card__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  justify-content: space-between;
  margin-top: auto;
}

.course-card__edit {
  color: #c4b5fd;
  text-decoration: none;
}
</style>
