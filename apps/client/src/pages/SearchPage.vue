<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import CourseCard from '@/components/CourseCard.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();

const selectedIds = computed<Set<string>>(
  () => new Set(app.state.selectedCourses.map((course) => String(course.id)))
);
</script>

<template>
  <section class="search-page">
    <div class="search-page__hero">
      <div class="search-page__hero-copy">
        <h1>Tárgyak keresése</h1>
        <p class="search-page__lede">
          Szűrj a tárgyak között egyetem, név vagy kód alapján, és jelöld meg azokat, amelyeket
          felvetted.
        </p>
      </div>
    </div>

    <div class="search-panel">
      <div class="search-panel__header">
        <div>
          <p class="search-page__eyebrow">Szűrők</p>
          <h2>Keresés az összes ismert tárgy között</h2>
        </div>

        <BaseButton
          :disabled="app.state.searchingCourses || app.state.loadingUniversities"
          @click="app.searchCourses"
        >
          {{ app.state.searchingCourses ? 'Searching...' : 'Search courses' }}
        </BaseButton>
      </div>

      <form class="search-grid" @submit.prevent="app.searchCourses">
        <label class="field field--university">
          <span>Egyetem</span>
          <select
            v-model="app.state.searchFilters.universityId"
            :disabled="app.state.loadingUniversities"
          >
            <option
              v-for="university in app.state.universities"
              :key="university.id"
              :value="university.id"
            >
              {{ university.name }} ({{ university.abbrevName }})
            </option>
          </select>
        </label>

        <label class="field">
          <span>Tárgy neve</span>
          <input v-model="app.state.searchFilters.courseName" placeholder="Adatb.." type="text" />
        </label>

        <label class="field">
          <span>Tárgykód</span>
          <input
            v-model="app.state.searchFilters.courseCode"
            placeholder="BMEVITMA.."
            type="text"
          />
        </label>
      </form>
    </div>

    <div v-if="app.state.searchResults.length > 0" class="course-grid">
      <CourseCard
        v-for="course in app.state.searchResults"
        :key="course.id"
        :busy="app.state.syncingCourses"
        :course="course"
        :selected="selectedIds.has(course.id)"
        mode="search"
        @add="app.addCourse"
      />
    </div>

    <div v-else class="empty-state">
      <h3>Nincs a keresésnek megfelelő tárgy.</h3>
      <p>
        Módosítsd a keresési feltételeket, vagy add hozzá a CourseHub adatbázisához a még nem ismert
        tárgyat.
      </p>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  display: grid;
  gap: 1.55rem;
}

.search-page__hero {
  display: grid;
  gap: 1.25rem;
}

.search-page__hero-copy {
  display: grid;
  gap: 0.85rem;
  min-width: 0;
}

.search-page h1 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}

.search-page__lede,
.empty-state p {
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.search-panel,
.empty-state {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem;
  box-shadow: var(--shadow-large);
}

.search-panel {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.search-panel__header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.search-panel__header h2,
.empty-state h3 {
  margin: 0;
}

.search-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.field {
  display: grid;
  gap: 0.45rem;
  min-width: 0;
}

.field span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.field input,
.field select {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  min-height: 3rem;
  padding: 0 0.95rem;
  width: 100%;
}

.course-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
}

.empty-state {
  display: grid;
  gap: 0.8rem;
  justify-items: start;
  padding: 1.2rem;
}

@media (min-width: 960px) {
  .search-page__hero {
    grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 0.8fr);
  }

  .search-page h1,
  .search-page__lede {
    white-space: nowrap;
  }

  .search-grid {
    grid-template-columns: minmax(22rem, 1.45fr) minmax(12rem, 1fr) minmax(12rem, 1fr);
  }
}
</style>
