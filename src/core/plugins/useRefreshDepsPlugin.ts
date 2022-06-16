import { watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';

export default definePlugin(
  (queryInstance, { refreshDeps = [], refreshDepsAction, manual }) => {
    // watch refreshDeps
    if (refreshDeps?.length) {
      watch(refreshDeps, () => {
        if (refreshDepsAction) {
          refreshDepsAction();
        } else {
          !manual && queryInstance.context.refresh();
        }
      });
    }
    return {};
  },
);
