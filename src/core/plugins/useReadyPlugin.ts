import { ref, watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';

export default definePlugin((queryInstance, { ready = ref(true), manual }) => {
  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);

  // watch ready
  const stopReady = ref();
  stopReady.value = watch(
    ready,
    val => {
      hasTriggerReady.value = true;
      if (val && tempReadyParams.value) {
        queryInstance._run(...tempReadyParams.value);
        // destroy current watch
        stopReady.value();
      }
    },
    {
      flush: 'sync',
    },
  );
  return {
    onBefore(params) {
      if (!ready.value && !hasTriggerReady.value) {
        queryInstance.loading.value = false;
        tempReadyParams.value = params;
        return {
          isBreak: true,
        };
      }
    },
  };
});
