import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { validateExtensionPoints } from '../utils/validateExtensionPoints';
import { PluginManifest } from '../utils/types';
import { validManifest } from '../utils/fixtures';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

describe('validateExtensionPoints', () => {
  const mockPluginRoot = '/mock/plugin/root';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
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

  it('should validate file existence', async () => {
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

    // Mock file not found
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'File "query.ts" not found for extension "myQuery"',
    );
  });

  it('should validate function exports', async () => {
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

    // Mock file exists
    vi.mocked(fs.existsSync).mockReturnValue(true);
    // Mock file content missing export
    vi.mocked(fs.readFileSync).mockReturnValue('const foo = "bar";');

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Function "myQuery" is not exported from "query.ts"',
    );
  });

  it('should pass given valid file and export', async () => {
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

    vi.mocked(fs.existsSync).mockReturnValue(true);
    // Mock correct export
    vi.mocked(fs.readFileSync).mockReturnValue(
      'export const myQuery = () => {};',
    );

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect duplicate names', async () => {
    const manifest: PluginManifest = {
      ...validManifest,
      extensionPoints: {
        'api:graphql': [
          {
            type: 'query',
            name: 'duplicateName',
            file: 'query1.ts',
            builderDefinition: 'query1',
          },
          {
            type: 'mutation',
            name: 'duplicateName',
            file: 'query2.ts',
            builderDefinition: 'query2',
          },
        ],
      },
    };

    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      'export const query1 = {}; export const query2 = {};',
    );

    const result = await validateExtensionPoints(manifest, mockPluginRoot);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Duplicate extension name "duplicateName" found',
    );
  });
});
