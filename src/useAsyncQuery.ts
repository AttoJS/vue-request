import { computed, reactive, Ref, ref, toRefs, watch, watchEffect } from 'vue';
import DefaultOptions, { BaseOptions, Config, GetGlobalOptions } from './config';
import createQuery, {
  InnerQueryState,
  InnerRunReturn,
  Query,
  QueryState,
  State,
} from './createQuery';
import { getCache, setCache } from './utils/cache';
import limitTrigger from './utils/limitTrigger';
import subscriber from './utils/listener';
import { UnWrapRefObject } from './utils/types';

export type BaseResult<R, P extends unknown[]> = Omit<QueryState<R, P>, 'run'> & {
  run: (...arg: P) => InnerRunReturn<R> | undefined;
};

export type Queries<R, P extends unknown[]> = {
  [key: string]: InnerQueryState<R, P>;
};

export type UpdateCacheParams<R, P extends unknown[]> = {
  queryData: UnWrapRefObject<State<R, P>>;
  key?: string;
};

const QUERY_DEFAULT_KEY = '__QUERY_DEFAULT_KEY__';

function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P> {
  const mergeOptions = { ...DefaultOptions, ...GetGlobalOptions(), ...options };
  const pollingHiddenFlag = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);

  const updateCache = (params: UpdateCacheParams<R, P>) => {
    if (!cacheKey) return;

    const cacheData = getCache<R, P>(mergeOptions.cacheKey)?.data;
    const { queryData, key: currentQueriesKey = QUERY_DEFAULT_KEY } = params;

    const newQuery = {
      ...cacheData?.queries?.[currentQueriesKey],
      ...queryData,
    };

    setCache<R, P>(
      mergeOptions.cacheKey,
      {
        queries: { ...cacheData?.queries, [currentQueriesKey]: newQuery },
        latestQueriesKey: currentQueriesKey ?? cacheData?.latestQueriesKey,
      },
      mergeOptions.cacheTime,
    );

    console.log(
      'updateCache -> getCache<R, P>(mergeOptions.cacheKey)',
      getCache<R, P>(mergeOptions.cacheKey),
    );
  };

  const {
    initialData,
    defaultParams,
    manual,
    ready,
    refreshDeps,
    throwOnError,
    loadingDelay,
    pollingInterval,
    pollingWhenHidden,
    debounceInterval,
    throttleInterval,
    refreshOnWindowFocus,
    focusTimespan,
    cacheKey,
    cacheTime,
    staleTime,
    queryKey,
    formatResult,
    onSuccess,
    onError,
  } = mergeOptions;

  const config: Config<R, P> = {
    initialAutoRunFlag,
    initialData,
    loadingDelay,
    throwOnError,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    pollingWhenHidden,
    pollingHiddenFlag,
    cacheKey,
    cacheTime,
    staleTime,
    updateCache,
    queryKey,
    formatResult,
    onSuccess,
    onError,
  };

  const loading = ref(false);
  const data = ref({}) as Ref<R>;
  const error = ref<Error | undefined>(undefined);
  const params = ref(([] as unknown) as P) as Ref<P>;

  const queries = reactive<Queries<R, P>>({
    [QUERY_DEFAULT_KEY]: createQuery<R, P>(query, config),
  });

  const latestQueriesKey = ref(QUERY_DEFAULT_KEY);

  const latestQuery = computed(() => queries[latestQueriesKey.value]);

  watchEffect(
    () => {
      loading.value = latestQuery.value.loading;
      data.value = latestQuery.value.data as R;
      error.value = latestQuery.value.error;
      params.value = latestQuery.value.params as P;
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
        const cacheQuery = cache.data.queries?.[key];

        if (cacheQuery) {
          // @ts-ignore
          queries[key] = createQuery(query, config, {
            loading: cacheQuery.loading,
            params: cacheQuery.params,
            data: cacheQuery.data,
            error: cacheQuery.error,
          });
        }
      });

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
      return;
    }

    const newKey = queryKey?.(...args) ?? QUERY_DEFAULT_KEY;

    if (!queries[newKey]) {
      // @ts-ignore
      queries[newKey] = createQuery(query, config);
    }

    latestQueriesKey.value = newKey;

    return latestQuery.value.run(args);
  };

  // initial run
  if (!manual) {
    initialAutoRunFlag.value = true;

    const cache = getCache<R, P>(cacheKey);
    const cacheQueries = cache?.data.queries ?? {};

    const isFresh =
      cache && (staleTime === -1 || cache.cacheTime + staleTime > new Date().getTime());

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

  // subscribe polling
  if (!pollingWhenHidden) {
    subscriber('VISIBLE_LISTENER', () => {
      if (pollingHiddenFlag.value) {
        pollingHiddenFlag.value = false;
        latestQuery.value.refresh();
      }
    });
  }

  // subscribe window focus or visible
  if (refreshOnWindowFocus) {
    const limitRefresh = limitTrigger(latestQuery.value.refresh, focusTimespan);
    subscriber('VISIBLE_LISTENER', limitRefresh);
    subscriber('FOCUS_LISTENER', limitRefresh);
  }

  // @ts-ignore
  const queryState = {
    loading,
    data,
    error,
    params,
    cancel: latestQuery.value.cancel,
    refresh: latestQuery.value.refresh,
    mutate: latestQuery.value.mutate,
    run,
    queries,
  } as QueryState<R, P>;

  return queryState;
}

export default useAsyncQuery;
