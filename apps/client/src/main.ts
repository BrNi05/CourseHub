import { createApp } from 'vue';

import '@fontsource-variable/open-sans/wght.css';
import 'uno.css';
import './assets/global.css';

import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
