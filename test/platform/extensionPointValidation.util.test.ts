import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { validateExtensionPoints } from '../../scripts/utils/validateExtensionPoints';
import { PluginManifest } from '../../scripts/utils/types';
import { validManifest } from '../utils/fixtures';

// Mock fs.promises
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      access: vi.fn(),
      readFile: vi.fn(),
      realpath: vi.fn((path) => Promise.resolve(path)),
    },
  };
});

describe('validateExtensionPoints - Utilities & General', () => {
  const mockPluginRoot = '/mock/plugin/root';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return valid for empty extensionPoints', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: undefined,
    };
    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should invalidate non-array extensionPoints', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': 'not-an-array' as any,
      },
    };

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Extension point "api:graphql" must be an array',
    );
  });

  it('should invalidate if extensionPoints is an array', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: [] as any,
    };

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('"extensionPoints" must be an object');
  });

  it('should invalidate extensions without file', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'myQuery',
            builderDefinition: 'myQuery',
            // Missing file field
          } as any,
        ],
      },
    };

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing "file" for extension'),
      ]),
    );
  });

  it('should invalidate extensions without name', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            file: 'query.ts',
            builderDefinition: 'myQuery',
            // Missing name field
          } as any,
        ],
      },
    };

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Missing "name"');
  });

  it('should handle file read errors gracefully', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'myQuery',
            file: 'query.ts',
            builderDefinition: 'myQuery',
          },
        ],
      },
    };

    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('Error reading file');
    expect(result.errors[0]).toContain('Permission denied');
  });

  it('should invalidate extension with non-existent file', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'myQuery',
            file: 'missing.ts',
            builderDefinition: 'myQuery',
          },
        ],
      },
    };

    // fs.access throws by default if not mocked to resolve, or we can mock rejection
    vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('found for extension');
  });

  it('should invalidate paths attempting traversal outside plugin root', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'maliciousQuery',
            file: '../secrets.txt',
            builderDefinition: 'myQuery',
          },
        ],
      },
    };

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('is outside plugin root'),
      ]),
    );
    // Ensure no FS access was attempted for the traversal path
    expect(vi.mocked(fs.access)).not.toHaveBeenCalled();
  });

  it('should invalidate symlinks pointing outside plugin root', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'symlinkQuery',
            file: 'symlink.ts',
            builderDefinition: 'myQuery',
          },
        ],
      },
    };

    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue('export const myQuery = {};');

    // Mock realpath to return path outside root for this specific file
    vi.mocked(fs.realpath).mockImplementation(async (p) => {
      if (typeof p === 'string' && p.endsWith('symlink.ts')) {
        return '/outside/root/target.ts';
      }
      return p as string;
    });

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('resolves to outside plugin root'),
      ]),
    );
  });

  describe('Validation Logic Refinements', () => {
    it('should ignore non-string titles for admin:menu extension name inference', async () => {
      const manifest = {
        extensionPoints: {
          'admin:menu': [
            {
              // No name
              title: 12345, // Non-string title
              path: '/some/path',
            },
          ] as any,
        },
      } as unknown as PluginManifest;

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Missing "name" (or "title") in extension point "admin:menu"',
      );
    });

    it('should use string title for admin:menu extension name inference', async () => {
      const manifest: PluginManifest = {
        ...validManifest,
        extensionPoints: {
          'admin:menu': [
            {
              // No name, but valid title
              title: 'My Menu',
              path: '/some/path',
              icon: 'icon',
            },
          ],
        },
      };

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(true);
    });

    it('should fail if file is not a string', async () => {
      const manifest = {
        extensionPoints: {
          'api:rest': [
            {
              name: 'my-api',
              type: 'query',
              file: 123, // Invalid
            },
          ] as any,
        },
      } as unknown as PluginManifest;

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('Invalid type for "file"')),
      ).toBe(true);
    });

    it('should fail if builderDefinition is not a string', async () => {
      const manifest = {
        extensionPoints: {
          'api:rest': [
            {
              name: 'my-api',
              type: 'query',
              file: 'api.ts',
              builderDefinition: 123, // Invalid
            },
          ] as any,
        },
      } as unknown as PluginManifest;

      // Mock valid file read to isolate builderDefinition check
      vi.mocked(fs.readFile).mockResolvedValue('export const 123 = () => {}');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes('Invalid type for "builderDefinition"'),
        ),
      ).toBe(true);
    });

    it('should NOT match "export type" in builderDefinition regex', async () => {
      const manifest: PluginManifest = {
        ...validManifest,
        extensionPoints: {
          'api:rest': [
            {
              name: 'my-api',
              type: 'query',
              file: 'api.ts',
              builderDefinition: 'MyType',
            },
          ],
        },
      };

      // Mock file content with ONLY export type
      vi.mocked(fs.readFile).mockResolvedValue('export type MyType = {};');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Function "MyType" is not exported from "api.ts"',
      );
    });

    it('should match "export const" in builderDefinition regex', async () => {
      const manifest: PluginManifest = {
        ...validManifest,
        extensionPoints: {
          'api:rest': [
            {
              name: 'my-api',
              type: 'query',
              file: 'api.ts',
              builderDefinition: 'myFunc',
            },
          ],
        },
      };

      vi.mocked(fs.readFile).mockResolvedValue(
        'export const myFunc = () => {};',
      );
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(true);
    });

    it('should not match partial identifiers with strict boundary', async () => {
      const manifest: PluginManifest = {
        ...validManifest,
        extensionPoints: {
          'api:rest': [
            {
              name: 'my-api',
              type: 'query',
              file: 'api.ts',
              builderDefinition: 'myFunc',
            },
          ],
        },
      };

      // 'myFunc$' should NOT match 'myFunc' with strict boundary check
      vi.mocked(fs.readFile).mockResolvedValue(
        'export const myFunc$ = () => {};',
      );
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await validateExtensionPoints(manifest, mockPluginRoot);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Function "myFunc" is not exported from "api.ts"',
      );
    });
  });
});
