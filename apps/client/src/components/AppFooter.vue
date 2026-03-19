<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <p class="footer__tagline">Egyetemi tárgyak, egyszerűen.</p>

      <div class="footer__links">
        <RouterLink
          :class="['footer__link', { 'footer__link--active': route.name === 'error-report' }]"
          to="/error-report"
        >
          Hibajelentés
        </RouterLink>

        <a
          class="footer__link"
          href="https://github.com/BrNi05/CourseHub/blob/main/legal/privacy.md"
          rel="noreferrer"
          target="_blank"
        >
          Adatvédelmi Tájékoztató
        </a>

        <a
          class="footer__link"
          href="https://github.com/BrNi05/CourseHub/blob/main/legal/tos.md"
          rel="noreferrer"
          target="_blank"
        >
          ÁSZF
        </a>

        <a
          class="footer__link"
          href="https://github.com/BrNi05/CourseHub"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: auto;
  padding: 0 1.5rem 1.4rem;
  position: relative;
  width: 100%;
  z-index: 2;
}

.footer__inner {
  align-items: center;
  backdrop-filter: blur(18px);
  background: rgba(8, 12, 25, 0.72);
  border: 1px solid var(--border-soft);
  border-radius: 1.2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 84rem;
  padding: 0.85rem 1rem;
}

.footer__tagline {
  color: var(--text-muted);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0;
}

.footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.footer__link {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.16);
  border-radius: 999px;
  color: var(--text-primary);
  display: inline-flex;
  font-weight: 600;
  padding: 0.62rem 0.95rem;
  text-decoration: none;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;
}

.footer__link:hover {
  background: rgba(59, 130, 246, 0.16);
  border-color: rgba(96, 165, 250, 0.28);
  transform: translateY(-1px);
}

.footer__link--active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(124, 58, 237, 0.18));
  border-color: rgba(129, 140, 248, 0.32);
}

@media (min-width: 900px) {
  .footer {
    padding: 0 2rem 1.6rem;
  }
}
</style>
