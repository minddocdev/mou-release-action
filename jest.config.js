const path = require('path');

module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^@minddocdev/mou-release-action/(.*)$': '<rootDir>/src/$1',
    '^@minddocdev/mou-release-action/test/(.*)$': '<rootDir>/test/$1',
  },
  preset: 'ts-jest',
  rootDir: path.resolve(__dirname),
  testEnvironment: require.resolve(`jest-environment-node`),
  testMatch: ['**/*.spec.ts'],
  verbose: true,
};
