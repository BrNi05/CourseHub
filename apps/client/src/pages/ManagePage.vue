<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue';
import CourseCard from '@/components/CourseCard.vue';

import { useAppStore } from '@/stores/composables/use-app-store';

const app = useAppStore();
</script>

<template>
  <section class="page">
    <div class="page__intro">
      <div class="page__header">
        <h1>Felvett tárgyak</h1>
        <span class="page__badge">{{ app.state.selectedCourses.length }} felvett tárgy</span>
      </div>
    </div>

    <div v-if="app.state.selectedCourses.length > 0" class="course-grid">
      <CourseCard
        v-for="course in app.state.selectedCourses"
        :key="course.id"
        :busy="app.state.syncingCourses"
        :course="course"
        mode="saved"
        @remove="app.removeCourse"
      />
    </div>

    <div v-else class="empty-state">
      <h3>Nincs felvett tárgy</h3>
      <p>
        Használd a keresőoldalt, és jelöld meg azokat a tárgyakat, amelyeket szeretnéd itt látni.
      </p>

      <div class="empty-state__actions">
        <BaseButton kind="primary" @click="$router.push('/search')">Tárgyak keresése</BaseButton>

        <BaseButton
          v-if="!app.isAuthenticated()"
          :disabled="app.state.loginInFlight"
          kind="secondary"
          @click="app.loginWithGoogle"
        >
          {{ app.state.loginInFlight ? 'Átirányítás...' : 'Bejelentkezés' }}
        </BaseButton>
      </div>
    </div>

    <section v-if="app.state.news.length > 0" class="news-panel" aria-labelledby="news-panel-title">
      <div class="news-panel__header">
        <h2 id="news-panel-title">Hírek</h2>
      </div>

      <div class="news-list">
        <article
          v-for="(item, index) in app.state.news"
          :key="`${index}-${item}`"
          class="news-card"
        >
          <span class="news-card__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <p>{{ item }}</p>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 2.4rem;
}

.page__intro {
  display: grid;
  gap: 0.85rem;
  padding-top: 1.2rem;
}

.page__header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.page h1,
.empty-state h3 {
  margin: 0;
}

.empty-state h3,
.news-panel h2 {
  font-size: 1.5rem;
  line-height: 1.2;
}

.page__badge {
  background: rgba(59, 130, 246, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  display: inline-flex;
  padding: 0.65rem 0.9rem;
  font-weight: 600;
}

.course-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
}

.empty-state {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem;
  box-shadow: var(--shadow-large);
  display: grid;
  gap: 0.9rem;
  justify-items: start;
  padding: 1.2rem;
}

.news-panel {
  backdrop-filter: blur(18px);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(9, 14, 32, 0.82));
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem;
  box-shadow: var(--shadow-large);
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.news-panel__header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
}

.news-panel h2 {
  margin: 0;
}

.news-list {
  display: grid;
  gap: 1.05rem;
}

.news-card {
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(15, 23, 42, 0.58));
  border: 1px solid rgba(129, 140, 248, 0.16);
  border-radius: 1.2rem;
  box-shadow: 0 18px 40px rgba(2, 6, 23, 0.22);
  display: grid;
  gap: 0.85rem;
  grid-template-columns: auto 1fr;
  padding: 1rem 1.05rem;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.news-card:hover {
  border-color: rgba(96, 165, 250, 0.34);
  box-shadow: 0 22px 48px rgba(2, 6, 23, 0.3);
  transform: translateY(-2px);
}

.news-card__index {
  align-items: center;
  background: rgba(96, 165, 250, 0.14);
  border-radius: 999px;
  color: var(--text-subtle);
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 700;
  justify-content: center;
  letter-spacing: 0.08em;
  min-width: 2.7rem;
  padding: 0.45rem 0.7rem;
}

.news-card p {
  color: var(--text-primary);
  line-height: 1.55;
  margin: 0;
}

.empty-state p {
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
  max-width: 40rem;
  width: 100%;
}

.empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 0.35rem;
}

@media (max-width: 640px) {
  .news-card {
    grid-template-columns: 1fr;
  }

  .news-card__index {
    min-width: 0;
    width: fit-content;
  }
}
</style>
