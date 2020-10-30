import { isFunction, isPlainObject, isPromise, isString } from '../utils';

describe('utils', () => {
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
});
