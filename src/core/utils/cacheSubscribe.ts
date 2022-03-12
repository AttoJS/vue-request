type Listener = (data: any) => void;
const listeners = new Map<string, Listener[]>();

export const trigger = (key: string, data: any) => {
  if (listeners.has(key)) {
    listeners.get(key)!.forEach(item => item(data));
  }
};

export const subscribe = (key: string, listener: Listener) => {
  if (!listeners.has(key)) {
    listeners.set(key, [listener]);
  } else {
    listeners.get(key)!.push(listener);
  }

  return () => {
    const index = listeners.get(key)!.indexOf(listener);
    listeners.get(key)!.splice(index, 1);
  };
};
