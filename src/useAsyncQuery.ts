import { computed, reactive, Ref, ref, shallowReactive, watch, watchEffect } from 'vue';
import { BaseOptions, Config, GetGlobalOptions, MixinOptions, FormatOptions } from './config';
import createQuery, {
  InnerQueryState,
  InnerRunReturn,
  Query,
  QueryState,
  State,
} from './createQuery';
import { unRefObject, resolvedPromise } from './utils';
import { getCache, setCache } from './utils/cache';
import limitTrigger from './utils/limitTrigger';
import subscriber from './utils/listener';

export type BaseResult<R, P extends unknown[]> = Omit<QueryState<R, P>, 'run'> & {
  run: (...arg: P) => InnerRunReturn<R>;
};

export type Queries<R, P extends unknown[]> = {
  [key: string]: InnerQueryState<R, P>;
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
): BaseResult<R, P> | BaseResult<FR, P> {
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
    throwOnError = false,
    loadingDelay = 0,
    pollingWhenHidden = false,
    refreshOnWindowFocus = false,
    focusTimespan = 5000,
    cacheTime = 10000,
    staleTime = 0,
    queryKey,
    formatResult,
    onSuccess,
    onError,
  } = { ...GetGlobalOptions(), ...options };

  const pollingHiddenFlag = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);

  const updateCache = (state: State<R, P>) => {
    if (!cacheKey) return;

    const cacheData = getCache<R, P>(cacheKey)?.data;
    const cacheQueries = cacheData?.queries;
    const queryData = unRefObject(state);
    const currentQueryKey = queryKey?.(...state.params.value) ?? QUERY_DEFAULT_KEY;

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
        latestQueriesKey: currentQueryKey ?? cacheData?.latestQueriesKey,
      },
      cacheTime,
    );
  };

  const config = {
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
    formatResult,
    onSuccess,
    onError,
  } as Config<R, P>;

  const loading = ref(false);
  const data = ref<R>();
  const error = ref<Error>();
  const params = ref<P>();

  const queries = shallowReactive<Queries<R, P>>({
    [QUERY_DEFAULT_KEY]: createQuery(query, config),
  });

  const latestQueriesKey = ref(QUERY_DEFAULT_KEY);

  const latestQuery = computed(() => queries[latestQueriesKey.value]);

  // sync state
  // TODO: 需要探索一下有没有更优的处理方法
  watchEffect(
    () => {
      loading.value = latestQuery.value.loading.value;
      data.value = latestQuery.value.data.value;
      error.value = latestQuery.value.error.value;
      params.value = latestQuery.value.params.value;
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
      return resolvedPromise;
    }

    const newKey = queryKey?.(...args) ?? QUERY_DEFAULT_KEY;

    if (!queries[newKey]) {
      queries[newKey] = createQuery(query, config);
    }

    latestQueriesKey.value = newKey;

    return latestQuery.value.run(args);
  };

  // initial run
  if (!manual) {
    initialAutoRunFlag.value = true;

    // TODO: need refactor
    const cache = getCache<R, P>(cacheKey!);
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
