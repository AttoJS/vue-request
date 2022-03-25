import useCachePlugin from './core/plugins/useCachePlugin';
import useDebouncePlugin from './core/plugins/useDebouncePlugin';
import useErrorRetryPlugin from './core/plugins/useErrorRetryPlugin';
import useLoadingDelayPlugin from './core/plugins/useLoadingDelayPlugin';
import usePollingPlugin from './core/plugins/usePollingPlugin';
import useReadyPlugin from './core/plugins/useReadyPlugin';
import useRefreshDepsPlugin from './core/plugins/useRefreshDepsPlugin';
import useRefreshOnWindowFocus from './core/plugins/useRefreshOnWindowFocus';
import useThrottlePlugin from './core/plugins/useThrottlePlugin';
import type { Options, QueryResult, Service } from './core/types';
import useQuery from './core/useQuery';

function useRequest<R, P extends unknown[] = any>(
  service: Service<R, P>,
  options?: Options<R, P>,
): QueryResult<R, P> {
  return useQuery<R, P>(service, options, [
    useLoadingDelayPlugin,
    useErrorRetryPlugin,
    useDebouncePlugin,
    usePollingPlugin,
    useThrottlePlugin,
    useRefreshOnWindowFocus,
    useRefreshDepsPlugin,
    useReadyPlugin,
    useCachePlugin,
  ]);
}

export default useRequest;
