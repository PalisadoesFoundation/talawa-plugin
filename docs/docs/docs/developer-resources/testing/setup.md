---
id: setup
title: Testing - Setup Guide  
slug: /developer-resources/testing/setup
sidebar_position: 18
---

# Testing Setup Guide

Complete guide to setting up and configuring the testing infrastructure.

## Prerequisites

- Node.js 24.x (as used in CI - see [`.github/workflows/pull-request.yml`](https://github.com/PalisadoesFoundation/talawa-plugin/blob/develop/.github/workflows/pull-request.yml))
- pnpm 10.x or higher (see [`package.json`](https://github.com/PalisadoesFoundation/talawa-plugin/blob/develop/package.json) `packageManager` field)

## Installation

Testing dependencies are already included in `package.json`. Refer to the file for current versions.

## Test Configuration

### Framework

We use **Vitest** - a fast, modern test framework compatible with Jest API.

**Key Features:**
- Native ES modules support
- TypeScript support out of the box
- Fast parallel test execution
- Compatible with Jest API

### Test File Patterns

- `test/**/*.{test,spec}.{js,jsx,ts,tsx}` - Platform tests
- `plugins/**/test/**/*.{test,spec}.{js,jsx,ts,tsx}` - Plugin-specific tests

### Coverage Configuration

- Provider: v8 (faster than istanbul)
- Thresholds: Platform tests achieve >95% coverage; overall thresholds set to 60% for gradual improvement

### Threading Configuration

**Dynamic Thread Allocation:**
- CI: 12 threads (85% of CPU cores, min 4)
- Local: 16 threads (100% of CPU cores, min 4)
- Ensures optimal performance without over-subscription

## Running Tests

```bash
# Run all tests
pnpm test

# Run in watch mode (recommended for development)
pnpm test:watch

# Run specific test file
pnpm test test/platform/manifestValidation.test.ts

# Run all platform tests
pnpm test test/platform

# Run with coverage
pnpm test:coverage

# Run with UI
pnpm test:ui
```

## Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
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

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branches
- Manual workflow dispatch

CI Configuration: `.github/workflows/pull-request.yml`

## Troubleshooting

### Tests fail with module not found
```bash
# Reinstall dependencies
pnpm install
```

### Coverage reports not generated
```bash
# Ensure coverage directory is not gitignored
# Run with verbose output
pnpm test:coverage --reporter=verbose
```

### Tests timeout in CI
- CI uses 30s timeout by default
- Configure via `VITEST_TEST_TIMEOUT` env var if needed

## Best Practices

1. **Write tests first** - TDD approach catches issues early
2. **Use descriptive names** - Test names should explain what's being tested
3. **Keep tests isolated** - Each test should be independent
4. **Mock external dependencies** - Don't rely on network or file system
5. **Test edge cases** - Don't just test happy paths
6. **Maintain high coverage** - Aim for 80%+ on new code

## Next Steps

- Read [Getting Started](getting-started) for basic test patterns
- Read [Platform Tests](platform-tests) for platform-specific patterns
- Check out existing tests in `test/platform/` for examples
