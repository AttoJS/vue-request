import { ref, watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';

export default definePlugin((queryInstance, { refreshDeps = [], manual }) => {
  // watch refreshDeps
  if (refreshDeps?.length) {
    watch(refreshDeps, () => {
      !manual && queryInstance.refresh();
    });
  }
  return {};
});
