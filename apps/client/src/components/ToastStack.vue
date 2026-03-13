<script setup lang="ts">
defineProps<{
  notices: Array<{
    id: number;
    tone: 'info' | 'success' | 'danger';
    title: string;
    detail: string;
    durationMs: number;
  }>;
}>();

const emit = defineEmits<{
  dismiss: [id: number];
}>();
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    <article v-for="notice in notices" :key="notice.id" :class="['toast', `toast--${notice.tone}`]">
      <div class="toast__content">
        <h4>{{ notice.title }}</h4>
        <p>{{ notice.detail }}</p>
      </div>

      <button class="toast__dismiss" type="button" @click="emit('dismiss', notice.id)">
        Close
      </button>

      <div class="toast__timer" aria-hidden="true">
        <span
          class="toast__timer-fill"
          :style="{ animationDuration: `${notice.durationMs}ms` }"
        ></span>
      </div>
    </article>
  </div>
</template>

<style scoped>
.toast-stack {
  bottom: 1.4rem;
  display: grid;
  gap: 0.8rem;
  position: fixed;
  right: 1.4rem;
  width: min(24rem, calc(100vw - 2rem));
  z-index: 10;
}

.toast {
  align-items: flex-start;
  backdrop-filter: blur(16px);
  border-radius: 1.2rem;
  box-shadow: 0 22px 38px rgba(3, 3, 3, 0.34);
  display: grid;
  gap: 0.8rem;
  grid-template-columns: minmax(0, 1fr) auto;
  overflow: hidden;
  padding: 1rem 1rem 1.25rem 1.05rem;
  position: relative;
}

.toast::before {
  content: '';
  inset: 0 auto 0 0;
  position: absolute;
  width: 0.35rem;
}

.toast--info {
  background: rgba(18, 20, 26, 0.92);
}

.toast--info::before {
  background: #60a5fa;
}

.toast--success {
  background: rgba(15, 24, 18, 0.94);
}

.toast--success::before {
  background: #34d399;
}

.toast--danger {
  background: rgba(31, 15, 17, 0.94);
}

.toast--danger::before {
  background: #fb7185;
}

.toast h4,
.toast p {
  margin: 0;
}

.toast h4 {
  font-size: 0.95rem;
}

.toast__content {
  min-width: 0;
}

.toast p {
  color: var(--text-muted);
  line-height: 1.45;
  margin-top: 0.35rem;
}

.toast__dismiss {
  appearance: none;
  background: transparent;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
  font: inherit;
  padding: 0.15rem 0;
}

.toast__timer {
  background: rgba(255, 255, 255, 0.1);
  bottom: 0;
  height: 0.22rem;
  inset-inline: 0;
  position: absolute;
}

.toast__timer-fill {
  animation-fill-mode: forwards;
  animation-name: toast-timer;
  animation-timing-function: linear;
  background: rgba(255, 255, 255, 0.55);
  display: block;
  height: 100%;
  transform-origin: left center;
}

@keyframes toast-timer {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}
</style>
