<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
    type?: 'button' | 'submit' | 'reset';
  }>(),
  {
    disabled: false,
    kind: 'primary',
    type: 'button',
  }
);
</script>

<template>
  <button
    :class="['base-button', `base-button--${props.kind}`]"
    :disabled="props.disabled"
    :type="props.type"
  >
    <slot></slot>
  </button>
</template>

<style scoped>
.base-button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  min-height: 2.85rem;
  padding: 0 1.15rem;
  transition:
    transform 140ms ease,
    background-color 140ms ease,
    box-shadow 140ms ease,
    opacity 140ms ease;
}

.base-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.base-button--primary {
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  box-shadow: 0 14px 34px rgba(79, 70, 229, 0.28);
  color: #eef2ff;
}

.base-button--secondary {
  background: rgba(52, 211, 153, 0.14);
  color: #d1fae5;
}

.base-button--ghost {
  background: transparent;
  border: 1px solid var(--border-soft);
  color: var(--text-muted);
}

.base-button--danger {
  background: rgba(239, 68, 68, 0.18);
  color: #ffd7d7;
}
</style>
