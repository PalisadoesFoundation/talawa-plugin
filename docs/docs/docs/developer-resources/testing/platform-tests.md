---
id: platform-tests
title: Testing - Platform Tests
slug: /developer-resources/testing/platform-tests
sidebar_position: 17
---

# Platform Tests

Platform tests validate the core plugin infrastructure and tooling.

## Test Location

All platform tests are in `test/platform/`:

```
test/platform/
├── manifestValidation.test.ts  # Manifest schema validation
├── generator.test.ts           # Plugin scaffolding tests
└── packaging.test.ts           # Packaging & zip creation tests
```

## Running Platform Tests

```bash
# Run all platform tests
pnpm test test/platform

# Run specific platform test
pnpm test test/platform/manifestValidation.test.ts
```

## Manifest Validation Tests

Tests in `manifestValidation.test.ts` validate plugin manifest files.

### What's Tested

- **Core Schema**: Required fields (name, pluginId, version, description, author)
- **Format Validation**: pluginId format, semantic versioning
- **Extension Points**: Structure and types of extension points
- **Real Manifests**: Validates actual plugin manifests (Razorpay, Plugin Map)

### Example Test

```typescript
it('should validate Razorpay admin manifest', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  
  const result = validateManifest(manifest);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

## Generator Tests

Tests in `generator.test.ts` validate plugin scaffolding creation.

### What's Tested

- **Admin module creation**: Verifies all admin plugin files are created
- **API module creation**: Verifies all API plugin files are created
- **File structure**: Checks nested directories and files
- **Cleanup**: Ensures temporary directories are removed

### Example Test Structure

```typescript
it('should create admin module structure', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));
  
  try {
    createAdminSkeleton('TestPlugin', tempDir);
    
    expect(existsSync(join(tempDir, 'TestPlugin/admin/index.tsx'))).toBe(true);
    expect(existsSync(join(tempDir, 'TestPlugin/admin/manifest.json'))).toBe(true);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
```

## Packaging Tests

Tests in `packaging.test.ts` validate plugin packaging and zip creation.

### What's Tested

- **Development builds**: Creates and validates dev zips
- **Production builds**: Creates and validates prod zips  
- **Manifest inclusion**: Verifies manifests are in zip
- **Zip integrity**: Tests zip file validity and structure
- **File filtering**: Ensures junk files are excluded

### Key Testing Patterns

```typescript
it('should create development build zip', () => {
  const zipPath = join(tempTestDir, 'test-plugin-dev.zip');
  createZip('test-plugin', tempTestDir, { production: false });
  
  expect(existsSync(zipPath)).toBe(true);
  expect(statSync(zipPath).size).toBeGreaterThan(0);
});
```

## Coverage Standards

Platform tests should maintain **80%+ coverage** as they form the foundation for all plugin testing.

Current stats: Run `pnpm test:coverage test/platform` to see latest coverage.

## Adding New Platform Tests

When adding platform functionality:

1. Create test file in `test/platform/`
2. Follow naming convention: `[feature].test.ts`
3. Test both success and failure cases
4. Clean up temporary files/directories
5. Update this documentation

## Next Steps

- Read [Setup Guide](setup) for test configuration details
- Read [Getting Started](getting-started) for basic test patterns
