import { Config } from './config';
import { createQuery } from './createQuery';

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
  // const queriesList = reactive<Record<string, QueryState<P, R>>>({});
  const query = createQuery(queryMethod, options);
  console.log(query);
  const run = (...args: P) => {
    query.run?.(...args);
  };
  // @ts-ignore
  return query;
}

export default useAsyncQuery;
