import { createApp } from 'vue-demi';
const scheduler =
  typeof setImmediate === 'function' ? setImmediate : setTimeout;

export function flushPromises() {
  return new Promise(function (resolve) {
    scheduler(resolve);
  });
}

export const waitForTime = async (millisecond: number) => {
  jest.advanceTimersByTime(millisecond);
  await flushPromises();
};

export const waitForAll = async () => {
  jest.runAllTimers();
  await flushPromises();
};

type InstanceType<V> = V extends { new (...arg: any[]): infer X } ? X : never;
type VM<V> = InstanceType<V> & { unmount(): void; [key: string]: any };

export function mount<V>(Comp: V) {
  const el = document.createElement('div');
  const app = createApp(Comp as any);

  const unmount = () => app.unmount();
  const comp = app.mount(el) as any as VM<V>;
  comp.unmount = unmount;
  return comp;
}
