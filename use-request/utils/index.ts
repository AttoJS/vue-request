export const objectToString = Object.prototype.toString;
export const toTypeString = (val: unknown): string => objectToString.call(val);

export const isString = (val: unknown): val is string => toTypeString(val) === '[object String]';
export const isPlainObject = (val: unknown): val is Record<string, any> =>
  toTypeString(val) === '[object Object]';

export const isPromise = (fn: unknown): fn is Promise<unknown> => fn instanceof Promise;

export const isFunction = (fn: unknown): fn is Function => fn instanceof Function;
