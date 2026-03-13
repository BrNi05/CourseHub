<script setup lang="ts">
import { reactive } from 'vue';

import BaseButton from '@/components/BaseButton.vue';
import { useAppStore } from '@/lib/app-store';

const app = useAppStore();

const form = reactive({
  platform: detectPlatform(),
  route: globalThis.location.pathname,
  userAction: '',
  message: '',
});

// Heuristic to detect user platform
function detectPlatform(): 'windows' | 'linux' | 'macos' | 'android' | 'ios' {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('android')) return 'android';
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
  if (userAgent.includes('mac')) return 'macos';
  if (userAgent.includes('win')) return 'windows';
  return 'linux';
}

async function submitReport() {
  const ok = await app.submitErrorReport({
    version: '10.0.0',
    platform: form.platform,
    route: form.route.trim(),
    userAction: form.userAction.trim(),
    trace: 'unknown-spa-by-hand',
    message: form.message.trim(),
  });

  if (ok) {
    form.userAction = '';
    form.message = '';
  }
}
</script>

<template>
  <section class="report-page">
    <div class="report-page__intro">
      <h1>Hiba jelentése</h1>
      <p>Valami nem úgy működik, ahogy kellene? Küldj egy hibajegyet a lenti űrlap kitöltésével.</p>
    </div>

    <form class="report-card" @submit.prevent="submitReport">
      <div class="form-grid">
        <label class="field">
          <span>Platform</span>
          <select v-model="form.platform">
            <option value="windows">Windows</option>
            <option value="linux">Linux</option>
            <option value="macos">macOS</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
        </label>

        <label class="field field--wide">
          <span>Elérési út</span>
          <input v-model="form.route" required type="text" />
        </label>

        <label class="field field--wide">
          <span>Felhasználói művelet</span>
          <textarea v-model="form.userAction" required rows="3"></textarea>
        </label>

        <label class="field field--wide">
          <span>Hibabüzenet</span>
          <textarea v-model="form.message" required rows="3"></textarea>
        </label>
      </div>

      <div class="form-actions">
        <BaseButton :disabled="app.state.submittingErrorReport" type="submit">
          {{ app.state.submittingErrorReport ? 'Küldés...' : 'Küldés' }}
        </BaseButton>
      </div>
    </form>
  </section>
</template>

<style scoped>
.report-page {
  display: grid;
  gap: 1.2rem;
}

.report-page__intro {
  max-width: 48rem;
}

.report-page h1 {
  margin: 0;
}

.report-page p {
  color: var(--text-muted);
  line-height: 1.6;
}

.report-card {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.8rem;
  box-shadow: var(--shadow-large);
  display: grid;
  gap: 1rem;
  padding: 1.2rem;
}

.form-grid {
  display: grid;
  gap: 0.85rem;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field--wide {
  grid-column: 1 / -1;
}

.field span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.field input,
.field select,
.field textarea {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  padding: 0.85rem 0.95rem;
  resize: vertical;
}

.field input,
.field select {
  min-height: 3rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
