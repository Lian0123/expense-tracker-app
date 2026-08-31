module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: ['src/lib/**/*.{ts,tsx}', '!src/lib/seed.ts'],
  coverageThreshold: {
    global: { branches: 85, functions: 90, lines: 90, statements: 90 },
    './src/lib/amount.ts': { branches: 95, functions: 95, lines: 95, statements: 95 },
    './src/lib/repository.ts': { branches: 95, functions: 95, lines: 95, statements: 95 },
    './src/lib/schema.ts': { branches: 95, functions: 95, lines: 95, statements: 95 },
    './src/lib/transfer.ts': { branches: 95, functions: 95, lines: 95, statements: 95 },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js'],
};
