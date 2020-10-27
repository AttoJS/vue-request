import { flushPromises } from '@vue/test-utils';

export const waitForTime = async (millisecond: number) => {
  jest.advanceTimersByTime(millisecond);
  await flushPromises();
};

export const waitForAll = async () => {
  jest.runAllTimers();
  await flushPromises();
};
