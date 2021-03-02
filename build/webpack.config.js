/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
/**
 * @type { import('webpack').Configuration }
 */
const WebpackConfig = {
  mode: 'development',
  devtool: 'eval-source-map',
  target: 'web',
  entry: {
    app: './example/main.ts',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/],
              configFile: path.resolve(__dirname, './tsconfig.webpack.json'),
            },
          },
        ],
      },
      {
        test: /\.(js|jsx)/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(vue)/,
        exclude: /node_modules/,
        use: ['vue-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.vue'],
    alias: {
      'vue-request': path.join(__dirname, '../src/index.ts'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../example/index.html'),
    }),
    new VueLoaderPlugin(),
  ],
  devServer: {
    open: true,
    overlay: true,
    host: '0.0.0.0',
  },
};

module.exports = WebpackConfig;
