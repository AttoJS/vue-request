import { computed, ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { refToRaw } from '../utils';
import type { Timeout } from '../utils/types';

export default definePlugin((queryInstance, { loadingDelay = 0 }) => {
  const delayLoadingTimer = ref(() => {});
  const loadingDelayRef = computed(() => refToRaw(loadingDelay));

  const delayLoading = () => {
    let timerId: Timeout | undefined;

    if (loadingDelayRef.value) {
      timerId = setTimeout(() => {
        if (queryInstance.status.value === 'pending') {
          queryInstance.loading.value = true;
        }
      }, loadingDelayRef.value);
    }

    return () => timerId && clearTimeout(timerId);
  };
  return {
    onBefore() {
      queryInstance.loading.value = !loadingDelayRef.value;
      delayLoadingTimer.value();
      delayLoadingTimer.value = delayLoading();
    },
    onCancel() {
      delayLoadingTimer.value();
    },
    onAfter() {
      delayLoadingTimer.value();
    },
  };
});
