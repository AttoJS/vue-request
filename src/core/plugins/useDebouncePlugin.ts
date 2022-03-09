import { ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isNil } from '../utils';
import { debounce } from '../utils/lodash';

export default definePlugin(
  (queryInstance, { debounceInterval, debounceOptions, manual }) => {
    const initialAutoRunFlag = ref(false);
    const debouncedRun = ref<ReturnType<typeof debounce>>();

    if (isNil(debounceInterval)) return {};

    if (!manual) {
      initialAutoRunFlag.value = true;
    }

    const originRun = queryInstance._run;

    debouncedRun.value = debounce(
      callback => callback(),
      debounceInterval!,
      debounceOptions,
    );

    queryInstance.context._run = (...args) =>
      new Promise((resolve, reject) => {
        if (initialAutoRunFlag.value) {
          initialAutoRunFlag.value = false;
          originRun(...args)
            .then(resolve)
            .catch(reject);
        } else {
          debouncedRun.value?.(() => {
            originRun(...args)
              .then(resolve)
              .catch(reject);
          });
        }
      });

    return {
      onCancel() {
        debouncedRun.value?.cancel();
      },
    };
  },
);
