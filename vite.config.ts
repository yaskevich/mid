import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Checker from 'vite-plugin-checker';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Checker({ typescript: true }),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
  ],
  server: {
    port: 2000,
    proxy: {
      '/api': {
        target: 'http://dantiscus.ibi.uw.edu.pl/itinerarium.php',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
