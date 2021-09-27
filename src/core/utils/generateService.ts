import {
  isFunction,
  isPlainObject,
  isPromise,
  isString,
  requestProxy,
} from './index';
import type { IService } from './types';

const generateService = <R, P extends unknown[]>(
  service: IService<R, P> | Promise<R>,
): (() => Promise<R>) | ((...args: P) => Promise<R>) => {
  return (...args: P) => {
    if (isFunction(service)) {
      return generateService(service(...args))();
    } else if (isPromise(service)) {
      return service;
    } else if (isPlainObject(service)) {
      const { url, ...rest } = service;
      return requestProxy(url, rest);
    } else if (isString(service)) {
      return requestProxy(service);
    } else {
      throw Error('Unknown service type');
    }
  };
};

export default generateService;
