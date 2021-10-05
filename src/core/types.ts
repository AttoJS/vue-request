/* istanbul ignore next */

import type { LoadMoreExtendsOption } from 'src/useLoadMore';
import type { PaginationExtendsOption } from 'src/usePagination';
import type { Ref, WatchSource } from 'vue';

import type { UnWrapRefObject } from './utils/types';

export interface BaseResult<R, P extends unknown[]> extends QueryState<R, P> {
  queries: Queries<R, P>;
  reset: () => void;
}

export type UnWrapState<R, P extends unknown[]> = UnWrapRefObject<
  InnerQueryState<R, P>
>;

export type Queries<R, P extends unknown[]> = {
  [key: string]: UnWrapState<R, P>;
};
type MutateData<R> = (newData: R) => void;
type MutateFunction<R> = (arg: (oldData: R) => R) => void;
// P means params, R means Response
export type Query<R, P extends unknown[]> = (...args: P) => Promise<R>;
export interface Mutate<R> extends MutateData<R>, MutateFunction<R> {}

export type State<R, P> = {
  loading: Ref<boolean>;
  data: Ref<R | undefined>;
  error: Ref<Error | undefined>;
  params: Ref<P>;
};

export interface QueryState<R, P extends unknown[]> extends State<R, P> {
  run: (...arg: P) => Promise<R | null>;
  cancel: () => void;
  refresh: () => Promise<R | null>;
  mutate: Mutate<R>;
}

export interface InnerQueryState<R, P extends unknown[]>
  extends QueryState<R, P> {
  unmount: () => void;
}

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}
type ThrottleOptions = Omit<DebounceOptions, 'maxWait'>;

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
  debounceOptions?: DebounceOptions;
  throttleOptions?: ThrottleOptions;
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
  onBefore?: (params: P) => void;
  onAfter?: (params: P) => void;
};

const FRPlaceholderType = Symbol('FR');
export type FRPlaceholderType = typeof FRPlaceholderType;

// temporary fix: https://github.com/AttoJS/vue-request/issues/31
// When `formatResult` and `onSuccess` are used at the same time
// the type of the parameter `data` of `onSuccess` is temporarily set to `any`
export type FormatOptions<R, P extends unknown[], FR> = {
  formatResult: (data: R) => FR;
  onSuccess?: (
    data: FR extends FRPlaceholderType ? any : FR,
    params: P,
  ) => void;
} & Omit<BaseOptions<FR, P>, 'onSuccess'>;

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
