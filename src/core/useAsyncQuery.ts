import {
  computed,
  inject,
  onUnmounted,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue';
import {
  BaseOptions,
  Config,
  FormatOptions,
  getGlobalOptions,
  GlobalOptions,
  GLOBAL_OPTIONS_PROVIDE_KEY,
  MixinOptions,
} from './config';
import createQuery, {
  InnerQueryState,
  InnerRunReturn,
  Mutate,
  Query,
  QueryState,
  State,
} from './createQuery';
import { resolvedPromise, unRefObject } from './utils';
import { getCache, setCache } from './utils/cache';
import { UnWrapRefObject } from './utils/types';

export interface BaseResult<R, P extends unknown[]>
  extends Omit<QueryState<R, P>, 'run'> {
  run: (...arg: P) => InnerRunReturn<R>;
  reset: () => void;
}

export type UnWrapState<R, P extends unknown[]> = UnWrapRefObject<
  InnerQueryState<R, P>
>;

export type Queries<R, P extends unknown[]> = {
  [key: string]: UnWrapState<R, P>;
};

const QUERY_DEFAULT_KEY = '__QUERY_DEFAULT_KEY__';

function useAsyncQuery<R, P extends unknown[], FR>(
  query: Query<R, P>,
  options: FormatOptions<R, P, FR>,
): BaseResult<FR, P>;
function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P>;
function useAsyncQuery<R, P extends unknown[], FR>(
  query: Query<R, P>,
  options: MixinOptions<R, P, FR>,
) {
  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const {
    initialData,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    cacheKey,
    defaultParams = ([] as unknown) as P,
    manual = false,
    ready = ref(true),
    refreshDeps = [],
    loadingDelay = 0,
    pollingWhenHidden = false,
    pollingWhenOffline = false,
    refreshOnWindowFocus = false,
    refocusTimespan = 5000,
    cacheTime = 600000,
    staleTime = 0,
    errorRetryCount = 0,
    errorRetryInterval = 0,
    queryKey,
    formatResult,
    onSuccess,
    onError,
  } = { ...getGlobalOptions(), ...injectedGlobalOptions, ...options };

  const stopPollingWhenHiddenOrOffline = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);

  const updateCache = (state: State<R, P>) => {
    if (!cacheKey) return;

    const cacheData = getCache<R, P>(cacheKey)?.data;
    const cacheQueries = cacheData?.queries;
    const queryData = unRefObject(state);
    const currentQueryKey =
      queryKey?.(...state.params.value) ?? QUERY_DEFAULT_KEY;

    setCache<R, P>(
      cacheKey,
      {
        queries: {
          ...cacheQueries,
          [currentQueryKey]: {
            ...cacheQueries?.[currentQueryKey],
            ...queryData,
          },
        },
        latestQueriesKey: currentQueryKey,
      },
      cacheTime,
    );
  };

  const config = {
    initialAutoRunFlag,
    initialData,
    loadingDelay,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    pollingWhenHidden,
    pollingWhenOffline,
    stopPollingWhenHiddenOrOffline,
    cacheKey,
    errorRetryCount,
    errorRetryInterval,
    refreshOnWindowFocus,
    refocusTimespan,
    updateCache,
    formatResult,
    onSuccess,
    onError,
  } as Config<R, P>;

  const loading = ref(false);
  const data = ref<R>();
  const error = ref<Error>();
  const params = ref<P>();

  const queries = <Queries<R, P>>reactive({
    [QUERY_DEFAULT_KEY]: reactive(createQuery(query, config)),
  });

  const latestQueriesKey = ref(QUERY_DEFAULT_KEY);

  const latestQuery = computed(() => queries[latestQueriesKey.value] ?? {});

  // sync state
  // TODO: 需要探索一下有没有更优的处理方法
  watchEffect(
    () => {
      loading.value = latestQuery.value.loading;
      data.value = latestQuery.value.data;
      error.value = latestQuery.value.error;
      params.value = latestQuery.value.params;
    },
    {
      flush: 'sync',
    },
  );

  // init queries from cache
  if (cacheKey) {
    const cache = getCache<R, P>(cacheKey);

    if (cache?.data?.queries) {
      Object.keys(cache.data.queries).forEach(key => {
        const cacheQuery = cache.data.queries![key];

        queries[key] = <UnWrapState<R, P>>reactive(
          createQuery(query, config, {
            loading: cacheQuery.loading,
            params: cacheQuery.params,
            data: cacheQuery.data,
            error: cacheQuery.error,
          }),
        );
      });
      /* istanbul ignore else */
      if (cache.data.latestQueriesKey) {
        latestQueriesKey.value = cache.data.latestQueriesKey;
      }
    }
  }

  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);
  const run = (...args: P) => {
    if (!ready.value && !hasTriggerReady.value) {
      tempReadyParams.value = args;
      return resolvedPromise;
    }

    const newKey = queryKey?.(...args) ?? QUERY_DEFAULT_KEY;

    if (!queries[newKey]) {
      queries[newKey] = <UnWrapState<R, P>>reactive(createQuery(query, config));
    }

    latestQueriesKey.value = newKey;

    return latestQuery.value.run(...args);
  };

  const reset = () => {
    unmountQueries();
    latestQueriesKey.value = QUERY_DEFAULT_KEY;
    queries[QUERY_DEFAULT_KEY] = <UnWrapState<R, P>>(
      reactive(createQuery(query, config))
    );
  };

  // unmount queries
  const unmountQueries = () => {
    Object.keys(queries).forEach(key => {
      queries[key].cancel();
      queries[key].unmount();
      delete queries[key];
    });
  };

  const cancel = () => latestQuery.value.cancel();
  const refresh = () => latestQuery.value.refresh();
  const mutate = <Mutate<R>>((arg: R) => latestQuery.value.mutate(arg));

  // initial run
  if (!manual) {
    initialAutoRunFlag.value = true;

    // TODO: need refactor
    const cache = getCache<R, P>(cacheKey!);
    const cacheQueries = cache?.data.queries ?? {};

    const isFresh =
      cache &&
      (staleTime === -1 || cache.cacheTime + staleTime > new Date().getTime());

    const hasCacheQueries = Object.keys(cacheQueries).length > 0;

    if (!isFresh) {
      if (hasCacheQueries) {
        Object.keys(queries).forEach(key => {
          queries[key]?.refresh();
        });
      } else {
        run(...defaultParams);
      }
    }

    initialAutoRunFlag.value = false;
  }

  // watch ready
  const stopReady = ref();
  stopReady.value = watch(
    ready,
    val => {
      hasTriggerReady.value = true;
      if (val && tempReadyParams.value) {
        run(...tempReadyParams.value);
        // destroy current watch
        stopReady.value();
      }
    },
    {
      flush: 'sync',
    },
  );

  // watch refreshDeps
  if (refreshDeps.length) {
    watch(refreshDeps, () => {
      !manual && latestQuery.value.refresh();
    });
  }

  onUnmounted(() => {
    unmountQueries();
  });

  return {
    loading,
    data,
    error,
    params,
    cancel,
    refresh,
    mutate,
    run,
    reset,
    queries,
  };
}

export default useAsyncQuery;
