import { provide } from 'vue-demi';

import { GLOBAL_OPTIONS_PROVIDE_KEY } from './core/config';
import type { GlobalOptions } from './core/types';

export default (config: GlobalOptions) => {
  provide(GLOBAL_OPTIONS_PROVIDE_KEY, config);
};
