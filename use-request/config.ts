export type Config<P extends any[]> = {
  defaultParams?: P;
};

const DefaultConfig: Required<Config<any>> = {
  defaultParams: [],
};
export default DefaultConfig;
