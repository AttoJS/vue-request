import { ref, Ref } from 'vue';

export type Config<P extends any[], R> = {
  defaultParams?: P;
  manual?: boolean;
  ready?: Ref<boolean>;
  throwOnError?: boolean;
  initialData?: R;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

const DefaultConfig: Config<any, any> = {
  defaultParams: [],
  manual: false,
  ready: ref(true),
  throwOnError: false,
};
export default DefaultConfig;
