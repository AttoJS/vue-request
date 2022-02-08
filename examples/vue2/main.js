import VCA, { createApp, h } from '@vue/composition-api';
import Vue from 'vue2';

import App from './App.vue';

Vue.use(VCA);

const app = createApp({
  render: () => h(App),
});

app.mount('#app');
