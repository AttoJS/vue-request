/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type { import('webpack').Configuration }
 */
const WebpackConfig = {
  mode: 'development',
  target: 'web',
  entry: {
    app: './example/main.ts',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)/,
        exclude: /node_modules/,
        use: ['babel-loader', 'ts-loader'],
      },
      {
        test: /\.(js|jsx)/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      'vue-request': path.join(__dirname, '../src/index.ts'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../example/index.html'),
    }),
  ],
  devServer: {
    open: true,
    overlay: true,
  },
};

module.exports = WebpackConfig;
