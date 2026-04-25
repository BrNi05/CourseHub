<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from './BaseButton.vue';

import type { CoursePackage } from '@coursehub/sdk';

const props = withDefaults(
  defineProps<{
    packageItem: CoursePackage;
    mode: 'mine' | 'search';
    actionBusy?: boolean;
    actionDisabled?: boolean;
    actionLabel?: string;
    deleteBusy?: boolean;
  }>(),
  {
    actionBusy: false,
    actionDisabled: false,
    actionLabel: 'Felvétel',
    deleteBusy: false,
  }
);

const emit = defineEmits<{
  edit: [packageItem: CoursePackage];
  remove: [packageItem: CoursePackage];
  use: [packageItem: CoursePackage];
  share: [packageItem: CoursePackage];
}>();

const courseEntries = computed(() => props.packageItem.courses ?? []);
const courseCountLabel = computed(() => `${courseEntries.value.length} tárgy`);
const facultyName = computed(() => props.packageItem.faculty?.name || 'Ismeretlen kar');
const typeLabel = computed(() => (props.packageItem.isPermanent ? 'Állandó' : 'Közösségi'));
</script>

<template>
  <article class="package-card">
    <div class="package-card__top">
      <div class="package-card__heading">
        <div class="package-card__meta-row">
          <div class="package-card__meta-main">
            <span class="package-card__faculty">{{ facultyName }}</span>
            <span class="package-card__course-count">{{ courseCountLabel }}</span>
          </div>

          <span class="package-card__badge">{{ typeLabel }}</span>
        </div>

        <h3 class="package-card__name">{{ props.packageItem.name }}</h3>

        <p v-if="props.packageItem.description" class="package-card__description">
          {{ props.packageItem.description }}
        </p>
      </div>
    </div>

    <div class="package-card__courses">
      <p class="package-card__section-title">Tárgyak</p>

      <div v-if="courseEntries.length > 0" class="package-card__course-list">
        <div v-for="course in courseEntries" :key="course.id" class="package-card__course-item">
          <strong>{{ course.name }}</strong>
          <span>{{ course.code }}</span>
        </div>
      </div>

      <p v-else class="package-card__muted">Ehhez a csomaghoz jelenleg nincs tárgy rendelve.</p>
    </div>

    <div class="package-card__actions">
      <div class="package-card__action-group">
        <BaseButton
          v-if="props.mode === 'mine'"
          :disabled="props.actionBusy"
          kind="ghost"
          @click="emit('edit', props.packageItem)"
        >
          Módosítás
        </BaseButton>

        <BaseButton
          v-else
          :disabled="props.actionBusy || props.actionDisabled"
          :kind="props.actionDisabled ? 'ghost' : 'primary'"
          @click="emit('use', props.packageItem)"
        >
          {{ props.actionBusy ? 'Folyamatban...' : props.actionLabel }}
        </BaseButton>

        <BaseButton kind="secondary" @click="emit('share', props.packageItem)">
          Megosztás
        </BaseButton>

        <BaseButton
          v-if="props.mode === 'mine'"
          :disabled="props.deleteBusy"
          kind="danger"
          @click="emit('remove', props.packageItem)"
        >
          Törlés
        </BaseButton>
      </div>
    </div>
  </article>
</template>

<style scoped>
.package-card {
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.5rem;
  box-shadow: 0 22px 50px rgba(2, 6, 23, 0.34);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  min-height: 100%;
  padding: 1.2rem;
}

.package-card__top,
.package-card__heading,
.package-card__courses {
  display: grid;
  gap: 0.7rem;
  min-width: 0;
}

.package-card__meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: space-between;
}

.package-card__meta-main {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  min-width: 0;
}

.package-card__faculty {
  color: var(--text-primary);
  font-weight: 700;
  text-align: left;
}

.package-card__course-count,
.package-card__badge {
  border-radius: 999px;
  font-size: 0.76rem;
  line-height: 1.2;
  padding: 0.45rem 0.7rem;
}

.package-card__course-count {
  background: rgba(59, 130, 246, 0.16);
  color: #dbeafe;
  font-weight: 700;
}

.package-card__badge {
  background: rgba(52, 211, 153, 0.12);
  color: #d1fae5;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.package-card h3,
.package-card__description,
.package-card__section-title,
.package-card__muted {
  margin: 0;
}

.package-card__name {
  color: #c4d7ff;
  font-size: 1.08rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.package-card__description,
.package-card__muted {
  color: var(--text-muted);
  line-height: 1.55;
}

.package-card__section-title {
  color: var(--text-subtle);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.package-card__course-list {
  display: grid;
  gap: 0.7rem;
}

.package-card__course-item {
  background: rgba(15, 23, 42, 0.68);
  border: 1px solid rgba(96, 165, 250, 0.12);
  border-radius: 1rem;
  display: grid;
  gap: 0.18rem;
  padding: 0.8rem 0.9rem;
}

.package-card__course-item strong,
.package-card__course-item span {
  overflow-wrap: anywhere;
}

.package-card__course-item span {
  color: var(--text-subtle);
  font-size: 0.86rem;
}

.package-card__actions {
  margin-top: auto;
  padding-top: 0.2rem;
}

.package-card__action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}
</style>
