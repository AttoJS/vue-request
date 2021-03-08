import { computed, inject, ref, Ref, watchEffect } from 'vue';
import {
  BaseOptions,
  FormatOptions,
  getGlobalOptions,
  GlobalOptions,
  GLOBAL_OPTIONS_PROVIDE_KEY,
} from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import get from 'lodash/get';
import generateService from './core/utils/generateService';
import { isFunction } from './core/utils';
import { ServiceParams } from './core/utils/types';

export interface LoadMoreResult<R, P extends unknown[], LR extends unknown[]>
  extends Omit<BaseResult<R, P>, 'queries'> {
  dataList: Ref<LR>;
  noMore: Ref<boolean>;
  loadingMore: Ref<boolean>;
  loadMore: () => void;
  reload: () => void;
}

export type LoadMoreExtendsOption = {
  listKey?: string;
};

export type LoadMoreGenericExtendsOption<R> = {
  isNoMore?: (data: R) => boolean;
};

export type LoadMoreService<R, P extends unknown[], LR> =
  | ((r: { data: R; dataList: LR }, ...args: P) => Promise<R>)
  | ((r: { data: R; dataList: LR }, ...args: P) => ServiceParams);

export type LoadMoreFormatOptions<R, P extends unknown[], FR> = Omit<
  FormatOptions<R, P, FR>,
  'queryKey'
> &
  LoadMoreGenericExtendsOption<R> &
  LoadMoreExtendsOption;

export type LoadMoreBaseOptions<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'queryKey'
> &
  LoadMoreGenericExtendsOption<R> &
  LoadMoreExtendsOption;

export type LoadMoreMixinOptions<R, P extends unknown[], FR> =
  | LoadMoreBaseOptions<R, P>
  | LoadMoreFormatOptions<R, P, FR>;

function useLoadMore<
  R,
  P extends unknown[] = any,
  LR extends unknown[] = any[]
>(service: LoadMoreService<R, P, LR>): LoadMoreResult<R, P, LR>;
function useLoadMore<
  R,
  P extends unknown[] = any,
  FR = any,
  LR extends unknown[] = any[]
>(
  service: LoadMoreService<R, P, LR>,
  options: LoadMoreFormatOptions<R, P, FR>,
): LoadMoreResult<FR, P, LR>;
function useLoadMore<
  R,
  P extends unknown[] = any,
  LR extends unknown[] = any[]
>(
  service: LoadMoreService<R, P, LR>,
  options: LoadMoreBaseOptions<R, P>,
): LoadMoreResult<R, P, LR>;
function useLoadMore<R, P extends unknown[], FR, LR extends unknown[]>(
  service: LoadMoreService<R, P, LR>,
  options?: LoadMoreMixinOptions<R, P, FR>,
) {
  if (!isFunction(service)) {
    throw new Error('useLoadMore only support function service');
  }
  const promiseQuery = generateService<R, P>(service as any);

  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const {
    queryKey,
    isNoMore,
    listKey = 'list',
    ...restOptions
  } = Object.assign(
    {
      listKey: injectedGlobalOptions.listKey ?? getGlobalOptions().listKey,
    },
    options ?? ({} as any),
  );

  if (queryKey) {
    throw new Error('useLoadMore does not support concurrent request');
  }

  const loadingMore = ref(false);
  const increaseQueryKey = ref(0);
  const { data, params, queries, run, reset, ...rest } = useAsyncQuery<
    R,
    P,
    FR
  >(promiseQuery, {
    ...restOptions,
    onSuccess: (...p) => {
      loadingMore.value = false;
      increaseQueryKey.value++;
      restOptions?.onSuccess?.(...p);
    },
    onError: (...p) => {
      loadingMore.value = false;
      restOptions?.onError?.(...p);
    },
    queryKey: () => String(increaseQueryKey.value),
  });

  const latestData = <Ref<FR | undefined>>ref(data.value);
  watchEffect(() => {
    if (data.value !== undefined) {
      latestData.value = data.value;
    }
  });

  const noMore = computed(() => {
    return isNoMore && isFunction(isNoMore)
      ? isNoMore(latestData.value)
      : false;
  });

  const dataList = computed(() => {
    let list: any[] = [];
    Object.values(queries).forEach(h => {
      const dataList = get(h.data, listKey);
      if (dataList && Array.isArray(dataList)) {
        list = list.concat(dataList);
      }
    });
    return (list as unknown) as LR;
  });

  const loadMore = () => {
    if (noMore.value) {
      return;
    }
    loadingMore.value = true;
    const [, ...restParams] = params.value;
    const mergerParams = [
      { dataList: dataList.value, data: latestData.value },
      ...restParams,
    ] as any;
    run(...mergerParams);
  };

  const reload = () => {
    reset();
    increaseQueryKey.value = 0;
    latestData.value = undefined;
    const [, ...restParams] = params.value;
    const mergerParams = [undefined, ...restParams] as any;
    run(...mergerParams);
  };

  return {
    data: latestData,
    dataList: dataList,
    params,
    noMore,
    loadingMore,
    run,
    reload,
    loadMore,
    reset,
    ...rest,
  };
}

export default useLoadMore;
