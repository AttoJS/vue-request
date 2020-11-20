import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { nextTick, Ref, ref } from 'vue';
import { Config } from './config';
import { Queries } from './useAsyncQuery';
import { isDocumentVisibilty, isFunction, isNil, resolvedPromise } from './utils';
import { UnWrapRefObject } from './utils/types';
type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;

// P mean params, R mean Response
export type Query<R, P extends unknown[]> = (...args: P) => Promise<R>;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type State<R, P extends unknown[]> = {
  loading: Ref<boolean>;
  data: Ref<R | undefined>;
  error: Ref<Error | undefined>;
  params: Ref<P>;
};

// common run resutl | debounce and throttle result
export type InnerRunReturn<R> = Promise<R | null>;

export type QueryState<R, P extends unknown[]> = State<R, P> & {
  queries: Queries<R, P>;
  run: (...arg: P) => InnerRunReturn<R>;
  cancel: () => void;
  refresh: () => InnerRunReturn<R>;
  mutate: Mutate<R>;
};

export type InnerQueryState<R, P extends unknown[]> = Omit<QueryState<R, P>, 'run' | 'queries'> & {
  run: (args: P, cb?: () => void) => InnerRunReturn<R>;
};

const setStateBind = <R, P extends unknown[], T extends State<R, P>>(
  oldState: T,
  publicCb?: Array<(state: T) => void>,
) => {
  return (newState: Partial<UnWrapRefObject<State<R, P>>>, cb?: (state: T) => void) => {
    Object.keys(newState).forEach(key => {
      oldState[key].value = newState[key];
    });
    nextTick(() => {
      cb?.(oldState);
      publicCb?.forEach(fun => fun(oldState));
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
    throwOnError,
    initialData,
    loadingDelay,
    pollingInterval,
    debounceInterval,
    throttleInterval,
    pollingWhenHidden,
    pollingHiddenFlag,
    updateCache,
    formatResult,
    onSuccess,
    onError,
  } = config;

  const loading = ref(initialState?.loading ?? false);
  const data = ref(initialState?.data ?? initialData) as Ref<R>;
  const error = ref(initialState?.error ?? undefined);
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

  const count = ref(0);
  const pollingTimer = ref();
  const delayLoadingTimer = ref();

  const delayLoading = () => {
    let timerId: number;

    if (loadingDelay) {
      timerId = setTimeout(() => {
        setState({
          loading: true,
        });
      }, loadingDelay);
    }

    return () => timerId && clearTimeout(timerId);
  };

  const polling = (pollingFunc: () => void) => {
    let timerId: number;
    if (!isNil(pollingInterval) && pollingInterval! >= 0) {
      // stop polling
      if (!isDocumentVisibilty() && !pollingWhenHidden) {
        pollingHiddenFlag.value = true;
        return;
      }
      timerId = setTimeout(() => {
        pollingFunc();
      }, pollingInterval);
    }

    return () => timerId && clearTimeout(timerId);
  };

  const _run = (args: P, cb?: () => void) => {
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

          if (throwOnError) {
            throw error;
          }
          console.error(error);
          return Promise.reject('已处理的错误');
        }
        return resolvedPromise;
      })
      .finally(() => {
        if (currentCount === count.value) {
          cb?.();
          // clear delayLoadingTimer
          delayLoadingTimer.value();
          // run for polling
          pollingTimer.value = polling(() => _run(args, cb));
        }
      });
  };

  const debouncedRun = !isNil(debounceInterval) && debounce(_run, debounceInterval);
  const throttledRun = !isNil(throttleInterval) && throttle(_run, throttleInterval);

  const run = (args: P, cb?: () => void) => {
    // initial auto run should not debounce
    if (!initialAutoRunFlag.value && debouncedRun) {
      debouncedRun(args, cb);
      return resolvedPromise;
    }

    if (throttledRun) {
      throttledRun(args, cb);
      return resolvedPromise;
    }

    return _run(args, cb);
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

    // clear pollingTimer
    if (pollingTimer.value) {
      pollingTimer.value();
    }

    // clear delayLoadingTimer
    if (delayLoadingTimer.value) {
      delayLoadingTimer.value();
    }
  };

  const refresh = () => {
    return run(params.value);
  };

  const mutate: Mutate<R> = (
    x: Parameters<MutateData<R>>[0] | Parameters<MutateFunction<R>>[0],
  ) => {
    const mutateData = isFunction(x) ? x(data.value) : x;
    setState({
      data: mutateData,
    });
  };

  const reactiveState = {
    loading,
    data,
    error,
    params,
    run,
    cancel,
    refresh,
    mutate,
  };

  return reactiveState;
};

export default createQuery;
