import debounce from 'lodash-es/debounce';
import throttle from 'lodash-es/throttle';
import { reactive, ref, toRefs, watch } from 'vue';
import DefaultOptions, { BaseOptions, Config } from './config';
import createQuery, { QueryState, Query } from './createQuery';
import subscriber from './utils/listener';
import { isNil } from './utils';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends unknown[]> = QueryState<R, P>;

function useAsyncQuery<R, P extends unknown[]>(
  query: Query<R, P>,
  options: BaseOptions<R, P>,
): BaseResult<R, P> {
  const mergeOptions = { ...DefaultOptions, ...options };
  const pollingHiddenFlag = ref(false);
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
    formatResult,
    onSuccess,
    onError,
  } = mergeOptions;

  const config: Config<R, P> = {
    initialData,
    loadingDelay,
    throwOnError,
    pollingInterval,
    pollingWhenHidden,
    pollingHiddenFlag,
    formatResult,
    onSuccess,
    onError,
  };
  const queryState = createQuery(query, config);

  const tempReadyParams = ref();
  const hasTriggerReady = ref(false);
  const normalRun = (...args: P) => {
    if (!ready.value && !hasTriggerReady.value) {
      tempReadyParams.value = args;
      return;
    }
    return queryState.run(args);
  };

  let debounceRun: any;
  let throttleRun: any;

  if (!isNil(debounceInterval) && debounceInterval >= 0) {
    debounceRun = debounce(normalRun, debounceInterval);
  }

  if (!isNil(throttleInterval) && throttleInterval >= 0) {
    throttleRun = throttle(normalRun, throttleInterval);
  }

  const finalRun: (...args: P) => Promise<R> = debounceRun || throttleRun || normalRun;
  console.log(finalRun);
  // initial run
  if (!manual) {
    finalRun(...defaultParams);
  }

  // watch ready
  const stopReady = ref();
  stopReady.value = watch(
    ready,
    val => {
      hasTriggerReady.value = true;
      if (val && tempReadyParams.value) {
        finalRun(...defaultParams);
        stopReady.value();
      }
    },
    {
      flush: 'sync',
    },
  );

  // watch refreshDeps
  const refresh = () => finalRun(...queryState.params!);
  if (refreshDeps.length) {
    watch(refreshDeps, () => {
      !manual && refresh();
    });
  }

  // subscribe polling
  if (!pollingWhenHidden) {
    subscriber('VISIBLE_LISTENER', () => {
      if (pollingHiddenFlag.value) {
        pollingHiddenFlag.value = false;
        refresh();
      }
    });
  }

  return reactive({
    ...toRefs(queryState),
    refresh,
    run: finalRun,
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
