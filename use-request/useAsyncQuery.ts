import DefaultConfig, { Config } from './config';
import createQuery, { QueryState } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends any[], R> = QueryState<P, R>;
export type Request<P extends any[], R> = (...args: P) => Promise<R>;

function useAsyncQuery<P extends any[], R>(
  queryMethod: Request<P, R>,
  options: Config<P>,
): BaseResult<P, R> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const query = createQuery(queryMethod, options);
  query.run(...mergeConfig.defaultParams);

  return query;
}

export default useAsyncQuery;
