<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    description?: string;
    width?: 'sm' | 'md';
  }>(),
  {
    description: '',
    width: 'sm',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const titleId = `dialog-title-${Math.random().toString(36).slice(2, 10)}`;

function close() {
  emit('update:modelValue', false);
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close();
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    close();
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (globalThis.window === undefined) return;

    if (isOpen) {
      globalThis.window.addEventListener('keydown', handleKeydown);
      globalThis.document.body.style.overflow = 'hidden';
      return;
    }

    globalThis.window.removeEventListener('keydown', handleKeydown);
    globalThis.document.body.style.removeProperty('overflow');
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (globalThis.window === undefined) return;

  globalThis.window.removeEventListener('keydown', handleKeydown);
  globalThis.document.body.style.removeProperty('overflow');
});
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="props.modelValue" class="dialog" @click="handleBackdropClick">
        <dialog
          open
          :class="['dialog__panel', `dialog__panel--${props.width}`]"
          :aria-labelledby="titleId"
        >
          <div class="dialog__header">
            <div class="dialog__copy">
              <h2 :id="titleId">{{ props.title }}</h2>
              <p v-if="props.description">{{ props.description }}</p>
            </div>
          </div>

          <div class="dialog__body">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="dialog__footer">
            <slot name="footer" :close="close"></slot>
          </div>
        </dialog>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog {
  align-items: end;
  backdrop-filter: blur(12px);
  background: rgba(2, 6, 23, 0.72);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 40;
}

.dialog__panel {
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(9, 14, 32, 0.98));
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem 1.6rem 1.1rem 1.1rem;
  box-shadow: 0 28px 60px rgba(2, 6, 23, 0.48);
  display: grid;
  gap: 0.85rem;
  inset: auto;
  margin: 0;
  max-height: min(100%, calc(100dvh - 2rem));
  overflow: auto;
  padding: 0.9rem;
  position: static;
  width: min(100%, 28rem);
}

.dialog__panel--md {
  width: min(100%, 36rem);
}

.dialog__header {
  align-items: start;
  display: flex;
  gap: 0.7rem;
  justify-content: space-between;
}

.dialog__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2.2rem;
  min-width: 0;
}

.dialog__copy h2,
.dialog__copy p {
  margin: 0;
}

.dialog__copy h2 {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.18);
  border-radius: 0.9rem;
  box-sizing: border-box;
  color: var(--text-primary);
  display: block;
  font-size: 1.18rem;
  line-height: 1.2;
  overflow-wrap: anywhere;
  padding: 0.75rem 0.85rem;
  width: 100%;
}

.dialog__copy p {
  color: var(--text-muted);
  line-height: 1.55;
  padding: 0 0.65rem;
}

.dialog__body {
  display: grid;
  gap: 0.75rem;
}

.dialog__footer {
  display: grid;
  gap: 0.65rem;
}

.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 180ms ease;
}

.dialog-fade-enter-active .dialog__panel,
.dialog-fade-leave-active .dialog__panel {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .dialog__panel,
.dialog-fade-leave-to .dialog__panel {
  opacity: 0;
  transform: translateY(1.2rem);
}

@media (min-width: 720px) {
  .dialog {
    align-items: center;
    padding: 2rem;
  }

  .dialog__panel {
    border-radius: 1.6rem;
    padding: 1.05rem;
  }
}
</style>
