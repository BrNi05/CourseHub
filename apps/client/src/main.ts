import { createApp } from 'vue';

import '@fontsource-variable/open-sans/wght.css';
import 'uno.css';
import './assets/global.css';

import App from './App.vue';
import router from './router';

// Migration: new cookie-based auth system. Clear up XSS-vulnerable localStorage session data if it exists.
globalThis.localStorage.removeItem('coursehub.web.session');

createApp(App).use(router).mount('#app');
