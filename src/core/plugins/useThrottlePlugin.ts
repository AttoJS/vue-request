import { ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isNil } from '../utils';
import type { debounce } from '../utils/lodash';
import { throttle } from '../utils/lodash';

export default definePlugin(
  (queryInstance, { throttleInterval, throttleOptions }) => {
    const throttledRun = ref<ReturnType<typeof debounce>>();

    if (isNil(throttleInterval)) return {};

    const originRun = queryInstance._run;
    throttledRun.value = throttle(
      callback => callback(),
      throttleInterval!,
      throttleOptions,
    );

    queryInstance.context._run = (...args) =>
      new Promise((resolve, reject) => {
        throttledRun.value?.(() => {
          originRun(...args)
            .then(resolve)
            .catch(reject);
        });
      });

    return {
      onCancel() {
        throttledRun.value?.cancel();
      },
    };
  },
);
