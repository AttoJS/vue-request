import { computed, ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { refToRaw } from '../utils';
import type { Timeout } from '../utils/types';

function setTimeoutPromise(duration: number) {
  let timerId: Timeout, stop: () => void;
  class Timer extends Promise<any> {
    cancel = () => {
      stop();
      clearTimeout(timerId);
    };

    constructor(fn: (value?: any) => void) {
      super(fn);
    }
  }

  return new Timer(resolve => {
    stop = resolve;
    timerId = setTimeout(stop, duration);
  });
}

function getCurrentTime() {
  return new Date().getTime();
}

export default definePlugin(
  (queryInstance, { loadingDelay = 0, loadingKeep = 0 }) => {
    const delayLoadingTimer = ref(() => {});
    const loadingDelayRef = computed(() => refToRaw(loadingDelay));
    const loadingKeepRef = computed(() => refToRaw(loadingKeep));
    let startTime = 0;
    let timeoutPromise: Partial<ReturnType<typeof setTimeoutPromise>> = {};
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
        startTime = getCurrentTime();
      },
      onQuery(service) {
        if (!loadingKeepRef.value) return () => service();

        timeoutPromise = setTimeoutPromise(
          loadingKeepRef.value + loadingDelayRef.value,
        );

        const _service = async () => {
          try {
            const res = await service();
            if (getCurrentTime() - startTime <= loadingDelayRef.value) {
              timeoutPromise.cancel!();
            }
            return Promise.resolve(res);
          } catch (error) {
            if (getCurrentTime() - startTime <= loadingDelayRef.value) {
              timeoutPromise.cancel!();
            }
            return Promise.reject(error);
          }
        };

        const servicePromise = Promise.allSettled([
          _service(),
          timeoutPromise,
        ]).then(res => {
          const result = res[0];
          if (result.status === 'fulfilled') {
            return result.value;
          } else {
            return Promise.reject(result.reason);
          }
        });
        return () => servicePromise;
      },
      onCancel() {
        delayLoadingTimer.value();
      },
      onAfter() {
        delayLoadingTimer.value();
      },
    };
  },
);
