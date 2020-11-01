import { ref, Ref } from 'vue';

export type BaseOptions<R, P extends unknown[]> = {
  defaultParams?: P;
  manual?: boolean;
  ready?: Ref<boolean>;
  throwOnError?: boolean;
  initialData?: R;
  refreshDeps?: Ref<any>[];
  loadingDelay?: number;
  pollingInterval?: number;
  // TODO: 正确处理 formatResult 返回值类型和普通请求返回值类型
  formatResult?: (data: any) => R;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

export type Config<R, P extends unknown[]> = Omit<
  BaseOptions<R, P>,
  'defaultParams' | 'manual' | 'ready' | 'refreshDeps'
> & {};

const DefaultOptions: BaseOptions<any, any> = {
  defaultParams: [],
  manual: false,
  ready: ref(true),
  throwOnError: false,
  refreshDeps: [],
  loadingDelay: 0,
};
export default DefaultOptions as Required<BaseOptions<any, any>>;
