import { computed, Ref } from 'vue';
import { BaseOptions, FormatOptions } from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import get from 'lodash/get';
import generateService from './core/utils/generateService';
import { IService } from './core/utils/types';

export interface PaginationResult<R, P extends unknown[]>
  extends BaseResult<R, P> {
  current: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  totalPage: Ref<number>;
  changeCurrent: (current: number) => void;
  changePageSize: (pageSize: number) => void;
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
  extends FormatOptions<R, P, FR>,
    PaginationExtendsOption {}

export interface PaginationBaseOptions<R, P extends unknown[]>
  extends BaseOptions<R, P>,
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
): any {
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
    ...restOptions
  } = Object.assign(defaultOptions, options ?? ({} as any));

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
    const [oldPaginationParams, ...restParams] = params.value as P[];
    const paginationP = {
      ...oldPaginationParams,
      ...paginationParams,
    };
    // @ts-ignore
    run(paginationP, ...restParams);
  };

  const total = computed(() => get(data.value, totalKey, 0));
  // @ts-ignore
  const current = computed(() => params.value?.[0]?.[currentKey] || 1);
  // @ts-ignore
  const pageSize = computed(() => params.value?.[0]?.[pageSizeKey] || 10);
  // @ts-ignore
  const totalPage = computed(() =>
    get(data.value, totalPageKey, Math.ceil(total.value / pageSize.value)),
  );

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
    totalPage,
    ...rest,
  };
}

export default usePagination;
