import { toRefs } from 'vue';
import { Config } from './config';
import { Request } from './createQuery';
import useAsyncQuery from './useAsyncQuery';

export type ServiceParams = string | Record<string, any>;
export type IService<P extends any[], R> =
  | ServiceParams
  | ((...args: P) => ServiceParams)
  | Request<P, R>;

function requestProxy(...args: any[]) {
  // @ts-ignore
  return fetch(...args).then(res => {
    if (res.ok) {
      return res.json();
    }
    throw new Error(res.statusText);
  });
}

function useRequest<R, P extends unknown[]>(service: IService<P, R>, options: Config<P, R> = {}) {
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
  const data = useAsyncQuery<P, R>(promiseService, options);

  return toRefs(data);
}

export default useRequest;
