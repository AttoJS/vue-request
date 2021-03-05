import { computed, Ref } from 'vue';
import { BaseOptions, FormatOptions } from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import get from 'lodash/get';
import generateService from './core/utils/generateService';
import { IService } from './core/utils/types';

export interface PaginationResult<R, P extends unknown[]>
  extends Omit<BaseResult<R, P>, 'queries' | 'reset'> {
  current: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  totalPage: Ref<number>;
  changeCurrent: (current: number) => void;
  changePageSize: (pageSize: number) => void;
  reload: () => void;
}

export interface PaginationExtendsOption {
  pagination?: {
    currentKey?: string;
    pageSizeKey?: string;
    totalKey?: string;
    totalPageKey?: string;
  };
}

export interface PaginationFormatOptions<R, P extends unknown[], FR>
  extends Omit<FormatOptions<R, P, FR>, 'queryKey'>,
    PaginationExtendsOption {}

export interface PaginationBaseOptions<R, P extends unknown[]>
  extends Omit<BaseOptions<R, P>, 'queryKey'>,
    PaginationExtendsOption {}

export type PaginationMixinOptions<R, P extends unknown[], FR> =
  | PaginationBaseOptions<R, P>
  | PaginationFormatOptions<R, P, FR>;

function usePagination<R, P extends unknown[] = any>(
  service: IService<R, P>,
): PaginationResult<R, P>;
function usePagination<R, P extends unknown[] = any, FR = any>(
  service: IService<R, P>,
  options: PaginationFormatOptions<R, P, FR>,
): PaginationResult<FR, P>;
function usePagination<R, P extends unknown[] = any>(
  service: IService<R, P>,
  options: PaginationBaseOptions<R, P>,
): PaginationResult<R, P>;
function usePagination<R, P extends unknown[], FR>(
  service: IService<R, P>,
  options?: PaginationMixinOptions<R, P, FR>,
) {
  const promiseQuery = generateService<R, P>(service);

  const defaultOptions = {
    pagination: {
      currentKey: 'current',
      pageSizeKey: 'pageSize',
      totalKey: 'total',
      totalPageKey: 'totalPage',
    },
  };

  const {
    pagination: { currentKey, pageSizeKey, totalKey, totalPageKey },
    queryKey,
    ...restOptions
  } = Object.assign(defaultOptions, options ?? ({} as any));

  if (queryKey) {
    throw new Error('usePagination does not support concurrent request');
  }

  const finallyOptions = {
    defaultParams: [
      {
        [currentKey]: 1,
        [pageSizeKey]: 10,
      },
    ],
    ...restOptions,
  };

  const { data, params, queries, run, reset, ...rest } = useAsyncQuery<
    R,
    P,
    FR
  >(promiseQuery, finallyOptions);

  const paging = (paginationParams: Record<string, number>) => {
    const [oldPaginationParams, ...restParams] = params.value as P[];
    const newPaginationParams = {
      ...oldPaginationParams,
      ...paginationParams,
    };
    const mergerParams = [newPaginationParams, ...restParams] as any;
    run(...mergerParams);
  };

  // changeCurrent	change current page	(current: number) => void
  const changeCurrent = (current: number) => {
    paging({ [currentKey]: current });
  };

  // changePageSize	change pageSize	(pageSize: number) => void
  const changePageSize = (pageSize: number) => {
    paging({ [pageSizeKey]: pageSize });
  };

  const reload = () => {
    const { defaultParams, manual } = finallyOptions;
    reset();
    !manual && run(...defaultParams);
  };

  const total = computed<number>(() => get(data.value, totalKey, 0));
  const current = computed({
    get: () => (params.value?.[0] as Record<string, number>)?.[currentKey] ?? 0,
    set: (val: number) => {
      changeCurrent(val);
    },
  });
  const pageSize = computed({
    get: () =>
      (params.value?.[0] as Record<string, number>)?.[pageSizeKey] ?? 10,
    set: (val: number) => {
      changePageSize(val);
    },
  });
  const totalPage = computed<number>(() =>
    get(data.value, totalPageKey, Math.ceil(total.value / pageSize.value)),
  );

  return {
    data,
    params,
    current,
    pageSize,
    total,
    totalPage,
    run,
    changeCurrent,
    changePageSize,
    reload,
    ...rest,
  };
}

export default usePagination;
