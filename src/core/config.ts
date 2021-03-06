import { LoadMoreExtendsOption } from 'src/useLoadMore';
import { PaginationExtendsOption } from 'src/usePagination';
import { InjectionKey, Ref, WatchSource } from 'vue';
import { State } from './createQuery';

const GLOBAL_OPTIONS: GlobalOptions = {};

export const GLOBAL_OPTIONS_PROVIDE_KEY: InjectionKey<GlobalOptions> = Symbol(
  'GLOBAL_OPTIONS_PROVIDE_KEY',
);

export const setGlobalOptions = (config: GlobalOptions) => {
  Object.keys(config).forEach(key => {
    GLOBAL_OPTIONS[key] = config[key];
  });
};

export const getGlobalOptions = () => {
  return GLOBAL_OPTIONS;
};

export const clearGlobalOptions = () => {
  Object.keys(GLOBAL_OPTIONS).forEach(key => {
    delete GLOBAL_OPTIONS[key];
  });
};

export interface GlobalOptions
  // usePagination config
  extends PaginationExtendsOption,
    // useLoadMore config
    LoadMoreExtendsOption {
  loadingDelay?: number;
  pollingInterval?: number;
  pollingWhenHidden?: boolean;
  pollingWhenOffline?: boolean;
  debounceInterval?: number;
  throttleInterval?: number;
  refreshOnWindowFocus?: boolean;
  refocusTimespan?: number;
  cacheTime?: number;
  // -1 means the cache is always valid
  staleTime?: number;
  manual?: boolean;
  // error retry
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

export type BaseOptions<R, P extends unknown[]> = GlobalOptions & {
  defaultParams?: P;
  ready?: Ref<boolean>;
  initialData?: R;
  refreshDeps?: WatchSource<any>[];
  cacheKey?: string;
  queryKey?: (...args: P) => string;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

export type FormatOptions<R, P extends unknown[], FR> = {
  formatResult: (data: R) => FR;
} & BaseOptions<FR, P>;

export type MixinOptions<R, P extends unknown[], FR> =
  | BaseOptions<R, P>
  | FormatOptions<R, P, FR>;

export type Config<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'defaultParams' | 'manual' | 'ready' | 'refreshDeps' | 'queryKey'
> &
  Required<
    Pick<
      BaseOptions<R, P>,
      | 'loadingDelay'
      | 'pollingWhenHidden'
      | 'pollingWhenOffline'
      | 'refreshOnWindowFocus'
      | 'errorRetryCount'
      | 'errorRetryInterval'
    >
  > & {
    stopPollingWhenHiddenOrOffline: Ref<boolean>;
    initialAutoRunFlag: Ref<boolean>;
    formatResult?: (data: any) => R;
    updateCache: (state: State<R, P>) => void;
  };
