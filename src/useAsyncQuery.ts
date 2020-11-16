import { computed, reactive, ref, toRefs, watch } from 'vue';
import DefaultOptions, { BaseOptions, Config, GetGlobalOptions } from './config';
import createQuery, { InnerQueryState, Query, QueryState } from './createQuery';
import { CacheDataType, getCache, setCache } from './utils/cache';
import limitTrigger from './utils/limitTrigger';
import subscriber from './utils/listener';
import { PartialRecord } from './utils/types';

export type BaseResult<R, P extends unknown[]> = QueryState<R, P>;

export type Queries<R, P extends unknown[]> = Record<string, InnerQueryState<R, P>>;

const QUERY_DEFAULT_KEY = '__QUERY_DEFAULT_KEY__';

function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P> {
  const mergeOptions = { ...DefaultOptions, ...GetGlobalOptions(), ...options };
  const pollingHiddenFlag = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);
  const updateCache = (params: PartialRecord<CacheDataType<R, P>>) => {
    const cache = getCache<R, P>(mergeOptions.cacheKey);
    if (cache?.data) {
      setCache<R, P>(
        mergeOptions.cacheKey,
        {
          queries: { ...cache.data?.queries, ...params?.queries },
          latestQueriesKey: cache.data?.latestQueriesKey ?? params?.latestQueriesKey,
        },
        mergeOptions.cacheTime,
      );
    } else {
      setCache<R, P>(mergeOptions.cacheKey, params, mergeOptions.cacheTime);
    }
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

  const queries: Queries<R, P> = reactive<any>({
    [QUERY_DEFAULT_KEY]: createQuery<R, P>(query, config),
  });

  const latestQueriesKey = ref(QUERY_DEFAULT_KEY);

  const latestQuery = computed(() => queries[latestQueriesKey.value]);

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
      return;
    }

    if (queryKey) {
      const key = queryKey(...args) ?? QUERY_DEFAULT_KEY;

      latestQueriesKey.value = key;
    }

    if (!queries[latestQueriesKey.value]) {
      queries[latestQueriesKey.value] = createQuery(query, config);
    }

    if (cacheKey) {
      updateCache({ queries, latestQueriesKey: latestQueriesKey.value });
    }

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

  return reactive({
    ...toRefs(latestQuery.value),
    run,
    queries,
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
