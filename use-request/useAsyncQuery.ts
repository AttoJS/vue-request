import { reactive, toRefs, watch, ref } from 'vue';
import DefaultConfig, { BaseConfig } from './config';
import createQuery, { QueryState, Request } from './createQuery';

const QUERY_DEFAULT_KEY = 'QUERY_DEFAULT_KEY';

export type BaseResult<R, P extends any[]> = QueryState<R, P>;

function useAsyncQuery<R, P extends any[]>(
  queryMethod: Request<R, P>,
  options: BaseConfig<R, P>,
): BaseResult<R, P> {
  const mergeConfig = { ...DefaultConfig, ...options };
  const { defaultParams, manual, ready, refreshDeps } = mergeConfig;
  const query = createQuery(queryMethod, mergeConfig);

  if (!manual) {
    query.run(defaultParams);
  }

  if (!ready.value) {
    const stopReady = ref();
    stopReady.value = watch(ready, val => val && query.run(defaultParams) && stopReady.value(), {
      flush: 'sync',
    });
  }

  // refreshDeps change
  if (refreshDeps.length) {
    watch(refreshDeps, () => {
      if (!manual) {
        query.refresh();
      }
    });
  }

  return reactive({
    ...toRefs(query),
    run: (...args: P) => {
      return query.run(args);
    },
  }) as QueryState<R, P>;
}

export default useAsyncQuery;
