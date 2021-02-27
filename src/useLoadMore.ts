import { computed, ref, Ref, watchEffect } from 'vue';
import { BaseOptions, FormatOptions } from './core/config';
import useAsyncQuery, { BaseResult } from './core/useAsyncQuery';
import get from 'lodash/get';
import generateService from './core/utils/generateService';
import { isFunction } from './core/utils';
import { ServiceParams } from './core/utils/types';
import { Query } from './core/createQuery';

export interface LoadMoreResult<R, P extends unknown[]>
  extends Omit<BaseResult<R, P>, 'queries' | '_raw_data'> {
  dataList: Ref<R>;
  noMore: Ref<boolean>;
  loadingMore: Ref<boolean>;
  loadMore: () => void;
  reload: () => void;
}

export interface LoadMoreExtendsOption<R> {
  isNoMore: (data: R) => boolean;
}

export type LoadMoreService<R, P extends unknown[], FR> =
  | ((r: { data: R; dataList: FR }, ...args: P) => Promise<R>)
  | ((r: { data: R; dataList: FR }, ...args: P) => ServiceParams);

export type LoadMoreFormatOptions<R, P extends unknown[], FR> = Omit<
  FormatOptions<R, P, FR>,
  'queryKey'
> &
  LoadMoreExtendsOption<R>;

export type LoadMoreBaseOptions<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'queryKey'
> &
  LoadMoreExtendsOption<R>;

export type LoadMoreMixinOptions<R, P extends unknown[], FR> =
  | LoadMoreBaseOptions<R, P>
  | LoadMoreFormatOptions<R, P, FR>;

function useLoadMore<R extends unknown[], P extends unknown[] = any>(
  service: LoadMoreService<R, P, R>,
): LoadMoreResult<R, P>;
function useLoadMore<R, P extends unknown[] = any, FR extends unknown[] = any>(
  service: LoadMoreService<R, P, FR>,
  options: LoadMoreFormatOptions<R, P, FR>,
): LoadMoreResult<FR, P>;
function useLoadMore<R extends unknown[], P extends unknown[] = any>(
  service: LoadMoreService<R, P, R>,
  options: LoadMoreBaseOptions<R, P>,
): LoadMoreResult<R, P>;
function useLoadMore<R, P extends unknown[], FR extends unknown[]>(
  service: LoadMoreService<R, P, FR>,
  options?: LoadMoreMixinOptions<R, P, FR>,
) {
  if (!isFunction(service)) {
    throw new Error('useLoadMore only support function service');
  }
  const promiseQuery = generateService<R, P>(service as any);

  const { queryKey, isNoMore, ...restOptions } = options ?? ({} as any);

  if (queryKey) {
    throw new Error('useLoadMore does not support concurrent request');
  }

  const loadingMore = ref(false);
  const increaseQueryKey = ref(0);
  const { data, params, run, queries, _raw_data, ...rest } = useAsyncQuery<
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
    queryKey: () => String(increaseQueryKey.value),
  });

  const noMore = computed(() => {
    return isNoMore ? isNoMore(_raw_data.value) : false;
  });

  const dataList = computed(() => {
    let list: any[] = [];
    Object.values(queries).forEach(h => {
      const queriesData = h.data as any;
      if (queriesData.value && Array.isArray(queriesData.value)) {
        list = list.concat(queriesData.value);
      }
    });
    return (list as unknown) as R;
  });

  const loadMore = () => {
    if (noMore.value) {
      return;
    }
    loadingMore.value = true;
    const [, ...restParams] = params.value;
    const mergerParams = [
      { dataList: dataList.value, data: _raw_data.value },
      ...restParams,
    ] as any;
    run(...mergerParams);
  };

  const reload = () => {};

  return {
    // 每次 LoadMore 触发时，data 都会变成undefined，原因是 queries
    data: _raw_data,
    dataList,
    params,
    noMore,
    loadingMore,
    run,
    reload,
    loadMore,
    ...rest,
  };
}

export default useLoadMore;
