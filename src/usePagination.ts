import { computed } from 'vue';
import { BaseOptions, FormatOptions, MixinOptions } from './core/config';
import { Query } from './core/createQuery';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import get from 'lodash/get';

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

  const {
    pagination: {
      currentKey = 'current',
      pageSizeKey = 'pageSize',
      totalKey = 'total',
    },
    ...restOptions
  } = (options ?? {}) as any;

  const { data, params, run, ...rest } = useAsyncQuery<R, P, FR>(promiseQuery, {
    defaultParams: [
      {
        [currentKey]: 1,
        [pageSizeKey]: 10,
      },
    ],
    ...restOptions,
  });

  const paging = (paginationParams: any) => {
    const [oldPaginationParams, ...restParams] = params.value;
    const paginationP = {
      // @ts-ignore
      ...oldPaginationParams,
      ...paginationParams,
    } as any;
    // @ts-ignore
    run(paginationP, ...restParams);
  };

  const total = computed(() => get(data.value, totalKey, 0));
  // @ts-ignore
  const current = computed(() => params.value?.[0]?.[currentKey] || 1);
  // @ts-ignore
  const pageSize = computed(() => params.value?.[0]?.[pageSizeKey] || 10);

  // changeCurrent	change current page	(current: number) => void
  const changeCurrent = (current: number) => {
    paging({ [currentKey]: current });
  };

  // changePageSize	change pageSize	(pageSize: number) => void
  const changePageSize = (pageSize: number) => {
    paging({ [pageSizeKey]: pageSize });
  };

  return {
    data,
    params,
    run,
    changeCurrent,
    changePageSize,
    current,
    pageSize,
    total,
    ...rest,
  };
}

export default usePagination;
