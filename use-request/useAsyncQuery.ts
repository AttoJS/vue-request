import { reactive, toRefs, watch, ref } from 'vue';
import DefaultConfig, { BaseConfig, Config } from './config';
import createQuery, { QueryState, Request } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends any[]> = QueryState<R, P>;

function useAsyncQuery<R, P extends any[]>(
  queryMethod: Request<R, P>,
  options: BaseConfig<R, P>,
): BaseResult<R, P> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const {
    initialData,
    defaultParams,
    manual,
    ready,
    refreshDeps,
    onSuccess,
    onError,
    throwOnError,
    loadingDelay,
    formatResult,
  } = mergeConfig;

  const config: Config<R, P> = {
    initialData,
    loadingDelay,
    throwOnError,
    formatResult,
    onSuccess,
    onError,
  };
  const query = createQuery(queryMethod, config);

  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);
  const run = (...args: P) => {
    if (!ready.value && !hasTriggerReady.value) {
      tempReadyParams.value = args;
      return;
    }
    return query.run(args);
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
        run(...defaultParams);
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
      !manual && query.refresh();
    });
  }

  return reactive({
    ...toRefs(query),
    run,
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
