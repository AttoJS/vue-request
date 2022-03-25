import type { ComputedRef, Ref, WritableComputedRef } from 'vue-demi';
import { computed, inject, ref } from 'vue-demi';

import { getGlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';
import type {
  GlobalOptions,
  Options,
  QueryResult,
  Service,
} from './core/types';
import { get } from './core/utils';
import { merge } from './core/utils/lodash';
import useRequest from './useRequest';

export interface PaginationExtendsOption {
  pagination?: {
    currentKey?: string;
    pageSizeKey?: string;
    totalKey?: string;
    totalPageKey?: string;
  };
}

export interface PaginationOptions<R, P extends unknown[]>
  extends Options<R, P>,
    PaginationExtendsOption {}

interface PaginationQueryResult<R, P extends unknown[]>
  extends QueryResult<R, P> {
  current: WritableComputedRef<number>;
  pageSize: WritableComputedRef<number>;
  total: ComputedRef<number>;
  totalPage: ComputedRef<number>;
  reloading: Ref<boolean>;
  reload: () => void;
  changeCurrent: (current: number) => void;
  changePageSize: (pageSize: number) => void;
  changePagination: (current: number, pageSize: number) => void;
}

function usePagination<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: PaginationOptions<R, P>,
): PaginationQueryResult<R, P> {
  const defaultOptions = {
    pagination: {
      currentKey: 'current',
      pageSizeKey: 'pageSize',
      totalKey: 'total',
      totalPageKey: 'totalPage',
    },
  };

  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const {
    pagination: { currentKey, pageSizeKey, totalKey, totalPageKey },
    ...restOptions
  } = merge(
    defaultOptions,
    { pagination: getGlobalOptions().pagination ?? {} },
    { pagination: injectedGlobalOptions.pagination ?? {} },
    options ?? ({} as any),
  ) as any;

  const finallyOptions = merge(
    {
      defaultParams: [
        {
          [currentKey]: 1,
          [pageSizeKey]: 10,
        },
      ],
    },
    restOptions,
  );

  const { data, params, run, runAsync, cancel, ...rest } = useRequest<R, P>(
    service,
    finallyOptions,
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

  const reloading = ref(false);
  const reload = async () => {
    const { defaultParams, manual } = finallyOptions;
    cancel();
    if (!manual) {
      reloading.value = true;
      await runAsync(...defaultParams);
      reloading.value = false;
    }
  };

  const total = computed<number>(() => get(data.value!, totalKey, 0));
  const current = computed({
    get: () =>
      (params.value?.[0] as Record<string, number>)?.[currentKey] ??
      finallyOptions.defaultParams[0][currentKey],
    set: (val: number) => {
      changeCurrent(val);
    },
  });
  const pageSize = computed({
    get: () =>
      (params.value?.[0] as Record<string, number>)?.[pageSizeKey] ??
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
    reloading,
    run,
    runAsync,
    changeCurrent,
    changePageSize,
    changePagination,
    reload,
    cancel,
    ...rest,
  };
}

export default usePagination;
