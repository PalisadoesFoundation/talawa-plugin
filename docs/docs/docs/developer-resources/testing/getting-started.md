---
id: getting-started
title: Testing - Getting Started
slug: /developer-resources/testing/getting-started
sidebar_position: 16
---

# Getting Started with Testing

## Quick Start

### Run all tests
```bash
pnpm test
```

### Run tests in watch mode (recommended for development)
```bash
pnpm test:watch
```

### Run with coverage
```bash
pnpm test:coverage
```

## Writing Your First Test

Create a test file with `.test.ts` or `.test.tsx` extension:

```typescript
// test/example.test.ts
import { describe, it, expect } from 'vitest';

describe('My First Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run it:
```bash
pnpm test test/example.test.ts
```

## Common Test Patterns

### Testing manifest files
```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const manifestPath = join(process.cwd(), 'plugins/MyPlugin/admin/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

expect(manifest.pluginId).toBeDefined();
```

### Testing with temporary directories
```typescript
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tempDir = mkdtempSync(join(tmpdir(), 'test-'));
try {
  // Your test logic
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
```

## Test Commands Reference

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm test:ui` | Open interactive UI |
| `pnpm test [file]` | Run specific test file |
| `pnpm test [directory]` | Run all tests in directory |

## Tips for Effective Testing

1. **Use watch mode** during development for instant feedback
2. **Write descriptive test names** that explain what's being tested
3. **Keep tests focused** - one concept per test
4. **Clean up after tests** - remove temporary files/directories
5. **Check coverage** to identify untested code paths

## Next Steps

- Read [Platform Tests Guide](platform-tests) for platform-specific patterns
- Read [Setup Guide](setup) for detailed configuration
