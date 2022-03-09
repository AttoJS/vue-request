import { unref } from 'vue-demi';

import type { RefObject, UnRef } from './types';

export const objectToString = Object.prototype.toString;
export const toTypeString = (val: unknown): string => objectToString.call(val);

export const isString = (val: unknown): val is string =>
  toTypeString(val) === '[object String]';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  toTypeString(val) === '[object Object]';
export const isArray = (val: unknown): val is any[] => Array.isArray(val);

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

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

export const get = (
  source: Record<string, any>,
  path: string,
  defaultValue: any = undefined,
) => {
  // a[3].b -> a.3.b
  const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result = source;
  for (const p of paths) {
    result = Object(result)[p];
    if (result === undefined) {
      return defaultValue;
    }
  }
  return result;
};

export function omit<T, K extends keyof T>(
  object: T,
  keys: Array<K>,
): Pick<T, Exclude<keyof T, K>> {
  const result = Object.assign({}, object);
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export const warning = (message: string, throwError = false) => {
  const msg = `Warning: [vue-request] ${message}`;
  if (throwError) {
    return new Error(msg);
  } else {
    console.error(msg);
  }
};
