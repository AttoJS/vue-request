module.exports = {
  moduleFileExtensions: ['js', 'ts', 'jsx', 'tsx'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverage: process.env.COVERAGE === 'true',
  collectCoverageFrom: ['use-request/**/*.{ts,tsx}', '!**/node_modules/**'],
  globals: {
    'ts-jest': {
      babelConfig: true,
    },
  },
};
