import { reactive, ref, toRefs, watch } from 'vue';
import DefaultOptions, { BaseOptions, Config } from './config';
import createQuery, { Query, QueryState } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends unknown[]> = QueryState<R, P>;

function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P> {
  const mergeOptions = { ...DefaultOptions, ...options };
  const {
    initialData,
    defaultParams,
    manual,
    ready,
    refreshDeps,
    throwOnError,
    loadingDelay,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    formatResult,
    onSuccess,
    onError,
  } = mergeOptions;

  const config: Config<R, P> = {
    initialData,
    loadingDelay,
    throwOnError,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    formatResult,
    onSuccess,
    onError,
  };
  const queryState = createQuery(query, config);

  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);
  const run = (...args: P) => {
    if (!ready.value && !hasTriggerReady.value) {
      tempReadyParams.value = args;
      return;
    }
    return queryState.run(args);
  };

  // initial run
  if (!manual) {
    run(...defaultParams);
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

  return reactive({
    ...toRefs(queryState),
    run,
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
