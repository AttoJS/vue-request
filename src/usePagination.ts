import type { ComputedRef, WritableComputedRef } from 'vue-demi';
import { computed, inject } from 'vue-demi';

import { getGlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';
import type {
  GlobalOptions,
  Options,
  PluginImplementType,
  QueryResult,
  Service,
} from './core/types';
import { get } from './core/utils';
import { merge } from './core/utils/lodash';
import useRequest from './useRequest';

interface PaginationType {
  currentKey: string;
  pageSizeKey: string;
  totalKey: string;
  totalPageKey: string;
}
export interface PaginationExtendsOption {
  pagination?: Partial<PaginationType>;
}

export interface PaginationOptions<R, P extends unknown[]>
  extends Options<R, P>,
    PaginationExtendsOption {}

export interface PaginationQueryResult<R, P extends unknown[]>
  extends QueryResult<R, P> {
  current: WritableComputedRef<number>;
  pageSize: WritableComputedRef<number>;
  total: ComputedRef<number>;
  totalPage: ComputedRef<number>;
  changeCurrent: (current: number) => void;
  changePageSize: (pageSize: number) => void;
  changePagination: (current: number, pageSize: number) => void;
}

function usePagination<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options: PaginationOptions<R, P> = {},
  plugins?: PluginImplementType<R, P>[],
): PaginationQueryResult<R, P> {
  const defaultPaginationOptions = {
    currentKey: 'current',
    pageSizeKey: 'pageSize',
    totalKey: 'total',
    totalPageKey: 'totalPage',
  };

  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const { pagination, ...restOptions } = options;

  const { currentKey, pageSizeKey, totalKey, totalPageKey } = merge(
    defaultPaginationOptions,
    getGlobalOptions().pagination || {},
    injectedGlobalOptions.pagination || {},
    pagination || {},
  ) as PaginationType;

  const finallyOptions = merge(
    {
      defaultParams: [
        {
          [currentKey]: 1,
          [pageSizeKey]: 10,
        },
      ] as any,
    },
    restOptions,
  ) as any;

  const { data, params, run, ...rest } = useRequest<R, P>(
    service,
    finallyOptions,
    plugins,
  );

  const paging = (paginationParams: Record<string, number>) => {
    const [oldPaginationParams, ...restParams] = (params.value as P[]) || [];
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

  // changePagination	change current and pageSize	(current: number, pageSize: number) => void
  const changePagination = (current: number, pageSize: number) => {
    paging({ [currentKey]: current, [pageSizeKey]: pageSize });
  };

  const total = computed<number>(() => get(data.value!, totalKey, 0));
  const current = computed({
    get: () =>
      // @ts-ignore
      params.value?.[0]?.[currentKey] ??
      finallyOptions.defaultParams[0][currentKey],
    set: (val: number) => {
      changeCurrent(val);
    },
  });
  const pageSize = computed<number>({
    get: () =>
      // @ts-ignore
      params.value?.[0]?.[pageSizeKey] ??
      finallyOptions.defaultParams[0][pageSizeKey],
    set: (val: number) => {
      changePageSize(val);
    },
  });
  const totalPage = computed<number>(() =>
    get(data.value!, totalPageKey, Math.ceil(total.value / pageSize.value)),
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
    changePagination,
    ...rest,
  };
}

export default usePagination;
