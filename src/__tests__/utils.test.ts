import fetchMock from 'fetch-mock';

import {
  get,
  isDocumentVisibility,
  isFunction,
  isNil,
  isObject,
  isOnline,
  isPlainObject,
  isPromise,
  isString,
  omit,
  requestProxy,
} from '../core/utils';
import limitTrigger from '../core/utils/limitTrigger';
import subscriber, {
  FOCUS_LISTENER,
  RECONNECT_LISTENER,
  VISIBLE_LISTENER,
} from '../core/utils/listener';
import { waitForTime } from './utils';
declare let jsdom: any;

describe('utils', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  beforeEach(() => {
    // make sure *_LISTENER is empty
    FOCUS_LISTENER.clear();
    RECONNECT_LISTENER.clear();
    VISIBLE_LISTENER.clear();
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

  test('isObject should work', () => {
    expect(isObject([])).toBe(true);
    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);
  });

  test('isPromise should work', () => {
    expect(isPromise(Promise.resolve())).toBe(true);
    expect(isPromise(function () {})).toBe(false);
  });

  test('isFunction should work', () => {
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

  test('isDocumentVisibility should work', () => {
    expect(isDocumentVisibility()).toBeTruthy();
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      writable: true,
    });
    expect(isDocumentVisibility()).toBeFalsy();
  });

  test('isOnline should work', () => {
    expect(isOnline()).toBeTruthy();
    Object.defineProperty(window.navigator, 'onLine', {
      value: false,
      writable: true,
    });
    expect(isOnline()).toBeFalsy();
  });

  test('unsubscribe listener should work', () => {
    const mockFn1 = () => 0;
    const mockFn2 = () => 0;
    const mockFn3 = () => 0;
    const eventList: (() => void)[] = [];
    const unmountedEvent = (event?: () => void) => {
      if (event) {
        eventList.push(event);
      }
    };
    for (let index = 0; index < 100; index++) {
      unmountedEvent(subscriber('FOCUS_LISTENER', mockFn1));
      unmountedEvent(subscriber('FOCUS_LISTENER', mockFn2));
      unmountedEvent(subscriber('FOCUS_LISTENER', mockFn3));
    }
    expect(FOCUS_LISTENER.size).toBe(3);
    expect(eventList.length).toBe(3);
    eventList.forEach(unsubscribe => {
      unsubscribe();
    });
    expect(FOCUS_LISTENER.size).toBe(0);
  });

  test('requestProxy should work', async () => {
    const successApi = 'http://example.com/200';
    const failApi = 'http://example.com/404';
    // mock fetch
    fetchMock.get(successApi, { data: 'success' });
    fetchMock.get(failApi, 404);

    const successRes = await requestProxy(successApi);
    expect(successRes).toEqual({ data: 'success' });
    try {
      await requestProxy(failApi);
    } catch (error) {
      expect(error.message).toBe('Not Found');
    }
  });

  test('get should work', () => {
    const object = { a: [{ b: { c: 3 } }] };

    expect(get(object, 'a[0].b.c')).toBe(3);
    // => 3

    expect(get(object, 'a.b.c', 'default')).toBe('default');
  });

  test('omit should work', () => {
    const object = { a: 1, b: 2, c: 3 };
    expect(omit(object, ['a', 'b'])).toStrictEqual({ c: 3 });
  });
});
