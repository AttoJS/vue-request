import { unref } from 'vue';
import { RefObject, UnRef } from './types';

export const objectToString = Object.prototype.toString;
export const toTypeString = (val: unknown): string => objectToString.call(val);

export const isString = (val: unknown): val is string => toTypeString(val) === '[object String]';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  toTypeString(val) === '[object Object]';

export const isPromise = (fn: unknown): fn is Promise<unknown> => fn instanceof Promise;

export const isFunction = (fn: unknown): fn is Function => fn instanceof Function;

export const isNil = (val: unknown) => val === null || val === undefined;

export const isDocumentVisibilty = () => window?.document?.visibilityState === 'visible';

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
