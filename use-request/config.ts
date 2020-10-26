export type Config<P extends any[], R> = {
  defaultParams?: P;
  manual?: boolean;
  ready?: boolean;
  throwOnError?: boolean;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

const DefaultConfig: Config<any, any> = {
  manual: false,
  ready: true,
  throwOnError: false,
};
export default DefaultConfig;
