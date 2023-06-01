import { watch } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import { isArray } from '../utils';

export default definePlugin(
  (queryInstance, { refreshDeps, refreshDepsAction, manual }) => {
    if (
      refreshDeps === undefined ||
      (isArray(refreshDeps) && refreshDeps.length === 0)
    )
      return {};
    const deps = isArray(refreshDeps) ? refreshDeps : [refreshDeps];

    // watch refreshDeps
    watch(deps, () => {
      if (refreshDepsAction) {
        refreshDepsAction();
      } else {
        !manual && queryInstance.context.refresh();
      }
    });
    return {};
  },
);
