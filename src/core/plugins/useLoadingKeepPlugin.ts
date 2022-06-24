import { computed } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { refToRaw } from '../utils';

const setTimeoutPromise = (time: number) =>
  new Promise(resolve => setTimeout(resolve, time));

export default definePlugin((_, { loadingKeep = 0 }) => {
  const loadingKeepRef = computed(() => refToRaw(loadingKeep));

  return {
    onQuery(service) {
      if (!loadingKeepRef.value) return () => service();
      const servicePromise = Promise.allSettled([
        service(),
        setTimeoutPromise(loadingKeepRef.value),
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
  };
});
