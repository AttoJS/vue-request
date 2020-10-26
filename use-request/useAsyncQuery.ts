import DefaultConfig, { Config } from './config';
import createQuery, { QueryState, Request } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends any[], R> = QueryState<P, R>;

function useAsyncQuery<P extends any[], R>(
  queryMethod: Request<P, R>,
  options: Config<P, R>,
): BaseResult<P, R> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const { defaultParams, manual } = mergeConfig;
  const query = createQuery(queryMethod, mergeConfig);

  if (!manual) {
    query.run(...defaultParams);
  }

  return query;
}

export default useAsyncQuery;
