<script setup lang="ts">
import BaseButton from '@/components/BaseButton.vue';
import CourseCard from '@/components/CourseCard.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();
</script>

<template>
  <section class="page">
    <div class="panel">
      <div class="panel__header">
        <div>
          <h2>Felvett tárgyak áttekintése</h2>
        </div>

        <span class="panel__badge">{{ app.state.selectedCourses.length }} felvett tárgy</span>
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
    </div>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 1.35rem;
}

.quick-card {
  color: inherit;
  display: grid;
  gap: 0.55rem;
  min-height: 9.5rem;
  padding: 1.2rem;
  text-decoration: none;
  transition: transform 150ms ease;
}

.quick-card:hover {
  transform: translateY(-2px);
}

.quick-card span {
  color: var(--text-subtle);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.quick-card strong {
  font-size: 1.05rem;
  line-height: 1.45;
}

.panel {
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.panel__header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
}

.panel__header h2,
.empty-state h3 {
  margin: 0;
}

.panel__badge {
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
  display: grid;
  gap: 0.9rem;
  justify-items: start;
  padding: 0.8rem 0;
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
