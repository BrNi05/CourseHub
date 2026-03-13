<script setup lang="ts">
import { computed } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import CourseCard from '@/components/CourseCard.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();

const selectedIds = computed(() => new Set(app.state.selectedCourses.map((course) => course.id)));
const selectedUniversity = computed(() => app.selectedUniversity());
</script>

<template>
  <section class="search-page">
    <div class="search-page__hero">
      <div>
        <h1>Find courses on a dedicated search screen, then pin them to your landing page.</h1>
        <p class="search-page__lede">
          Search by university, name, or code. Command-click or control-click on any course link
          still opens it in a new tab.
        </p>
      </div>

      <div class="search-page__status">
        <p class="search-page__eyebrow">Pinned</p>
        <strong>{{ app.state.selectedCourses.length }} courses currently on your landing page</strong>
        <span>
          {{
            selectedUniversity
              ? `${selectedUniversity.name} is the active search context.`
              : 'Choose a university to begin.'
          }}
        </span>
      </div>
    </div>

    <div class="search-panel">
      <div class="search-panel__header">
        <div>
          <p class="search-page__eyebrow">Filters</p>
          <h2>Search public course records</h2>
        </div>

        <BaseButton
          :disabled="app.state.searchingCourses || app.state.loadingUniversities"
          @click="app.searchCourses"
        >
          {{ app.state.searchingCourses ? 'Searching...' : 'Search courses' }}
        </BaseButton>
      </div>

      <form class="search-grid" @submit.prevent="app.searchCourses">
        <label class="field">
          <span>University</span>
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
          <span>Course name</span>
          <input v-model="app.state.searchFilters.courseName" placeholder="Databases" type="text" />
        </label>

        <label class="field">
          <span>Course code</span>
          <input v-model="app.state.searchFilters.courseCode" placeholder="BMEVI..." type="text" />
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
      <h3>No courses in the current result set</h3>
      <p>Run a search with the current filters to populate this page with candidate courses.</p>
    </div>
  </section>
</template>

<style scoped>
.search-page {
  display: grid;
  gap: 1.35rem;
}

.search-page__hero {
  display: grid;
  gap: 1rem;
}

.search-page__eyebrow {
  color: var(--text-subtle);
  font-size: 0.74rem;
  letter-spacing: 0.1em;
  margin: 0 0 0.45rem;
  text-transform: uppercase;
}

.search-page h1 {
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
  max-width: 14ch;
}

.search-page__lede,
.search-page__status span,
.empty-state p {
  color: var(--text-muted);
  line-height: 1.6;
}

.search-page__status,
.search-panel,
.empty-state {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem;
  box-shadow: var(--shadow-large);
}

.search-page__status {
  display: grid;
  gap: 0.45rem;
  padding: 1.25rem;
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
}
</style>
