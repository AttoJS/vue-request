import { onUnmounted } from 'vue-demi';

import { definePlugin } from '../definePlugin';
import limitTrigger from '../utils/limitTrigger';
import subscriber from '../utils/listener';

export default definePlugin(
  (queryInstance, { refreshOnWindowFocus = false, refocusTimespan = 5000 }) => {
    const limitRefresh = limitTrigger(
      queryInstance.context.refresh,
      refocusTimespan!,
    );
    const unsubscribeList: (() => void)[] = [];
    const addUnsubscribeList = (event?: () => void) => {
      event && unsubscribeList.push(event);
    };

    if (refreshOnWindowFocus) {
      addUnsubscribeList(subscriber('VISIBLE_LISTENER', limitRefresh));
      addUnsubscribeList(subscriber('FOCUS_LISTENER', limitRefresh));
    }

    onUnmounted(() => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
    });

    return {};
  },
);
