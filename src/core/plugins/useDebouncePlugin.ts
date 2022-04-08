import { computed, ref, watchEffect } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isNil, refToRaw } from '../utils';
import { debounce } from '../utils/lodash';

export default definePlugin(
  (queryInstance, { debounceInterval, debounceOptions, manual }) => {
    const initialAutoRunFlag = ref(false);
    const debouncedRun = ref<ReturnType<typeof debounce>>();
    const debounceOptionsRef = computed(() => debounceOptions);
    const debounceIntervalRef = computed(() => refToRaw(debounceInterval));
    const originRunRef = ref(queryInstance.context.runAsync);

    if (!manual) {
      initialAutoRunFlag.value = true;
    }

    watchEffect(onInvalidate => {
      if (isNil(debounceIntervalRef.value)) return;

      debouncedRun.value = debounce(
        callback => callback(),
        debounceIntervalRef.value!,
        debounceOptionsRef.value,
      );

      queryInstance.context.runAsync = (...args) =>
        new Promise((resolve, reject) => {
          if (initialAutoRunFlag.value) {
            initialAutoRunFlag.value = false;
            originRunRef
              .value(...args)
              .then(resolve)
              .catch(reject);
          } else {
            debouncedRun.value?.(() => {
              originRunRef
                .value(...args)
                .then(resolve)
                .catch(reject);
            });
          }
        });

      onInvalidate(() => {
        debouncedRun.value?.cancel();
        queryInstance.context.runAsync = originRunRef.value;
      });
    });

    return {
      onCancel() {
        debouncedRun.value?.cancel();
      },
    };
  },
);
