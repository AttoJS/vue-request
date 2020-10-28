import { nextTick, reactive, toRefs } from 'vue';
import { Config } from './config';
// P mean params, R mean Response
export type Request<P extends any[], R> = (...args: P) => Promise<R>;
type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type QueryState<P extends any[], R> = {
  loading: boolean;
  data: R | undefined;
  error: Error | undefined;
  params: P;
  run: (...arg: P) => Promise<R>;
  cancel: () => void;
  refresh: () => Promise<R>;
  mutate: Mutate<R>;
};

export type InnerQueryState<P extends any[], R> = Omit<QueryState<P, R>, 'run'> & {
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

// export let tempReadyParams: any[] = [];

const createQuery = <P extends any[], R>(
  request: Request<P, R>,
  config: Config<P, R>,
): InnerQueryState<P, R> => {
  const {
    throwOnError,
    initialData,
    ready,
    loadingDelay,
    formatResult,
    onSuccess,
    onError,
  } = config;

  const state = reactive({
    loading: false,
    data: initialData,
    error: undefined,
    params: ([] as unknown) as P,
  }) as Partial<QueryState<P, R>>;

  const setState = setStateBind(state);

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

    return request(...args)
      .then(res => {
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
      })
      .catch(error => {
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
      })
      .finally(() => {
        cancelDelayLoading();
        cb?.();
      });
  };

  const run = (args: P, cb?: () => void) => {
    if (!ready?.value) {
      return;
    }
    return _run(args, cb);
  };

  const cancel = () => {
    return;
  };

  const refresh = () => {
    return run(state.params!);
  };

  const mutate: Mutate<R> = (
    x: Parameters<MutateData<R>>[0] | Parameters<MutateFunction<R>>[0],
  ) => {
    if (x instanceof Function) {
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
  }) as InnerQueryState<P, R>;

  return reactiveState;
};

export default createQuery;
