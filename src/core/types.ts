/* istanbul ignore next */

import type { Ref, WatchSource } from 'vue-demi';

import type { LoadMoreExtendsOption } from '../useLoadMore';
import type { PaginationExtendsOption } from '../usePagination';
import type { CacheData } from './utils/cache';
import type { EmitVoid } from './utils/types';

type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;
// P means params, R means Response
export type Service<R, P extends unknown[]> = (...args: P) => Promise<R>;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type State<R, P> = {
  loading: Ref<boolean>;
  data: Ref<R | undefined>;
  error: Ref<Error | undefined>;
  params: Ref<P>;
};

export interface Query<R, P extends unknown[]> extends State<R, P> {
  context: FunctionContext<R, P>;
  plugins: Ref<Partial<PluginType<R, P>>[]>;
}

export interface FunctionContext<R, P extends unknown[]> {
  runAsync: (...arg: P) => Promise<R | null | void>;
  run: (...arg: P) => void;
  cancel: () => void;
  refresh: () => void;
  refreshAsync: () => Promise<R | null | void>;
  mutate: Mutate<R>;
}

export interface QueryResult<R, P extends unknown[]>
  extends State<R, P>,
    FunctionContext<R, P> {}

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}
type ThrottleOptions = Omit<DebounceOptions, 'maxWait'>;

export type GlobalOptions = BaseOptions &
  PaginationExtendsOption &
  LoadMoreExtendsOption;

export type BaseOptions = {
  loadingDelay?: number;
  pollingInterval?: number;
  pollingWhenHidden?: boolean;
  pollingWhenOffline?: boolean;
  debounceInterval?: number | Ref<number>;
  debounceOptions?: DebounceOptions;
  throttleOptions?: ThrottleOptions;
  throttleInterval?: number | Ref<number>;
  refreshOnWindowFocus?: boolean | Ref<boolean>;
  refocusTimespan?: number | Ref<number>;
  cacheTime?: number;
  // -1 means the cache is always valid
  staleTime?: number;
  manual?: boolean;
  // error retry
  errorRetryCount?: number;
  errorRetryInterval?: number;
  // custom cache
  getCache?: (cacheKey: string) => CacheData;
  setCache?: (cacheKey: string, cacheData: CacheData) => void;
};

export type Options<R, P extends unknown[]> = BaseOptions & {
  defaultParams?: P;
  ready?: Ref<boolean>;
  initialData?: R;
  refreshDeps?: WatchSource<any>[];
  cacheKey?: string;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
  onBefore?: (params: P) => void;
  onAfter?: (params: P) => void;
};

export type PluginImplementType<R, P extends any[]> = {
  (queryInstance: Query<R, P>, config: Options<R, P>): Partial<
    PluginType<R, P>
  >;
};

export type PluginType<R, P extends unknown[]> = {
  onBefore: (
    params: P,
  ) => {
    isBreak?: Boolean;
    breakResult?: any;
  } | void;

  onQuery: (
    service: Service<R, P>,
    params: P,
  ) => {
    servicePromise?: Promise<R>;
  };

  onSuccess(data: R, params: P): void;
  onError(error: Error, params: P): void;
  onAfter(params: P, data: R, error: Error): void;
  onCancel(): void;
  onMutate(data: R): void;
};

export type EmitResults<R, P extends unknown[]> = EmitVoid<
  ReturnType<PluginType<R, P>['onBefore']>
> &
  EmitVoid<ReturnType<PluginType<R, P>['onQuery']>>;
