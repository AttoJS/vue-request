import { reactive } from 'vue';
import { Config } from './config';
// P mean params, R mean Response
export type Request<P extends unknown[], R> = (...args: P) => Promise<R>;
export type Mutate<R> = (newData: R) => void | ((arg: (oldData: R) => R) => void);
export type QueryState<P extends unknown[], R> = {
  loading: boolean;
  data: R | undefined;
  error: Error | undefined;
  params: P;
  run: (...arg: P) => Promise<R>;
  cancel: () => void;
  refresh: () => Promise<R>;
  mutate: Mutate<R>;
};

export const createQuery = <P extends unknown[], R>(request: Request<P, R>, config: Config) => {
  let state: Partial<QueryState<P, R>> = {
    loading: false,
    data: undefined,
    error: undefined,
    params: ([] as unknown) as P,
  };
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return run(...state.params!);
  };

  const mutate = (mutate: any | ((x: any) => any)) => {
    if (typeof mutate === 'function') {
      state.data = mutate(state.data);
    } else {
      state.data = mutate;
    }
  };

  state = reactive({
    ...state,
    run,
    cancel,
    refresh,
    mutate,
  }) as QueryState<P, R>;

  return state;
};
