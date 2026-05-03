<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import AccountActions from './AccountActions.vue';
import BaseDialog from './BaseDialog.vue';

const route = useRoute();
const isMobileMenuOpen = ref(false);

const navigation = computed(() => {
  return [
    { name: 'courses', label: 'Tárgyaim', to: '/' },
    { name: 'averages', label: 'Átlagok', to: '/averages' },
    { name: 'packages', label: 'Csomagjaim', to: '/packages' },
    { name: 'search', label: 'Keresés', to: '/search' },
    { name: 'suggest', label: 'Javaslat', to: '/suggest' },
  ];
});

function openMobileMenu() {
  isMobileMenuOpen.value = true;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

// Close the mobile menu when navigating to a page
watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);
</script>

<template>
  <header class="header">
    <div class="header__main">
      <RouterLink class="brand" to="/">
        <img alt="CourseHub logo" class="brand__logo" height="48" src="/logo.png" width="48" />
        <strong class="brand__title">CourseHub</strong>
      </RouterLink>

      <nav class="header__nav header__nav--desktop" aria-label="Primary">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :class="['header__link', { 'header__link--active': route.name === item.name }]"
          :to="item.to"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header__actions header__actions--desktop">
        <AccountActions />
      </div>

      <button
        aria-controls="mobile-navigation"
        :aria-expanded="isMobileMenuOpen"
        aria-label="Menü megnyitása"
        class="header__menu-toggle"
        type="button"
        @click="openMobileMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </header>

  <BaseDialog v-model="isMobileMenuOpen" description="" title="Menü" width="md">
    <div id="mobile-navigation" class="mobile-menu">
      <nav class="mobile-menu__nav" aria-label="Mobile primary">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :class="['mobile-menu__link', { 'mobile-menu__link--active': route.name === item.name }]"
          :to="item.to"
          @click="closeMobileMenu"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="mobile-menu__account">
        <AccountActions />
      </div>
    </div>
  </BaseDialog>
</template>

<style scoped>
.header {
  margin: 0 auto;
  max-width: 84rem;
  padding: 1.4rem 1.5rem 0;
  position: relative;
  width: 100%;
  z-index: 2;
}

.header__main {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
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

.header__nav--desktop,
.header__actions--desktop {
  display: none;
}

.header__link {
  border-radius: 999px;
  color: var(--text-muted);
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.header__link:hover {
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
  flex-wrap: wrap;
  gap: 0.8rem;
  justify-content: space-between;
}

.header__menu-toggle {
  align-items: center;
  align-self: start;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  box-shadow: 0 18px 34px rgba(2, 6, 23, 0.28);
  cursor: pointer;
  display: inline-grid;
  gap: 0.3rem;
  justify-items: center;
  margin-left: auto;
  min-height: 3rem;
  padding: 0.75rem 0.85rem;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.header__menu-toggle:hover {
  background: rgba(30, 41, 59, 0.94);
  border-color: rgba(96, 165, 250, 0.32);
  transform: translateY(-1px);
}

.header__menu-toggle span {
  background: var(--text-primary);
  border-radius: 999px;
  display: block;
  height: 2px;
  width: 1.2rem;
}

.mobile-menu {
  display: grid;
  gap: 1rem;
  padding-top: 1.5rem;
}

.mobile-menu__nav {
  display: grid;
  gap: 0.65rem;
}

.mobile-menu__link {
  background: rgba(15, 23, 42, 0.82);
  border: 1px solid rgba(96, 165, 250, 0.12);
  border-radius: 1rem;
  color: var(--text-primary);
  font-weight: 700;
  padding: 1rem 1.05rem;
  text-decoration: none;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    background-color 140ms ease;
}

.mobile-menu__link:hover {
  background: rgba(30, 41, 59, 0.94);
  border-color: rgba(96, 165, 250, 0.28);
  transform: translateY(-1px);
}

.mobile-menu__link--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(124, 58, 237, 0.18));
  border-color: rgba(129, 140, 248, 0.32);
}

.mobile-menu__account {
  border-top: 1px solid var(--border-soft);
  padding-top: 1rem;
}

@media (min-width: 1120px) {
  .header {
    padding: 1.6rem 2rem 0;
  }

  .header__main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    justify-content: initial;
  }

  .header__nav--desktop,
  .header__actions--desktop {
    display: flex;
  }

  .header__actions--desktop {
    justify-content: flex-end;
  }

  .header__menu-toggle {
    display: none;
  }
}
</style>
