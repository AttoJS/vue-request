import type { ComputedRef, Ref } from 'vue-demi';
import { computed, ref, shallowRef } from 'vue-demi';

import useDebouncePlugin from './core/plugins/useDebouncePlugin';
import useErrorRetryPlugin from './core/plugins/useErrorRetryPlugin';
import useReadyPlugin from './core/plugins/useReadyPlugin';
import useRefreshDepsPlugin from './core/plugins/useRefreshDepsPlugin';
import useThrottlePlugin from './core/plugins/useThrottlePlugin';
import type { Mutate, Options, QueryResult } from './core/types';
import useQuery from './core/useQuery';
import { isFunction, isObject, omit, warning } from './core/utils';

export type DataType = { list: any[]; [key: string]: any };

export type LoadMoreService<R extends DataType> = (data?: R) => Promise<R>;

export type LoadMoreBaseOptions<R> = Pick<
  Options<R, any>,
  | 'ready'
  | 'manual'
  | 'refreshDeps'
  | 'refreshDepsAction'
  | 'debounceInterval'
  | 'debounceOptions'
  | 'throttleInterval'
  | 'throttleOptions'
  | 'errorRetryCount'
  | 'errorRetryInterval'
> & {
  isNoMore?: (data?: R) => boolean;
  onBefore?: () => void;
  onAfter?: () => void;
  onSuccess?: (data: R) => void;
  onError?: (error: Error) => void;
};

type LoadMoreQueryResult<R extends DataType> = Pick<
  QueryResult<R, any>,
  | 'data'
  | 'loading'
  | 'error'
  | 'refresh'
  | 'refreshAsync'
  | 'cancel'
  | 'mutate'
> & {
  dataList: ComputedRef<R['list']>;
  noMore: ComputedRef<boolean>;
  loadingMore: Ref<boolean>;
  loadMore: () => void;
  loadMoreAsync: () => Promise<R>;
};

function useLoadMore<R extends DataType>(
  service: LoadMoreService<R>,
  options?: LoadMoreBaseOptions<R>,
): LoadMoreQueryResult<R> {
  const { isNoMore, ...restOptions } = options ?? {};

  const data = <Ref<R>>shallowRef();
  const dataList = computed(() => data.value?.list || []);
  const loadingMore = ref(false);
  const isTriggerByLoadMore = ref(false);
  const count = ref(0);

  const { runAsync, run, cancel: _cancel, ...rest } = useQuery(
    async (lastData?: R) => {
      const currentCount = count.value;
      const currentData = await service(lastData);
      if (currentCount === count.value) {
        if (lastData) {
          data.value = {
            ...currentData,
            list: [...lastData.list, ...currentData.list],
          };
        } else {
          data.value = currentData;
        }
      }
      return currentData;
    },
    {
      ...restOptions,
      defaultParams: [],
      refreshDepsAction: () => {
        if (restOptions?.refreshDepsAction) {
          restOptions.refreshDepsAction();
        } else {
          refresh();
        }
      },
      onError: (error: Error) => {
        restOptions?.onError?.(error);
      },
      onSuccess: (data: R) => {
        restOptions?.onSuccess?.(data);
      },
      onBefore: () => {
        count.value += 1;
        if (isTriggerByLoadMore.value) {
          isTriggerByLoadMore.value = false;
          loadingMore.value = true;
        }
        restOptions?.onBefore?.();
      },
      onAfter: () => {
        loadingMore.value = false;
        isTriggerByLoadMore.value = false;
        restOptions?.onAfter?.();
      },
    },
    [
      useErrorRetryPlugin,
      useDebouncePlugin,
      useThrottlePlugin,
      useRefreshDepsPlugin,
      useReadyPlugin,
    ],
  );
  const noMore = computed(() => {
    return isNoMore && isFunction(isNoMore) ? isNoMore(data.value) : false;
  });

  const loadMore = () => {
    loadMoreAsync().catch(() => {});
  };
  const loadMoreAsync = () => {
    if (noMore.value) {
      return Promise.reject(
        warning(
          'No more data. You need to ignore this error by checking if `noMore` is false before calling `loadMoreAsync`',
          true,
        ),
      );
    }
    isTriggerByLoadMore.value = true;
    return runAsync(data.value);
  };

  const refresh = () => run();
  const refreshAsync = () => runAsync();

  const cancel = () => {
    count.value += 1;
    _cancel();
    loadingMore.value = false;
  };

  const mutate: Mutate<R> = x => {
    const mutateData = isFunction(x) ? x(data.value) : x;
    const _mutateData = isObject(mutateData)
      ? Object.assign({}, mutateData)
      : mutateData;

    data.value = _mutateData;
  };

  return {
    data,
    dataList,
    loadingMore,
    noMore,
    cancel,
    mutate,
    refresh,
    refreshAsync,
    loadMore,
    loadMoreAsync,
    ...omit(rest, ['refresh', 'refreshAsync', 'mutate', 'params', 'data']),
  };
}

export default useLoadMore;
