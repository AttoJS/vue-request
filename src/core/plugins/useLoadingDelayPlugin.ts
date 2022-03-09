import { ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';

export default definePlugin((queryInstance, { loadingDelay = 0 }) => {
  const delayLoadingTimer = ref();

  const delayLoading = () => {
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (loadingDelay) {
      timerId = setTimeout(() => {
        queryInstance.loading.value = true;
      }, loadingDelay);
    }

    return () => timerId && clearTimeout(timerId);
  };
  return {
    onBefore() {
      queryInstance.loading.value = !loadingDelay;
      delayLoadingTimer.value?.();
      delayLoadingTimer.value = delayLoading();
    },
    onCancel() {
      delayLoadingTimer.value?.();
    },
    onAfter() {
      delayLoadingTimer.value?.();
    },
  };
});
