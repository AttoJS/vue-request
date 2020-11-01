import { isFunction, isNil, isPlainObject, isPromise, isString } from '../utils';
import limitTrigger from '../utils/limitTrigger';
import { waitForTime } from './utils';

describe('utils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  test('isString should work', () => {
    expect(isString('hello')).toBe(true);
    expect(isString(1)).toBe(false);
  });

  test('isPlainObject should work', () => {
    class Test {}
    const testObj = new Test();

    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject(testObj)).toBe(true);
    expect(isPlainObject([])).toBe(false);
  });

  test('isPromise should work', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise(function() {})).toBe(false);
  });

  test('isPromise should work', () => {
    expect(isFunction(function() {})).toBe(true);
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction('')).toBe(false);
  });

  test('isNil should work', () => {
    expect(isNil(undefined)).toBe(true);
    expect(isNil(null)).toBe(true);
    expect(isNil(void 0)).toBe(true);
    expect(isNil('')).toBe(false);
    expect(isNil(false)).toBe(false);
    expect(isNil(0)).toBe(false);
  });

  test('limitTrigger should work', async () => {
    const mockFn = jest.fn();
    const limitedFn = limitTrigger(mockFn, 1000);

    limitedFn();
    await waitForTime(500);
    limitedFn();
    expect(mockFn).toBeCalledTimes(1);
    await waitForTime(500);

    limitedFn();
    expect(mockFn).toBeCalledTimes(2);
  });
});
