import type { Ref } from 'vue-demi';
import { computed, inject, ref, watch } from 'vue-demi';

import { getGlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';
import type { GlobalOptions, Options } from './core/types';
import { get, isFunction, omit } from './core/utils';
import useRequest from './useRequest';

export type LoadMoreExtendsOption = {
  listKey?: string;
};

export type LoadMoreGenericExtendsOption<R> = {
  isNoMore?: (data: R | undefined) => boolean;
};

export type LoadMoreService<R, P extends unknown[], LR> = (
  r: { data: R; dataList: LR },
  ...args: P
) => Promise<R>;

export type LoadMoreBaseOptions<R, P extends unknown[]> = Options<R, P> &
  LoadMoreGenericExtendsOption<R> &
  LoadMoreExtendsOption;

function useLoadMore<
  R,
  P extends unknown[] = any,
  LR extends unknown[] = any[],
>(service: LoadMoreService<R, P, LR>, options?: LoadMoreBaseOptions<R, P>) {
  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const {
    isNoMore,
    listKey = 'list',
    ...restOptions
  } = Object.assign(
    {
      listKey: injectedGlobalOptions.listKey ?? getGlobalOptions().listKey,
    },
    options ?? ({} as any),
  );

  const refreshing = ref(false);
  const loadingMore = ref(false);
  const reloading = ref(false);

  const dataList = ref([]) as unknown as Ref<LR>;

  const {
    data,
    params,
    runAsync,
    refreshAsync,
    run,
    cancel: _cancel,
    ...rest
    // @ts-ignore
  } = useRequest<R, P>(service, {
    ...restOptions,
    onSuccess: (...p) => {
      loadingMore.value = false;
      restOptions?.onSuccess?.(...p);
    },
    onError: (...p) => {
      loadingMore.value = false;
      restOptions?.onError?.(...p);
    },
    onAfter: (...p) => {
      if (refreshing.value) {
        dataList.value = [] as any;
      }
      restOptions?.onAfter?.(...p);
    },
  });

  const noMore = computed(() => {
    return isNoMore && isFunction(isNoMore) ? isNoMore(data.value) : false;
  });

  watch(data, value => {
    if (value) {
      const list = get(value, listKey);
      if (list && Array.isArray(list)) {
        dataList.value = [...dataList.value, ...list] as any;
      }
    }
  });

  const loadMore = () => {
    if (noMore.value) {
      return;
    }
    loadingMore.value = true;
    const [, ...restParams] = params.value;
    const mergerParams = [
      { dataList: dataList.value, data: data.value },
      ...restParams,
    ] as P;
    run(...mergerParams);
  };

  const refresh = async () => {
    refreshing.value = true;
    const [, ...restParams] = params.value;
    const mergerParams = [undefined, ...restParams] as any;
    await runAsync(...mergerParams);
    refreshing.value = false;
  };

  const reload = async () => {
    reloading.value = true;
    cancel();
    dataList.value = [] as any;
    const [, ...restParams] = params.value;
    const mergerParams = [undefined, ...restParams] as any;
    await runAsync(...mergerParams);
    reloading.value = false;
  };

  const cancel = () => {
    _cancel();
    loadingMore.value = false;
    refreshing.value = false;
  };

  return {
    data,
    dataList,
    params,
    noMore,
    loadingMore,
    refreshing,
    reloading,
    runAsync,
    reload,
    loadMore,
    refresh,
    cancel,
    ...omit(rest, ['refresh', 'mutate']),
  };
}

export default useLoadMore;
