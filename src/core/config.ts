import { ref, Ref } from 'vue';
import { State } from './createQuery';

const GLOBAL_OPTIONS: GlobalOptions = {};
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

export type GlobalOptions = {
  loadingDelay?: number;
  pollingInterval?: number;
  pollingWhenHidden?: boolean;
  debounceInterval?: number;
  throttleInterval?: number;
  refreshOnWindowFocus?: boolean;
  focusTimespan?: number;
  cacheTime?: number;
  // -1 mean cache is allway vaild
  staleTime?: number;
  throwOnError?: boolean;
  manual?: boolean;
};

export type BaseOptions<R, P extends unknown[]> = GlobalOptions & {
  defaultParams?: P;
  ready?: Ref<boolean>;
  initialData?: R;
  refreshDeps?: Ref<any>[];
  cacheKey?: string;
  queryKey?: (...args: P) => string;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

export type FormatOptions<R, P extends unknown[], FR> = {
  formatResult: (data: R) => FR;
} & BaseOptions<FR, P>;

export type MixinOptions<R, P extends unknown[], FR> = BaseOptions<R, P> | FormatOptions<R, P, FR>;

export type Config<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'defaultParams' | 'manual' | 'ready' | 'refreshDeps' | 'queryKey'
> & {
  formatResult?: (data: any) => R;
  pollingHiddenFlag: Ref<boolean>;
  initialAutoRunFlag: Ref<boolean>;
  updateCache: (state: State<R, P>) => void;
};
