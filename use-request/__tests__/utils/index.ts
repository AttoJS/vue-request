import { nextTick } from 'vue';

export const waitFor = async (millisecond: number) => {
  jest.advanceTimersByTime(millisecond);
  await nextTick();
};

export const waitForAll = async () => {
  jest.runAllTimers();
  await nextTick();
};
