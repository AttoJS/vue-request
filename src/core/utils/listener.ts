import { isDocumentVisibility, isServer } from './index';

type EventFunc = () => void;
type ListenersSet = Set<EventFunc>;
type ListenerType =
  | 'FOCUS_LISTENER'
  | 'VISIBLE_LISTENER'
  | 'RECONNECT_LISTENER';
export const FOCUS_LISTENER: ListenersSet = new Set();
export const VISIBLE_LISTENER: ListenersSet = new Set();
export const RECONNECT_LISTENER: ListenersSet = new Set();

const subscriber = (listenerType: ListenerType, event: EventFunc) => {
  let listeners: ListenersSet;
  switch (listenerType) {
    case 'FOCUS_LISTENER':
      listeners = FOCUS_LISTENER;
      break;

    case 'RECONNECT_LISTENER':
      listeners = RECONNECT_LISTENER;
      break;

    case 'VISIBLE_LISTENER':
      listeners = VISIBLE_LISTENER;
      break;
  }

  if (listeners.has(event)) return;
  listeners.add(event);
  return () => {
    listeners.delete(event);
  };
};

const observer = (listeners: ListenersSet) => {
  listeners.forEach(event => {
    event();
  });
};

/* istanbul ignore else */
if (!isServer && window?.addEventListener) {
  window.addEventListener(
    'visibilitychange',
    () => {
      /* istanbul ignore else */
      if (isDocumentVisibility()) {
        observer(VISIBLE_LISTENER);
      }
    },
    false,
  );
  window.addEventListener('focus', () => observer(FOCUS_LISTENER), false);
  window.addEventListener('online', () => observer(RECONNECT_LISTENER), false);
}

export default subscriber;
