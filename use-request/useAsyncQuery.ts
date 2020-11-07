import { reactive, ref, toRefs, watch } from 'vue';
import DefaultOptions, { BaseOptions, Config, GetGlobalOptions } from './config';
import createQuery, { Query, QueryState, State } from './createQuery';
import { getCache, setCache } from './utils/cache';
import limitTrigger from './utils/limitTrigger';
import subscriber from './utils/listener';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends unknown[]> = QueryState<R, P>;

export type Queries<R, P extends unknown[]> = Record<string, QueryState<R, P>>;

function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P> {
  const mergeOptions = { ...DefaultOptions, ...GetGlobalOptions(), ...options };
  const pollingHiddenFlag = ref(false);
  // skip debounce when initail run
  const initialAutoRunFlag = ref(false);
  const updateCache = (state: Partial<State<R, P>>) => {
    const cache = getCache(mergeOptions.cacheKey);
    if (cache?.data) {
      setCache(mergeOptions.cacheKey, { ...cache.data, ...state }, mergeOptions.cacheTime);
    } else {
      // @ts-ignore
      setCache(mergeOptions.cacheKey, state, mergeOptions.cacheTime);
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
    fetchKey,
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
    fetchKey,
    formatResult,
    onSuccess,
    onError,
  };

  const _queryState = () => {
    if (cacheKey) {
      const cache = getCache<R, P>(cacheKey);
      if (cache) {
        return createQuery(query, config, cache.data);
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
    return queryState.run(args);
  };

  const queries: Queries<R, P> = {};

  // initial run
  if (!manual) {
    initialAutoRunFlag.value = true;
    const cache = getCache(cacheKey);

    const isFresh =
      cache && (staleTime === -1 || cache.cacheTime + staleTime > new Date().getTime());

    if (!isFresh) {
      run(...defaultParams);
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

  return reactive({
    ...toRefs(queryState),
    run,
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
