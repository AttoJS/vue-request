import { computed, onUnmounted, ref, watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isDocumentVisibility, isNil, isOnline, refToRaw } from '../utils';
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
    const pollingIntervalRef = computed(() => refToRaw(pollingInterval));
    const errorRetryCountRef = computed(() => refToRaw(errorRetryCount));

    const unsubscribeList: (() => void)[] = [];
    const addUnsubscribeList = (event?: () => void) => {
      event && unsubscribeList.push(event);
    };

    const isKeepPolling = () => {
      return (
        // pollingWhenHidden = true or pollingWhenHidden = false and document is visibility
        (pollingWhenHidden || isDocumentVisibility()) &&
        // pollingWhenOffline = true or pollingWhenOffline = false and is online
        (pollingWhenOffline || isOnline())
      );
    };

    const polling = (pollingFunc: () => void) => {
      // if errorRetry is enabled, then skip this method
      if (queryInstance.error.value && errorRetryCountRef.value !== 0) return;

      let timerId: Timeout | undefined;
      if (!isNil(pollingIntervalRef.value) && pollingIntervalRef.value! >= 0) {
        if (isKeepPolling()) {
          timerId = setTimeout(pollingFunc, pollingIntervalRef.value);
        } else {
          // stop polling
          stopPollingWhenHiddenOrOffline.value = true;
          return;
        }
      }

      return () => timerId && clearTimeout(timerId);
    };

    const rePolling = () => {
      if (stopPollingWhenHiddenOrOffline.value && isKeepPolling()) {
        queryInstance.context.refresh();
        stopPollingWhenHiddenOrOffline.value = false;
      }
    };

    watch(pollingIntervalRef, () => {
      if (pollingTimer.value) {
        pollingTimer.value?.();
        pollingTimer.value = polling(() => queryInstance.context.refresh());
      }
    });

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
        pollingTimer.value = polling(() => queryInstance.context.refresh());
      },
    };
  },
);
