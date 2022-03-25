import { inject, onUnmounted } from 'vue-demi';

import { getGlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './config';
import createQuery from './createQuery';
import type {
  GlobalOptions,
  Options,
  PluginImplementType,
  QueryResult,
  Service,
} from './types';

function useQuery<R, P extends unknown[]>(
  service: Service<R, P>,
  options: Options<R, P> = {},
  plugins: PluginImplementType<R, P>[] = [],
): QueryResult<R, P> {
  const injectedGlobalOptions = inject<GlobalOptions>(
    GLOBAL_OPTIONS_PROVIDE_KEY,
    {},
  );

  const config = {
    ...getGlobalOptions(),
    ...injectedGlobalOptions,
    ...options,
  };

  const { manual = false, defaultParams = [] } = config;

  const queryInstance = createQuery(service, config);

  queryInstance.plugins.value = plugins.map(i => i(queryInstance, config));

  // initial run
  if (!manual) {
    const params = queryInstance.params.value || defaultParams;
    queryInstance.context.run(...params);
  }

  onUnmounted(() => {
    queryInstance.context.cancel();
  });

  return {
    loading: queryInstance.loading,
    data: queryInstance.data,
    error: queryInstance.error,
    params: queryInstance.params,
    cancel: queryInstance.context.cancel,
    refresh: queryInstance.context.refresh,
    refreshAsync: queryInstance.context.refreshAsync,
    mutate: queryInstance.context.mutate,
    run: queryInstance.context.run,
    runAsync: queryInstance.context.runAsync,
  };
}

export default useQuery;
