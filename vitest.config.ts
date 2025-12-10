import { cpus } from 'node:os';
import { defineConfig } from 'vitest/config';

const isCI = !!process.env.CI;
const cpuCount = cpus().length;

const MAX_CI_THREADS = 12;
const MAX_LOCAL_THREADS = 16;

const ciThreads = Math.min(
  MAX_CI_THREADS,
  Math.max(4, Math.floor(cpuCount * 0.85)),
);

const localThreads = Math.min(MAX_LOCAL_THREADS, Math.max(4, cpuCount));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.{test,spec}.{js,ts}', 'plugins/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'docs/**',
      '**/*.d.ts',
      'plugin-zips/**',
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: isCI ? ciThreads : localThreads,
        isolate: true,
      },
    },
    maxConcurrency: isCI ? ciThreads : localThreads,
    fileParallelism: true,
    sequence: {
      shuffle: false,
      concurrent: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json'],
      reportsDirectory: './coverage/vitest',
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        'docs/**',
        '**/*.d.ts',
        '**/*.{test,spec}.{js,ts,tsx}',
        'plugin-zips/**',
        'scripts/**',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
  },
});
