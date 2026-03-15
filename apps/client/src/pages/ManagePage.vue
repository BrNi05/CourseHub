<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue';
import CourseCard from '@/components/CourseCard.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();
</script>

<template>
  <section class="page">
    <div class="page__intro">
      <div class="page__header">
        <h1>Felvett tárgyak áttekintése</h1>
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
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 1.2rem;
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

.page__badge {
  background: rgba(59, 130, 246, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  display: inline-flex;
  padding: 0.65rem 0.9rem;
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
</style>
