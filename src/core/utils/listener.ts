type EventFunc = () => void;
type ListenersSet = Set<EventFunc>;
type ListenerType = 'FOCUS_LISTENER' | 'VISIBLE_LISTENER' | 'RECONNECT_LISTENER';
const FOCUS_LISTENER: ListenersSet = new Set();
const VISIBLE_LISTENER: ListenersSet = new Set();
const RECONNECT_LISTENER: ListenersSet = new Set();

const subscriber = (listenerType: ListenerType, event: EventFunc) => {
  let listeners;
  switch (listenerType) {
    case 'FOCUS_LISTENER':
      listeners = FOCUS_LISTENER;
      break;

    case 'RECONNECT_LISTENER':
      listeners = RECONNECT_LISTENER;
      break;

    default:
    case 'VISIBLE_LISTENER':
      listeners = VISIBLE_LISTENER;
      break;
  }

  if (listeners.has(event)) return;
  listeners.add(event);
};

const observer = (listeners: ListenersSet) => {
  listeners.forEach(event => {
    event();
  });
};

if (window?.addEventListener) {
  window.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') {
        observer(VISIBLE_LISTENER);
      }
    },
    false,
  );
  window.addEventListener('focus', () => observer(FOCUS_LISTENER), false);
  window.addEventListener('online', () => observer(RECONNECT_LISTENER), false);
}

export default subscriber;
