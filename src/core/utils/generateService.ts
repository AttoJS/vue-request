import { IService } from './types';
import {
  isFunction,
  isPlainObject,
  isPromise,
  isString,
  requestProxy,
} from './index';

export default <R, P extends unknown[]>(service: IService<R, P>) => {
  let promiseQuery: (() => Promise<R>) | ((...args: P) => Promise<R>);

  if (isFunction(service)) {
    promiseQuery = (...args: P) => {
      const _service = service(...args);
      let finallyService: Promise<R>;
      // 是否为普通异步请求
      if (!isPromise(_service)) {
        if (isPlainObject(_service)) {
          const { url, ...rest } = _service;
          finallyService = requestProxy(url, rest);
        } else if (isString(_service)) {
          finallyService = requestProxy(_service);
        } else {
          throw new Error('Unknown service type');
        }
      } else {
        finallyService = _service;
      }

      return new Promise<R>((resolve, reject) => {
        finallyService.then(resolve).catch(reject);
      });
    };
  } else if (isPlainObject(service)) {
    const { url, ...rest } = service;
    promiseQuery = () => requestProxy(url, rest);
  } else if (isString(service)) {
    promiseQuery = () => requestProxy(service);
  } else {
    throw Error('Unknown service type');
  }
  return promiseQuery;
};
