# Testing Setup Guide

## Overview

The talawa-plugin repository uses [Vitest](https://vitest.dev/) as the testing framework. This guide covers how to set up and configure testing in the repository.

## Prerequisites

- Node.js 24.x or higher
- pnpm 10.x or higher

## Installation

All testing dependencies are already included in `package.json`. To install them:

```bash
pnpm install
```

## Testing Dependencies

The following packages are used for testing:

- `vitest@4.0.15` - Test framework
- `@vitest/coverage-v8@4.0.15` - Code coverage provider
- `@vitest/ui@4.0.15` - Interactive test UI

## Vitest Configuration

The test configuration is defined in `vitest.config.ts` at the repository root.

### Key Configuration Features

**Test Environment:** Node.js (for platform and API tests)

**Thread Pooling:**
- CI: Up to 12 threads (auto-adjusted based on CPU count)
- Local: Up to 16 threads (auto-adjusted based on CPU count)
- Ensures optimal performance without over-subscription

**Test File Patterns:**
- `__tests__/**/*.{test,spec}.{js,ts}` - Platform tests
- `plugins/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}` - Plugin-specific tests

**Coverage Configuration:**
- Provider: v8 (faster than istanbul)
- Reporters: text, lcov, html, json
- Output directory: `./coverage/vitest`
- Thresholds: 60% lines, 60% functions, 50% branches, 60% statements

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
pnpm test __tests__/platform/manifestValidation.test.ts

# Run all platform tests
pnpm test __tests__/platform
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
├── __tests__/              # Platform infrastructure tests
│   ├── platform/
│   │   ├── manifestValidation.test.ts
│   │   ├── generator.test.ts
│   │   └── packaging.test.ts
│   └── utils/              # Shared test utilities
│       └── testUtils.ts
├── plugins/
│   └── [PluginName]/
│       ├── admin/
│       │   └── __tests__/  # Admin UI tests
│       └── api/
│           └── __tests__/  # API/backend tests
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
