import {
  isOnline,
  isDocumentVisibilty,
  isFunction,
  isNil,
  isPlainObject,
  isPromise,
  isString,
} from '../core/utils';
import limitTrigger from '../core/utils/limitTrigger';
import subscriber from '../core/utils/listener';
import { waitForTime } from './utils';
declare let jsdom: any;

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
    expect(isPromise(function () {})).toBe(false);
  });

  test('isPromise should work', () => {
    expect(isFunction(function () {})).toBe(true);
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

  test('visibility listener should work', () => {
    const mockFn = jest.fn();
    subscriber('VISIBLE_LISTENER', mockFn);
    jsdom.window.dispatchEvent(new Event('visibilitychange'));
    expect(mockFn).toBeCalledTimes(1);
  });

  test('focus listener should work', () => {
    const mockFn = jest.fn();
    subscriber('FOCUS_LISTENER', mockFn);
    jsdom.window.dispatchEvent(new Event('focus'));
    expect(mockFn).toBeCalledTimes(1);
  });

  test('reconnect listener should work', () => {
    const mockFn = jest.fn();
    subscriber('RECONNECT_LISTENER', mockFn);
    jsdom.window.dispatchEvent(new Event('online'));
    expect(mockFn).toBeCalledTimes(1);
  });

  test('isDocumentVisibilty should work', () => {
    expect(isDocumentVisibilty()).toBeTruthy();
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    expect(isDocumentVisibilty()).toBeFalsy();
  });

  test('isOnline should work', () => {
    expect(isOnline()).toBeTruthy();
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });
    expect(isOnline()).toBeFalsy();
  });
});
