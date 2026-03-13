<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import BaseButton from './BaseButton.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();
const route = useRoute();

const navigation = computed(() => {
  const items = [
    { name: 'manage', label: 'Manage', to: '/' },
    { name: 'search', label: 'Search', to: '/search' },
    { name: 'suggest', label: 'Suggest', to: '/suggest' },
    { name: 'error-report', label: 'Error Report', to: '/error-report' },
  ];

  if (app.state.session.isAdmin) {
    items.push({ name: 'admin', label: 'Admin', to: '/admin' });
  }

  return items;
});

const sessionLabel = computed(() => app.state.session.email ?? 'Login with Google');
</script>

<template>
  <header class="header">
    <RouterLink class="brand" to="/">
      <img alt="CourseHub logo" class="brand__logo" height="48" src="/logo.png" width="48" />
      <strong class="brand__title">CourseHub</strong>
    </RouterLink>

    <nav class="header__nav" aria-label="Primary">
      <RouterLink
        v-for="item in navigation"
        :key="item.name"
        :class="['header__link', { 'header__link--active': route.name === item.name }]"
        :to="item.to"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="header__actions">
      <a
        class="header__github"
        href="https://github.com/BrNi05/CourseHub"
        rel="noreferrer"
        target="_blank"
      >
        GitHub
      </a>

      <BaseButton
        v-if="!app.isAuthenticated()"
        :disabled="app.state.loginInFlight"
        kind="primary"
        @click="app.loginWithGoogle"
      >
        {{ app.state.loginInFlight ? 'Redirecting...' : 'Login' }}
      </BaseButton>

      <BaseButton v-else kind="secondary" @click="app.logout">
        {{ sessionLabel }}
      </BaseButton>
    </div>
  </header>
</template>

<style scoped>
.header {
  align-items: center;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr);
  margin: 0 auto;
  max-width: 84rem;
  padding: 1.4rem 1.5rem 0;
  position: relative;
  width: 100%;
  z-index: 2;
}

.brand {
  align-items: center;
  color: inherit;
  display: inline-flex;
  gap: 0.9rem;
  text-decoration: none;
}

.brand__logo {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(129, 140, 248, 0.18);
  border-radius: 1rem;
  box-shadow: 0 18px 30px rgba(79, 70, 229, 0.24);
  height: 3rem;
  object-fit: cover;
  width: 3rem;
}

.brand__title {
  font-size: 1.02rem;
  letter-spacing: 0.02em;
}

.header__nav {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.header__link,
.header__github {
  border-radius: 999px;
  color: var(--text-muted);
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.header__link:hover,
.header__github:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.header__link--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.16), rgba(124, 58, 237, 0.16));
  color: var(--text-primary);
}

.header__actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: space-between;
}

@media (min-width: 900px) {
  .header {
    grid-template-columns: auto 1fr auto;
    padding: 1.6rem 2rem 0;
  }

  .header__actions {
    justify-content: flex-end;
  }
}
</style>
