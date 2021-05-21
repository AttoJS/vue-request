import { unref } from 'vue';
import { RefObject, UnRef } from './types';

export const objectToString = Object.prototype.toString;
export const toTypeString = (val: unknown): string => objectToString.call(val);

export const isString = (val: unknown): val is string =>
  toTypeString(val) === '[object String]';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  toTypeString(val) === '[object Object]';
export const isPlainArray = (val: unknown): val is Record<string, any> =>
  toTypeString(val) === '[object Array]';

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const isSameType = (a: unknown, b: unknown): boolean =>
  toTypeString(a) === toTypeString(b);

export const isPromise = (fn: unknown): fn is Promise<unknown> =>
  isObject(fn) && isFunction(fn.then) && isFunction(fn.catch);

export const isFunction = (fn: unknown): fn is Function =>
  fn instanceof Function;

export const isNil = (val: unknown) => val === null || val === undefined;

export const isServer = typeof window === 'undefined';

export const isDocumentVisibility = () =>
  !isServer && window?.document?.visibilityState === 'visible';

export const isOnline = () => (!isServer && window?.navigator?.onLine) ?? true;

export const unRefObject = <T extends RefObject>(val: T) => {
  const obj = {};

  Object.keys(val).forEach(key => {
    obj[key] = unref(val[key]);
  });

  return obj as {
    [K in keyof T]: UnRef<T[K]>;
  };
};

export const resolvedPromise = Promise.resolve(null);

export const requestProxy = async (...args: [url: string, ...rest: any[]]) => {
  const res = await fetch(...args);
  if (res.ok) {
    return res.json();
  }
  throw new Error(res.statusText);
};
