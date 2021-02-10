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

function usePagination<R, P extends unknown[] = any>(
  service: IService<R, P>,
): BaseResult<R, P>;
function usePagination<R, P extends unknown[] = any, FR = any>(
  service: IService<R, P>,
  options: FormatOptions<R, P, FR>,
): BaseResult<FR, P>;
function usePagination<R, P extends unknown[] = any>(
  service: IService<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P>;
function usePagination<R, P extends unknown[], FR>(
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

  const { data, params, run, ...rest } = useAsyncQuery<R, P, FR>(promiseQuery, {
    defaultParams: [
      {
        current: 1,
        pageSize: 10,
      },
    ],
    ...((options ?? {}) as any),
  });

  // onChange	a callback function, executed when changeCurrent or changePageSize is called	(current: number, pageSize: number) => void
  const doPaginate = (paginationParams: any) => {
    const [oldPaginationParams, ...restParams] = params.value;
    const paginationP = {
      // @ts-ignore
      ...oldPaginationParams,
      ...paginationParams,
    } as any;
    // @ts-ignore
    run(paginationP, ...restParams);
  };

  // @ts-ignore
  const total = data?.total || 0;
  const { current = 1, pageSize = 10 } =
    params && params[0] ? params[0] : ({} as any);

  const onChange = (c: number, p: number) => {
    let toCurrent = c <= 0 ? 1 : c;
    const toPageSize = p <= 0 ? 1 : p;

    const tempTotalPage = Math.ceil(total / toPageSize);
    if (toCurrent > tempTotalPage) {
      toCurrent = tempTotalPage;
    }
    doPaginate({
      current: c,
      pageSize: p,
    });
  };

  // changeCurrent	change current page	(current: number) => void
  const changeCurrent = (current: number) => {
    doPaginate({ current });
  };

  // changePageSize	change pageSize	(pageSize: number) => void
  const changePageSize = (pageSize: number) => {
    doPaginate({ pageSize });
  };

  return {
    data,
    params,
    run,
    changeCurrent,
    changePageSize,
    current,
    pageSize,
    ...rest,
  };
}

export default usePagination;
