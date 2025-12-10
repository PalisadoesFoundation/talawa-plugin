# Testing Setup Guide

## Overview

The talawa-plugin repository uses [Vitest](https://vitest.dev/) as the testing framework. This guide covers how to set up and configure testing in the repository.

## Prerequisites

- Node.js 24.x (as used in CI - see [`.github/workflows/pull-request.yml`](../../.github/workflows/pull-request.yml))
- pnpm 10.x or higher (see [`package.json`](../../package.json) `packageManager` field)

## Installation

All testing dependencies are already included in `package.json`. To install them:

```bash
pnpm install
```

## Testing Dependencies

The following packages are used for testing:

- `vitest` - Test framework
- `@vitest/coverage-v8` - Code coverage provider
- `@vitest/ui` - Interactive test UI

See [`package.json`](../../package.json) for current versions.

## Vitest Configuration

The test configuration is defined in `vitest.config.ts` at the repository root.

### Key Configuration Features

**Test Environment:** Node.js (for platform and API tests)

**Thread Pooling:**
- CI: Up to 12 threads (auto-adjusted based on CPU count)
- Local: Up to 16 threads (auto-adjusted based on CPU count)
- Ensures optimal performance without over-subscription

**Test File Patterns:**
- `test/**/*.{test,spec}.{js,jsx,ts,tsx}` - Platform tests
- `plugins/**/test/**/*.{test,spec}.{js,jsx,ts,tsx}` - Plugin-specific tests

**Coverage Configuration:**
- Provider: v8 (faster than istanbul)
- Reporters: text, lcov, html, json
- Output directory: `./coverage/vitest`
- Excludes: node_modules, dist, coverage, docs, config files, scripts/docs, scripts/githooks
- Current Thresholds:
  - Lines: 60%
  - Functions: 60%
  - Branches: 50%
  - Statements: 60%
- Note: Platform infrastructure tests achieve >95% coverage for tested modules; thresholds will be gradually increased as more tests are added

## Available Test Scripts

```bash
# Run all tests
pnpm test

# Run tests with coverage report
pnpm test:coverage

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Run tests with interactive UI
pnpm test:ui

# Run specific test file
pnpm test test/platform/manifestValidation.test.ts

# Run all platform tests
pnpm test test/platform
```

## Coverage Reports

After running `pnpm test:coverage`, coverage reports are generated in:

- `coverage/vitest/index.html` - Interactive HTML report (open in browser)
- `coverage/vitest/lcov.info` - LCOV format (for CodeCov and CI)
- Console output - Summary in terminal

To view the HTML report:

```bash
# Linux/Mac
open coverage/vitest/index.html

# Or use a local server
npx serve coverage/vitest
```

## Test Organization

```
talawa-plugin/
├── test/                  # Platform infrastructure tests
│   ├── platform/
│   │   ├── manifestValidation.test.ts
│   │   ├── generator.test.ts
│   │   └── packaging.test.ts
│   └── utils/              # Shared test utilities
│       └── testUtils.ts
├── plugins/
│   ├── Razorpay/
│   │   ├── admin/
│   │   │   └── test/           # Admin UI tests
│   │   └── api/
│   │       └── test/           # API/backend tests
└── vitest.config.ts        # Test configuration
```

## Troubleshooting

### Tests not running

Ensure vitest is installed:
```bash
pnpm install
```

### Coverage not generated

Run with the coverage flag:
```bash
pnpm test:coverage
```

### TypeScript errors in tests

Ensure `@types/node` is installed and tsconfig.json is properly configured.

### Slow test execution

- Use `pnpm test:watch` for incremental testing during development
- Tests run in parallel by default (thread pooling)
- CI uses optimized thread count based on available CPUs

## Next Steps

- Read [Getting Started Guide](./getting-started.md) to write your first test
- Read [Platform Tests Guide](./platform-tests.md) to understand platform testing patterns
