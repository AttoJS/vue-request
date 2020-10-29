export const isPromise = (fn: any): fn is Promise<any> => fn instanceof Promise;

export const isFunction = (fn: any): fn is Function => fn instanceof Function;
