import { toRefs } from 'vue';
import { BaseConfig } from './config';
import { Request } from './createQuery';
import useAsyncQuery from './useAsyncQuery';

export type ServiceParams = string | Record<string, any>;
export type IService<R, P extends any[]> =
  | ServiceParams
  | ((...args: P) => ServiceParams)
  | Request<R, P>;

function requestProxy(...args: any[]) {
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
  options: BaseConfig<R, P> = {},
) {
  const requestMethod = requestProxy;

  let promiseService: (() => Promise<R>) | ((...args: P) => Promise<any>);
  switch (typeof service) {
    case 'string': {
      promiseService = () => requestMethod(service);
      break;
    }
    case 'object': {
      const { url, ...rest } = service;
      promiseService = () => requestMethod(url, rest);
      break;
    }
    case 'function':
      promiseService = (...args: P) =>
        new Promise<R>((resolve, reject) => {
          let _service = service(...args);
          // 是否为普通异步请求
          if (!_service.then) {
            switch (_service) {
              case 'string': {
                _service = () => requestMethod(_service);
                break;
              }
              case 'object': {
                const { url, ...rest } = _service;
                _service = () => requestMethod(url, rest);
                break;
              }
            }
          }
          _service.then(resolve).catch(reject);
        });
      break;
    default:
      throw Error('未知service类型');
  }

  return toRefs(useAsyncQuery<R, P>(promiseService, options));
}

export default useRequest;
