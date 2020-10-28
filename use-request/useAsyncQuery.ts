import { watch } from 'vue';
import DefaultConfig, { Config } from './config';
import createQuery, { QueryState, Request } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<P extends any[], R> = QueryState<P, R>;

function useAsyncQuery<P extends any[], R>(
  queryMethod: Request<P, R>,
  options: Config<P, R>,
): BaseResult<P, R> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const { defaultParams, manual, ready, refreshDeps } = mergeConfig;
  const query = createQuery(queryMethod, mergeConfig);

  if (!manual) {
    query.run(...defaultParams);
  }

  // @ts-ignore
  const stopReady = watch(ready!, val => val && query.run(...defaultParams) && stopReady());

  // refreshDeps change
  watch(refreshDeps ?? [], () => {
    if (!manual) {
      query.refresh();
    }
  });

  return query;
}

export default useAsyncQuery;
