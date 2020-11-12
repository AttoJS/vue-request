const presets = ['@babel/preset-env'];
const plugins = ['@vue/babel-plugin-jsx'];

if (process.env.NODE_ENV === 'test') {
  plugins.push('@babel/plugin-transform-runtime');
} else {
  plugins.push([
    '@babel/plugin-transform-runtime',
    {
      corejs: 3,
    },
  ]);
}

module.exports = {
  presets,
  plugins,
};
