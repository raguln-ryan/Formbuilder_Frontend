// Rename file from jest.config.js to jest.config.cjs
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:5150/api'
      }
    }
  },
  moduleDirectories: ['node_modules', 'src'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/App.jsx',
    '!src/setupTests.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'text-summary'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/'],
  verbose: true
};