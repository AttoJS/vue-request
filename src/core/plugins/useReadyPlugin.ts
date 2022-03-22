import { ref, watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';

export default definePlugin(
  (queryInstance, { ready = ref(true), manual, defaultParams = [] }) => {
    // watch ready
    watch(
      ready,
      val => {
        if (!manual && val) {
          queryInstance.context.run(...defaultParams);
        }
      },
      {
        flush: 'sync',
      },
    );
    return {
      onBefore() {
        if (!ready.value) {
          queryInstance.loading.value = false;
          return {
            isBreak: true,
          };
        }
      },
    };
  },
);
