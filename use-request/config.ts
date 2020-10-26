export type Config<P extends any[], R> = {
  defaultParams?: P;
  manual?: boolean;
  ready?: boolean;
  onSuccess?: (data: R, params: P) => void;
  onError?: (error: Error, params: P) => void;
};

const DefaultConfig: Required<Config<any, any>> = {
  defaultParams: [],
  manual: false,
  ready: true,
  onSuccess: () => {},
  onError: () => {},
};
export default DefaultConfig;
