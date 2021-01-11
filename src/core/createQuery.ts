import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { computed, nextTick, Ref, ref } from 'vue';
import { Config } from './config';
import { Queries } from './useAsyncQuery';
import {
  isDocumentVisibility,
  isFunction,
  isNil,
  isOnline,
  resolvedPromise,
} from './utils';
import { UnWrapRefObject } from './utils/types';
type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;

// P means params, R means Response
export type Query<R, P extends unknown[]> = (...args: P) => Promise<R>;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type State<R, P extends unknown[]> = {
  loading: Ref<boolean>;
  data: Ref<R | undefined>;
  error: Ref<Error | undefined>;
  params: Ref<P>;
};

// common run result | debounce and throttle result
export type InnerRunReturn<R> = Promise<R | null>;

export type QueryState<R, P extends unknown[]> = State<R, P> & {
  queries: Queries<R, P>;
  run: (...arg: P) => InnerRunReturn<R>;
  cancel: () => void;
  refresh: () => InnerRunReturn<R>;
  mutate: Mutate<R>;
};

export type InnerQueryState<R, P extends unknown[]> = Omit<
  QueryState<R, P>,
  'queries'
>;

const setStateBind = <R, P extends unknown[], T extends State<R, P>>(
  oldState: T,
  publicCb: Array<(state: T) => void>,
) => {
  return (newState: Partial<UnWrapRefObject<State<R, P>>>) => {
    Object.keys(newState).forEach(key => {
      oldState[key].value = newState[key];
    });
    nextTick(() => {
      publicCb.forEach(fun => fun(oldState));
    });
  };
};

const createQuery = <R, P extends unknown[]>(
  query: Query<R, P>,
  config: Config<R, P>,
  initialState?: UnWrapRefObject<State<R, P>>,
): InnerQueryState<R, P> => {
  const {
    initialAutoRunFlag,
    initialData,
    loadingDelay,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    pollingWhenHidden,
    pollingWhenOffline,
    errorRetryCount,
    errorRetryInterval,
    stopPollingWhenHiddenOrOffline,
    updateCache,
    formatResult,
    onSuccess,
    onError,
  } = config;

  const retriedCount = ref(0);
  const loading = ref(initialState?.loading ?? false);
  const data = ref(initialState?.data ?? initialData) as Ref<R>;
  const error = ref(initialState?.error);
  const params = ref(initialState?.params ?? []) as Ref<P>;

  const setState = setStateBind(
    {
      loading,
      data,
      error,
      params,
    },
    [state => updateCache(state)],
  );

  // reset retried count
  const resetRetriedCount = () => {
    retriedCount.value = 0;
  };

  const count = ref(0);
  const pollingTimer = ref();
  const retryTimer = ref();
  const delayLoadingTimer = ref();

  const clearAllTimer = () => {
    // clear pollingTimer
    if (pollingTimer.value) {
      pollingTimer.value();
    }

    // clear delayLoadingTimer
    if (delayLoadingTimer.value) {
      delayLoadingTimer.value();
    }

    // clear retryTimer
    if (retryTimer.value) {
      retryTimer.value();
    }
  };

  const delayLoading = () => {
    let timerId: number;

    if (loadingDelay) {
      timerId = setTimeout(setState, loadingDelay, {
        loading: true,
      });
    }

    return () => timerId && clearTimeout(timerId);
  };

  const polling = (pollingFunc: () => void) => {
    // if errorRetry is enabled, then skip this method
    if (error.value && errorRetryCount !== 0) return;

    let timerId: number;
    if (!isNil(pollingInterval) && pollingInterval! >= 0) {
      if (
        (pollingWhenHidden || isDocumentVisibility()) &&
        (pollingWhenOffline || isOnline())
      ) {
        timerId = setTimeout(pollingFunc, pollingInterval);
      } else {
        // stop polling
        stopPollingWhenHiddenOrOffline.value = true;
        return;
      }
    }

    return () => timerId && clearTimeout(timerId);
  };

  const actualErrorRetryInterval = computed(() => {
    if (errorRetryInterval) return errorRetryInterval;
    const baseTime = 1000;
    const minCoefficient = 1;
    const maxCoefficient = 9;
    // When retrying for the first time, in order to avoid the coefficient being 0
    // so replace 0 with 2, the coefficient range will become 1 - 2
    const coefficient = Math.floor(
      Math.random() * 2 ** Math.min(retriedCount.value, maxCoefficient) +
        minCoefficient,
    );
    return baseTime * coefficient;
  });

  const errorRetryHooks = (retryFunc: () => void) => {
    let timerId: number;
    const isInfiniteRetry = errorRetryCount === -1;
    const hasRetryCount = retriedCount.value < errorRetryCount;

    // if errorRetryCount is -1, it will retry the request until it success
    if (error.value && (isInfiniteRetry || hasRetryCount)) {
      if (!isInfiniteRetry) retriedCount.value += 1;
      timerId = setTimeout(retryFunc, actualErrorRetryInterval.value);
    }
    return () => timerId && clearTimeout(timerId);
  };

  const _run = (...args: P) => {
    setState({
      loading: !loadingDelay,
      params: args,
    });

    delayLoadingTimer.value = delayLoading();
    count.value += 1;
    const currentCount = count.value;

    return query(...args)
      .then(res => {
        if (currentCount === count.value) {
          const formattedResult = formatResult ? formatResult(res) : res;

          setState({
            data: formattedResult,
            loading: false,
            error: undefined,
          });

          if (onSuccess) {
            onSuccess(formattedResult, args);
          }

          resetRetriedCount();
          return formattedResult;
        }
        return resolvedPromise;
      })
      .catch(error => {
        if (currentCount === count.value) {
          setState({
            data: undefined,
            loading: false,
            error: error,
          });
          if (onError) {
            onError(error, args);
          }

          console.error(error);
        }
        return resolvedPromise;
      })
      .finally(() => {
        if (currentCount === count.value) {
          // clear delayLoadingTimer
          delayLoadingTimer.value();

          // retry
          retryTimer.value = errorRetryHooks(() => _run(...args));

          // run for polling
          pollingTimer.value = polling(() => _run(...args));
        }
      });
  };

  const debouncedRun =
    !isNil(debounceInterval) && debounce(_run, debounceInterval);
  const throttledRun =
    !isNil(throttleInterval) && throttle(_run, throttleInterval);

  const run = (...args: P) => {
    clearAllTimer();
    // initial auto run should not debounce
    if (!initialAutoRunFlag.value && debouncedRun) {
      debouncedRun(...args);
      return resolvedPromise;
    }

    if (throttledRun) {
      throttledRun(...args);
      return resolvedPromise;
    }
    resetRetriedCount();

    return _run(...args);
  };

  const cancel = () => {
    count.value += 1;
    setState({ loading: false });

    if (debouncedRun) {
      debouncedRun.cancel();
    }
    if (throttledRun) {
      throttledRun.cancel();
    }

    clearAllTimer();
  };

  const refresh = () => {
    return run(...params.value);
  };

  const mutate: Mutate<R> = (
    x: Parameters<MutateData<R>>[0] | Parameters<MutateFunction<R>>[0],
  ) => {
    const mutateData = isFunction(x) ? x(data.value) : x;
    setState({
      data: mutateData,
    });
  };

  return {
    loading,
    data,
    error,
    params,
    run,
    cancel,
    refresh,
    mutate,
  };
};

export default createQuery;
