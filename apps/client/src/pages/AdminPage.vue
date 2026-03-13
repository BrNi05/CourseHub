<script setup lang="ts">
import { computed, watch } from 'vue';

import { useAppStore } from '@/lib/app-store';

const app = useAppStore();
const isAdmin = computed(() => app.state.session.isAdmin);

watch(
  () => app.state.session.isAdmin,
  (value) => {
    if (value) {
      app.loadAdminErrorReports();
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="admin-page">
    <div class="admin-card">
      <h1>Admin reports</h1>
      <p v-if="isAdmin" class="admin-copy">
        Backend-side error reports collected from users are listed here for triage and review.
      </p>
      <p v-else class="admin-copy">This page is only available to admin accounts.</p>

      <div v-if="isAdmin && app.state.adminErrorReports.length > 0" class="admin-list">
        <article
          v-for="report in app.state.adminErrorReports"
          :key="`${report.userId}-${report.receivedAt}`"
          class="admin-item"
        >
          <div>
            <strong>{{ report.message }}</strong>
            <p>{{ report.route }} · {{ report.platform }} · {{ report.receivedAt }}</p>
            <p>{{ report.userAction || 'No user action description provided.' }}</p>
          </div>
        </article>
      </div>

      <p v-else-if="isAdmin" class="admin-copy">No stored backend reports were returned.</p>
    </div>
  </section>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: 1.2rem;
}

.admin-card {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.8rem;
  box-shadow: var(--shadow-large);
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.admin-card h1,
.admin-copy,
.admin-item p {
  margin: 0;
}

.admin-copy {
  color: var(--text-muted);
  line-height: 1.6;
}

.admin-list {
  display: grid;
  gap: 0.85rem;
}

.admin-item {
  align-items: center;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 1.2rem;
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
}

.admin-item p + p {
  margin-top: 0.45rem;
}
</style>
