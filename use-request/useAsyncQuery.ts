/* eslint-disable @typescript-eslint/no-use-before-define */
import { reactive, toRefs, Ref, ToRefs, watchEffect, toRaw } from 'vue';
import { Config } from './config';
// import Query, { Request, QueryState } from './query';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends unknown[], R> = QueryState<P, R>;
export type Request<P extends unknown[], R> = (...args: P) => Promise<R>;
export type Mutate<R> = (newData: R) => void | ((arg: (oldData: R) => R) => void);
export type QueryState<P extends unknown[], R> = {
  loading: boolean;
  data: R | undefined;
  error: Error | undefined;
  params: P;
  run: (...arg: P) => Promise<R>;
  // cancel: () => void;
  // refresh: () => Promise<R>;
  // mutate: Mutate<R>;
};

function useAsyncQuery<P extends unknown[], R>(
  queryMethod: Request<P, R>,
  options: Config,
): BaseResult<P, R> {
  const data = reactive({ text: undefined });
  const _run = (...args: P): Promise<R> => {
    state.loading = true;
    return queryMethod(...args)
      .then(res => {
        data.text = res as any;
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
        console.log('finally');
      });
  };
  const run = (...args: P) => {
    return _run(...args);
  };
  const state = reactive<QueryState<P, R>>({
    loading: false,
    data: undefined,
    error: undefined,
    params: [] as any,
    run: run,
  });
  // @ts-ignore
  return { state, data };
}

export default useAsyncQuery;
