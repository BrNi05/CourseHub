<script setup lang="ts">
import { ref } from 'vue';

const COOKIE_BANNER_ACCEPTED_KEY = 'coursehub.web.cookieBannerAccepted';

const isVisible = ref(globalThis.localStorage.getItem(COOKIE_BANNER_ACCEPTED_KEY) !== 'true');

function closeBanner() {
  globalThis.localStorage.setItem(COOKIE_BANNER_ACCEPTED_KEY, 'true');
  isVisible.value = false;
}
</script>

<template>
  <div v-if="isVisible" class="cookie-banner" role="region" aria-live="polite">
    <p class="cookie-banner__text">A CourseHub biztonsági és egyéb szükséges sütiket használ.</p>

    <button
      class="cookie-banner__close"
      type="button"
      aria-label="Süti tájékoztató bezárása"
      @click="closeBanner"
    >
      X
    </button>
  </div>
</template>

<style scoped>
.cookie-banner {
  align-items: center;
  background: rgba(8, 13, 29, 0.96);
  border-bottom: 1px solid rgba(96, 165, 250, 0.18);
  box-shadow: 0 14px 32px rgba(2, 6, 23, 0.26);
  color: var(--text-muted);
  display: grid;
  gap: 0.85rem;
  grid-template-columns: 1fr auto 1fr;
  min-height: 2.75rem;
  padding: 0.62rem 1rem;
  position: relative;
  width: 100%;
  z-index: 5;
}

.cookie-banner__text {
  font-size: 0.9rem;
  font-weight: 700;
  grid-column: 2;
  line-height: 1.35;
  margin: 0;
  text-align: center;
}

.cookie-banner__close {
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 0.65rem;
  color: var(--text-primary);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 800;
  grid-column: 3;
  height: 2rem;
  justify-content: center;
  justify-self: end;
  line-height: 1;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;
  width: 2rem;
}

.cookie-banner__close:hover {
  background: rgba(96, 165, 250, 0.12);
  border-color: rgba(96, 165, 250, 0.36);
  transform: translateY(-1px);
}

@media (max-width: 520px) {
  .cookie-banner {
    grid-template-columns: 1fr auto;
    min-height: 3rem;
    padding: 0.65rem 0.75rem 0.65rem 1rem;
  }

  .cookie-banner__text {
    font-size: 0.84rem;
    grid-column: 1;
    text-align: left;
  }

  .cookie-banner__close {
    grid-column: 2;
  }
}
</style>
