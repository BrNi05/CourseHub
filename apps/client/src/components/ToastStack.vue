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
  <TransitionGroup
    class="toast-stack"
    name="toast-stack"
    tag="div"
    aria-live="polite"
    aria-atomic="false"
  >
    <article v-for="notice in notices" :key="notice.id" :class="['toast', `toast--${notice.tone}`]">
      <div class="toast__content">
        <h4>{{ notice.title }}</h4>
        <p>{{ notice.detail }}</p>
      </div>

      <button class="toast__dismiss" type="button" @click="emit('dismiss', notice.id)">OK</button>

      <div class="toast__timer" aria-hidden="true">
        <span
          class="toast__timer-fill"
          :style="{ animationDuration: `${notice.durationMs}ms` }"
        ></span>
      </div>
    </article>
  </TransitionGroup>
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
  overflow-wrap: anywhere;
}

.toast p {
  color: var(--text-muted);
  line-height: 1.45;
  margin-top: 0.35rem;
  white-space: pre-line;
}

.toast__dismiss {
  align-self: start;
  appearance: none;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  font: inherit;
  justify-self: end;
  min-height: 2rem;
  min-width: 2.8rem;
  padding: 0.35rem 0.8rem;
  transition:
    background-color 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;
}

.toast__dismiss:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
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

.toast-stack-enter-active,
.toast-stack-leave-active,
.toast-stack-move {
  transition:
    opacity 150ms ease,
    transform 150ms ease;
}

.toast-stack-enter-from {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}

.toast-stack-leave-to {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}

.toast-stack-leave-active {
  pointer-events: none;
}
</style>
