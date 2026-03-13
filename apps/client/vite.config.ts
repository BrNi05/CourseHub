import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from 'unocss/vite';
import path from 'node:path';

//! The URL of the site where CourseHub is hosted
//! Also change in seo.ts if changed here
const SITE_URL = 'https://coursehub.hu';

export default defineConfig(() => {
  return {
    plugins: [
      vue(),
      UnoCSS(),
      {
        name: 'inject-site-url',
        transformIndexHtml(html) {
          return html.replaceAll('%SITE_URL%', SITE_URL);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
    },
  };
});
