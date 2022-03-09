import type { InjectionKey } from 'vue-demi';

import type { GlobalOptions } from './types';

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
