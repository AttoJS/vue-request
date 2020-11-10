module.exports = {
  presets: [['@babel/preset-env', {
    targets: {
      browsers: [
        'last 2 versions',
        'Firefox ESR',
        '> 1%',
        'ie >= 11',
        'iOS >= 8',
        'Android >= 4',
      ],
    },
  }]],
  plugins: [
    '@vue/babel-plugin-jsx',
    '@babel/plugin-transform-runtime'
  ],
};
