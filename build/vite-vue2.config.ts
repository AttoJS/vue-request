import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      'vue-request': path.resolve(__dirname, '../src/index.ts'),
      vue: 'vue2',
    },
  },
  plugins: [createVuePlugin()],
});
