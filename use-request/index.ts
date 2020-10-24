import { toRefs, watchEffect } from 'vue';
import { Config } from './config';
import useAsyncQuery from './useAsyncQuery';

function requestProxy(...args: any[]) {
  // @ts-ignore
  return fetch(...args).then(res => {
    if (res.ok) {
      return res.json();
    }
    throw new Error(res.statusText);
  });
}

function useRequest<P extends unknown[], R>(service: any, options: Config<P>) {
  const requestMethod = requestProxy;

  let promiseService: () => Promise<any>;
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
      promiseService = (...args: any[]) =>
        new Promise((resolve, reject) => {
          let _service = service(...args);
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
  watchEffect(() => {
    console.log(data);
  });
  return toRefs(data);
}

export default useRequest;
