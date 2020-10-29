import { toRefs } from 'vue';
import { BaseOptions } from './config';
import { Query } from './createQuery';
import useAsyncQuery from './useAsyncQuery';
import { isFunction, isPlainObject, isPromise, isString } from './utils';

export type ServiceParams = string | Record<string, any>;
export type IService<R, P extends unknown[]> =
  | ServiceParams
  | ((...args: P) => ServiceParams)
  | Query<R, P>;

function requestProxy(...args: unknown[]) {
  // @ts-ignore
  return fetch(...args).then(res => {
    if (res.ok) {
      return res.json();
    }
    throw new Error(res.statusText);
  });
}

function useRequest<R, P extends unknown[]>(
  service: IService<R, P>,
  options: BaseOptions<R, P> = {},
) {
  const requestMethod = requestProxy;

  let promiseQuery: (() => Promise<R>) | ((...args: P) => Promise<R>);

  if (isString(service)) {
    promiseQuery = () => requestMethod(service);
  } else if (isFunction(service)) {
    promiseQuery = (...args: P) =>
      new Promise<R>((resolve, reject) => {
        let _service = service(...args);
        // 是否为普通异步请求
        if (!isPromise(_service)) {
          if (isPlainObject(_service)) {
            const { url, ...rest } = _service;
            _service = requestMethod(url, rest);
          } else if (isString(_service)) {
            _service = requestMethod(_service);
          }
        }
        _service.then(resolve).catch(reject);
      });
  } else if (isPlainObject(service)) {
    const { url, ...rest } = service;
    promiseQuery = () => requestMethod(url, rest);
  } else {
    throw Error('未知service类型');
  }

  return toRefs(useAsyncQuery<R, P>(promiseQuery, options));
}

export default useRequest;
