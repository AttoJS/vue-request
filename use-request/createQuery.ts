import { reactive, toRefs } from 'vue';
import { Config } from './config';
// P mean params, R mean Response
export type Request<P extends any[], R> = (...args: P) => Promise<R>;
export interface Mutate<R> {
  (newData: R): void;
  (arg: (oldData: R) => R): void;
}
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

const createQuery = <P extends any[], R>(
  request: Request<P, R>,
  config: Config<P>,
): QueryState<P, R> => {
  const state = reactive({
    loading: false,
    data: undefined,
    error: undefined,
    params: ([] as unknown) as P,
  }) as Partial<QueryState<P, R>>;

  const _run = (...args: P) => {
    state.loading = true;
    return request(...args)
      .then(res => {
        state.data = res;
        state.loading = false;
        state.error = undefined;
        return res;
      })
      .catch(error => {
        state.data = undefined;
        state.loading = false;
        state.error = error;

        console.log(error);
        return Promise.reject('已处理的错误');
      })
      .finally(() => {
        console.log('1');
      });
  };

  const run = (...args: P) => {
    console.log(args);
    return _run(...args);
  };

  const cancel = () => {
    return;
  };

  const refresh = () => {
    return run(...state.params!);
  };

  const mutate: Mutate<R> = (x: R | ((y: R) => R)) => {
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
  }) as QueryState<P, R>;

  return reactiveState;
};

export default createQuery;
