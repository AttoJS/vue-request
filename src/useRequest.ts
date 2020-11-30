import { BaseOptions, FormatOptions, MixinOptions } from './core/config';
import { Query } from './core/createQuery';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import {
  isFunction,
  isPlainObject,
  isPromise,
  isString,
  requestProxy,
} from './core/utils';

export type ServiceObject = {
  [key: string]: any;
  url: string;
};
export type ServiceParams = string | ServiceObject;
export type IService<R, P extends unknown[]> =
  | ((...args: P) => ServiceParams)
  | ServiceParams
  | Query<R, P>;

function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
): BaseResult<R, P>;
function useRequest<R, P extends unknown[] = any, FR = any>(
  service: IService<R, P>,
  options: FormatOptions<R, P, FR>,
): BaseResult<FR, P>;
function useRequest<R, P extends unknown[] = any>(
  service: IService<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P>;
function useRequest<R, P extends unknown[], FR>(
  service: IService<R, P>,
  options?: MixinOptions<R, P, FR>,
) {
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

  return useAsyncQuery<R, P, FR>(promiseQuery, (options ?? {}) as any);
}

export default useRequest;
