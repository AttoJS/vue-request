import { onUnmounted, ref } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isDocumentVisibility, isNil, isOnline } from '../utils';
import subscriber from '../utils/listener';
import type { Timeout } from '../utils/types';

export default definePlugin(
  (
    queryInstance,
    {
      pollingInterval,
      pollingWhenHidden = false,
      pollingWhenOffline = false,
      errorRetryCount = 0,
    },
  ) => {
    const pollingTimer = ref();
    const stopPollingWhenHiddenOrOffline = ref(false);
    const unsubscribeList: (() => void)[] = [];
    const addUnsubscribeList = (event?: () => void) => {
      event && unsubscribeList.push(event);
    };

    const polling = (pollingFunc: () => void) => {
      // if errorRetry is enabled, then skip this method
      if (queryInstance.error.value && errorRetryCount !== 0) return;

      let timerId: Timeout | undefined;
      if (!isNil(pollingInterval) && pollingInterval! >= 0) {
        if (
          (pollingWhenHidden || isDocumentVisibility()) &&
          (pollingWhenOffline || isOnline())
        ) {
          timerId = setTimeout(pollingFunc, pollingInterval);
        } else {
          // stop polling
          stopPollingWhenHiddenOrOffline.value = true;
          return;
        }
      }

      return () => timerId && clearTimeout(timerId);
    };
    const rePolling = () => {
      if (
        stopPollingWhenHiddenOrOffline.value &&
        (pollingWhenHidden || isDocumentVisibility()) &&
        (pollingWhenOffline || isOnline())
      ) {
        queryInstance.refresh();
        stopPollingWhenHiddenOrOffline.value = false;
      }
    };

    // subscribe polling
    if (!pollingWhenHidden) {
      addUnsubscribeList(subscriber('VISIBLE_LISTENER', rePolling));
    }

    // subscribe online when pollingWhenOffline is false
    if (!pollingWhenOffline) {
      addUnsubscribeList(subscriber('RECONNECT_LISTENER', rePolling));
    }
    onUnmounted(() => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
    });
    return {
      onBefore() {
        pollingTimer.value?.();
      },
      onCancel() {
        pollingTimer.value?.();
      },
      onAfter() {
        pollingTimer.value = polling(() => queryInstance.refresh());
      },
    };
  },
);
