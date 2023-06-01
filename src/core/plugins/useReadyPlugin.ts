import { ref, watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isFunction } from '../utils';

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
        const readyFlag = isFunction(ready) ? ready() : ready.value;
        if (!readyFlag) {
          queryInstance.loading.value = false;
          return {
            isBreak: true,
          };
        }
      },
    };
  },
);
