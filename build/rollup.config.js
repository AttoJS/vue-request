import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';

import pkg from '../package.json';

/**
 * @type { import('rollup').RollupOptions }
 */
const RollUpConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.module,
      format: 'esm',
    },
    {
      name: 'VueRequest',
      file: pkg.main,
      format: 'commonjs',
      exports: 'named',
    },
    {
      name: 'VueRequest',
      file: pkg.unpkg,
      format: 'umd',
      exports: 'named',
      extend: true,
      plugins: [terser()],
      globals: {
        vue: 'Vue',
      },
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript2({
      tsconfigOverride: {
        exclude: [
          'node_modules',
          '**/__tests__/**/*',
          'examples',
          'scripts',
          'patches',
        ],
      },
    }),
    babel({
      extensions: ['js', 'ts', 'tsx'],
      babelHelpers: 'runtime',
      configFile: './babel.config.js',
      exclude: [/core-js/],
    }),
  ],
  external: ['vue', 'vue-demi'],
};

export default RollUpConfig;
