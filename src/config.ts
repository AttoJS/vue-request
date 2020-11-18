import { ref, Ref } from 'vue';
import { State } from './createQuery';

const GLOBAL_OPTIONS: GlobalOptions = {};
export const SetGlobalOptions = (config: GlobalOptions) => {
  Object.keys(config).forEach(key => {
    GLOBAL_OPTIONS[key] = config[key];
  });
};

export const GetGlobalOptions = () => {
  return GLOBAL_OPTIONS;
};

export const ClearGlobalOptions = () => {
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
  // TODO: 正确处理 formatResult 返回值类型和普通请求返回值类型
  formatResult?: (data: any) => R;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

export type Config<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'defaultParams' | 'manual' | 'ready' | 'refreshDeps' | 'queryKey'
> & {
  pollingHiddenFlag: Ref<boolean>;
  initialAutoRunFlag: Ref<boolean>;
  updateCache: (state: State<R, P>) => void;
};

const DefaultOptions: BaseOptions<any, any> = {
  defaultParams: [],
  manual: false,
  ready: ref(true),
  throwOnError: false,
  refreshDeps: [],
  loadingDelay: 0,
  pollingWhenHidden: false,
  refreshOnWindowFocus: false,
  focusTimespan: 5000,
  cacheTime: 10000,
  staleTime: 0,
};
export default DefaultOptions as Required<BaseOptions<any, any>>;
