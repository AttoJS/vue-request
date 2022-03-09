import { inject, onUnmounted } from 'vue-demi';

import { getGlobalOptions, GLOBAL_OPTIONS_PROVIDE_KEY } from './config';
import createQuery from './createQuery';
import type {
  BaseOptions,
  GlobalOptions,
  PluginImplementType,
  Service,
} from './types';

function useQuery<R, P extends unknown[]>(
  service: Service<R, P>,
  options: BaseOptions<R, P>,
  plugins: PluginImplementType<R, P>[],
) {
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
    queryInstance.run(...params);
  }

  onUnmounted(() => {
    queryInstance.cancel();
  });

  return {
    loading: queryInstance.loading,
    data: queryInstance.data,
    error: queryInstance.error,
    params: queryInstance.params,
    cancel: queryInstance.cancel,
    refresh: queryInstance.refresh,
    mutate: queryInstance.mutate,
    run: queryInstance.run,
  };
}

export default useQuery;
