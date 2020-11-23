import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';

/**
 * @type { import('rollup').RollupOptions }
 */
const RollUpConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: './dist/index.es.js',
      format: 'esm',
    },
    {
      name: 'VueRequest',
      file: './dist/index.cjs.js',
      format: 'commonjs',
      exports: 'named',
    },
    {
      name: 'VueRequest',
      file: './dist/vue-request.min.js',
      format: 'iife',
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
        exclude: ['node_modules', '**/__tests__/**/*', 'example', 'script'],
      },
      useTsconfigDeclarationDir: true,
    }),
    babel({
      extensions: ['js', 'ts'],
      babelHelpers: 'runtime',
      configFile: './babel.config.js',
      exclude: [/core-js/],
    }),
  ],
  external: ['vue'],
};
export default RollUpConfig;
