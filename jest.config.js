module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.spec.(js|jsx|ts|tsx)',
  ],
};
