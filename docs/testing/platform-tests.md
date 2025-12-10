# Platform Infrastructure Tests

## Overview

Platform tests validate the core plugin system infrastructure:
- Manifest validation
- Plugin generator
- Plugin packager

## Test Location

All platform tests are in `__tests__/platform/`:

```
__tests__/platform/
├── manifestValidation.test.ts  # Manifest schema and structure tests
├── generator.test.ts           # Plugin scaffold generation tests
└── packaging.test.ts           # Plugin packaging/zip tests
```

## Running Platform Tests

```bash
# Run all platform tests
pnpm test __tests__/platform

# Run specific platform test
pnpm test __tests__/platform/manifestValidation.test.ts
```

## Manifest Validation Tests

Tests in `manifestValidation.test.ts` validate:

- Manifest files exist and are valid JSON
- Required fields (name, pluginId, version, description, author)
- Version format (semantic versioning: X.Y.Z)
- Extension point structure and schemas
- Consistency between admin and API manifests

**Example usage:**
```typescript
const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
expect(manifest.pluginId).toBe('razorpay');
expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
```

## Generator Tests

Tests in `generator.test.ts` validate:

- Admin module scaffold creation
- API module scaffold creation
- Proper directory structure
- Essential files created (index.tsx/ts, manifest.json)

**Example pattern:**
```typescript
const tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));
createAdminSkeleton('TestPlugin', tempDir);
expect(existsSync(join(tempDir, 'TestPlugin/admin/index.tsx'))).toBe(true);
```

## Packaging Tests

Tests in `packaging.test.ts` validate:

- Plugin structure identification
- Required files for packaging
- Packaging script availability

## Adding New Platform Tests

When adding platform functionality:

1. Create test file in `__tests__/platform/`
2. Follow naming convention: `[feature].test.ts`
3. Test both success and failure cases
4. Clean up temporary files/directories
5. Document patterns in this guide

## Coverage Target

Platform tests should maintain **80%+ coverage** as they form the foundation for all plugin testing.

Current stats: Run `pnpm test:coverage __tests__/platform` to see latest coverage.
