import dts from 'rollup-plugin-dts';

import pkg from '../package.json';
import RollUpConfig from './rollup.config';

/**
 * @type { import('rollup').RollupOptions }
 */
const TypesConfig = {
  input: RollUpConfig.input,
  output: [{ file: pkg.types, format: 'esm' }],
  plugins: [dts()],
};

export default TypesConfig;
