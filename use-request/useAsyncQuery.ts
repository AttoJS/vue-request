import { computed, reactive, ref, toRefs, watch } from 'vue';
import DefaultOptions, { BaseOptions, Config } from './config';
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
  const mergeOptions = { ...DefaultOptions, ...options };
  const pollingHiddenFlag = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);
  const updateCache = (params: PartialRecord<CacheDataType<R, P>>) => {
    const cache = getCache<R, P>(mergeOptions.cacheKey);
    if (cache?.data) {
      setCache<R, P>(
        mergeOptions.cacheKey,
        {
          state: { ...cache.data?.state, ...params?.state },
          queries: { ...cache.data?.queries, ...params?.queries },
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

  const queries: Queries<R, P> = reactive({});

  const latestQueryKey = ref('');
  const latestQuery = computed(() => queries[latestQueryKey.value] ?? {});

  // init queries from cache
  if (cacheKey) {
    const cache = getCache<R, P>(cacheKey);

    if (cache?.data.queries) {
      Object.keys(cache?.data.queries).forEach(key => {
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
    }
  }

  const _queryState = () => {
    if (cacheKey) {
      const cache = getCache<R, P>(cacheKey);
      if (cache) {
        return createQuery(query, config, cache.data.state);
      }
    }
    return createQuery(query, config);
  };
  const queryState = _queryState();

  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);
  const run = (...args: P) => {
    if (!ready.value && !hasTriggerReady.value) {
      tempReadyParams.value = args;
      return;
    }

    if (queryKey) {
      const key = queryKey(...args) ?? QUERY_DEFAULT_KEY;

      let currentQuery = queries[key];

      if (!currentQuery) {
        const newQuery = createQuery(query, config);
        queries[key] = newQuery;
        currentQuery = newQuery;

        if (cacheKey) updateCache({ queries });
      }

      latestQueryKey.value = key;

      return currentQuery.run(args);
    }

    return queryState.run(args);
  };

  // initial run
  if (!manual) {
    initialAutoRunFlag.value = true;

    const cache = getCache<R, P>(cacheKey);

    const isFresh =
      cache && (staleTime === -1 || cache.cacheTime + staleTime > new Date().getTime());

    const hasCacheQueries = Object.keys(queries).length > 0;

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
      !manual && queryState.refresh();
    });
  }

  // subscribe polling
  if (!pollingWhenHidden) {
    subscriber('VISIBLE_LISTENER', () => {
      if (pollingHiddenFlag.value) {
        pollingHiddenFlag.value = false;
        queryState.refresh();
      }
    });
  }

  // subscribe window focus or visible
  if (refreshOnWindowFocus) {
    const limitRefresh = limitTrigger(queryState.refresh, focusTimespan);
    subscriber('VISIBLE_LISTENER', limitRefresh);
    subscriber('FOCUS_LISTENER', limitRefresh);
  }

  const finalQueryState = reactive({
    ...toRefs(queryState),
    ...toRefs(latestQuery),
    run,
    queries,
  }) as QueryState<R, P>;

  return finalQueryState;
}

export default useAsyncQuery;
