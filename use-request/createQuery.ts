import { nextTick, reactive, toRefs, ref } from 'vue';
import { Config } from './config';
import { isFunction } from './utils';
type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;

// P mean params, R mean Response
export type Query<R, P extends unknown[]> = (...args: P) => Promise<R>;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type QueryState<R, P extends unknown[]> = {
  loading: boolean;
  data: R | undefined;
  error: Error | undefined;
  params: P;
  run: (...arg: P) => Promise<R>;
  cancel: () => void;
  refresh: () => Promise<R>;
  mutate: Mutate<R>;
};

export type InnerQueryState<R, P extends unknown[]> = Omit<QueryState<R, P>, 'run'> & {
  run: (args: P, cb?: () => void) => Promise<R>;
};

const setStateBind = <T>(oldState: T) => {
  return (newState: T, cb?: () => void) => {
    Object.keys(newState).forEach(key => {
      oldState[key] = newState[key];
    });
    nextTick(() => {
      cb?.();
    });
  };
};

const createQuery = <R, P extends unknown[]>(
  query: Query<R, P>,
  config: Config<R, P>,
): InnerQueryState<R, P> => {
  const { throwOnError, initialData, loadingDelay, formatResult, onSuccess, onError } = config;

  const state = reactive({
    loading: false,
    data: initialData,
    error: undefined,
    params: ([] as unknown) as P,
  }) as Partial<QueryState<R, P>>;

  const setState = setStateBind(state);
  const count = ref(0);

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

  const _run = (args: P, cb?: () => void) => {
    setState({
      loading: !loadingDelay,
      params: args,
    });

    const cancelDelayLoading = delayLoading();
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
      })
      .finally(() => {
        if (currentCount === count.value) {
          cancelDelayLoading();
          cb?.();
        }
      });
  };

  const run = (args: P, cb?: () => void) => {
    return _run(args, cb);
  };

  const cancel = () => {
    setState({ loading: false });
    count.value += 1;
    return;
  };

  const refresh = () => {
    return run(state.params!);
  };

  const mutate: Mutate<R> = (
    x: Parameters<MutateData<R>>[0] | Parameters<MutateFunction<R>>[0],
  ) => {
    if (isFunction(x)) {
      state.data = x(state.data!);
    } else {
      state.data = x;
    }
  };

  const reactiveState = reactive({
    ...toRefs(state),
    run,
    cancel,
    refresh,
    mutate,
  }) as InnerQueryState<R, P>;

  return reactiveState;
};

export default createQuery;
