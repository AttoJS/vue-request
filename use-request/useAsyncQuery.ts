import { reactive, toRefs, watch } from 'vue';
import DefaultConfig, { Config } from './config';
import createQuery, { QueryState, Request } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends any[]> = QueryState<R, P>;

function useAsyncQuery<R, P extends any[]>(
  queryMethod: Request<R, P>,
  options: Config<R, P>,
): BaseResult<R, P> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const { defaultParams, manual, ready, refreshDeps } = mergeConfig;
  const query = createQuery(queryMethod, mergeConfig);

  if (!manual) {
    query.run(defaultParams);
  }

  // @ts-ignore
  const stopReady = watch(ready!, val => val && query.run(defaultParams) && stopReady());

  // refreshDeps change
  watch(refreshDeps ?? [], () => {
    if (!manual) {
      query.refresh();
    }
  });

  return reactive({
    ...toRefs(query),
    run: (...args: P) => {
      return query.run(args);
    },
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
