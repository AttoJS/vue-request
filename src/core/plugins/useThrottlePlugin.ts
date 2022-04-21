import { computed, ref, watchEffect } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isNil, refToRaw } from '../utils';
import type { debounce } from '../utils/lodash';
import { throttle } from '../utils/lodash';

export default definePlugin(
  (queryInstance, { throttleInterval, throttleOptions }) => {
    const throttledRun = ref<ReturnType<typeof debounce>>();
    const throttleIntervalRef = computed(() => refToRaw(throttleInterval));
    const throttleOptionsRef = computed(() => throttleOptions);
    const originRunRef = ref(queryInstance.context.runAsync);

    watchEffect(onInvalidate => {
      if (isNil(throttleInterval)) return {};

      throttledRun.value = throttle(
        callback => callback(),
        throttleIntervalRef.value!,
        throttleOptionsRef.value,
      );

      queryInstance.context.runAsync = (...args) =>
        new Promise((resolve, reject) => {
          throttledRun.value!(() => {
            originRunRef
              .value(...args)
              .then(resolve)
              .catch(reject);
          });
        });

      onInvalidate(() => {
        throttledRun.value?.cancel();
        queryInstance.context.runAsync = originRunRef.value;
      });
    });

    return {
      onCancel() {
        throttledRun.value?.cancel();
      },
    };
  },
);
