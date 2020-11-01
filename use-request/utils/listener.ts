type EventFunc = () => void;
type ListenersSet = Set<EventFunc>;
type ListenerType = 'FOCUS_LISTENER' | 'VISIBLE_LISTENER';
const FOCUS_LISTENER: ListenersSet = new Set();

const subscriber = (listenerType: ListenerType, event: EventFunc) => {
  let listeners;
  switch (listenerType) {
    case 'FOCUS_LISTENER':
    case 'VISIBLE_LISTENER':
    default:
      listeners = FOCUS_LISTENER;
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

if (window && window.addEventListener) {
  window.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') {
        observer(FOCUS_LISTENER);
      }
    },
    false,
  );
  window.addEventListener('focus', () => observer(FOCUS_LISTENER), false);
}

export default subscriber;
