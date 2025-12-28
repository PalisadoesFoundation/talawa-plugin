import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  mkdtempSync,
  readFileSync,
  cpSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as childProcess from 'node:child_process';

// Mock child_process to prevent actual execution during tests
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  execFileSync: vi.fn(),
}));

// Mock @clack/prompts spinner since runValidationTests uses it
vi.mock('@clack/prompts', () => ({
  spinner: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// Import the function under test
// Note: We use relative path from test file to source file
// scripts/zip/validation.ts is the new home for this logic
import { runValidationTests } from '../../../../scripts/zip/validation.ts';

describe('Zip Script - restoreBackup()', () => {
  let testDir: string;
  let pluginPath: string;
  let backupPath: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'zip-test-'));
    pluginPath = join(testDir, 'test-plugin');
    backupPath = `${pluginPath}.backup`;
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should restore plugin from backup when backup exists', async () => {
    // Create original plugin directory
    mkdirSync(pluginPath, { recursive: true });
    writeFileSync(join(pluginPath, 'original.txt'), 'original');

    // Create backup directory
    mkdirSync(backupPath, { recursive: true });
    writeFileSync(join(backupPath, 'backup.txt'), 'backup content');
    writeFileSync(join(backupPath, 'original.txt'), 'restored original');

    // Simulate failure by removing plugin dir
    rmSync(pluginPath, { recursive: true, force: true });

    // Simulate compilation failure handler logic
    if (existsSync(backupPath)) {
      // Logic mirrors what compilesProduction does: cpSync(backupPath, pluginPath)
      cpSync(backupPath, pluginPath, { recursive: true });
    }

    expect(existsSync(pluginPath)).toBe(true);
    expect(existsSync(join(pluginPath, 'backup.txt'))).toBe(true);
    expect(readFileSync(join(pluginPath, 'original.txt'), 'utf-8')).toBe(
      'restored original',
    );
  });

  it('should handle case when backup does not exist', () => {
    mkdirSync(pluginPath, { recursive: true });
    // Backup doesn't exist
    expect(existsSync(backupPath)).toBe(false);
    expect(existsSync(pluginPath)).toBe(true);
  });

  it.todo('should handle file operation errors gracefully');
});

describe('Zip Script - runValidationTests()', () => {
  let testPluginName: string;
  let testPluginDir: string;

  beforeEach(() => {
    testPluginName = 'testPlugin';
    testPluginDir = join(process.cwd(), 'test', 'plugins', testPluginName);
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (existsSync(testPluginDir)) {
      rmSync(testPluginDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  describe('Plugin Name Validation', () => {
    it('should accept valid plugin names', async () => {
      const validNames = ['valid-name', 'valid_name', 'ValidName123'];

      for (const name of validNames) {
        const dir = join(process.cwd(), 'test', 'plugins', name);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'example.test.ts'), '');

        try {
          await expect(runValidationTests(name, false)).resolves.not.toThrow();
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      }
    });

    it('should reject invalid plugin names', async () => {
      const invalidNames = [
        'test/plugin',
        'test\\plugin', // Backslash
        'test plugin',
        '../../../etc/passwd',
        'plugin!',
      ];

      for (const name of invalidNames) {
        await expect(runValidationTests(name, false)).rejects.toThrow(
          /Invalid plugin name/,
        );
      }
    });
  });

  describe('Test File Detection & Execution', () => {
    it('should detect tests and execute vitest', async () => {
      mkdirSync(testPluginDir, { recursive: true });
      writeFileSync(join(testPluginDir, 'my.test.ts'), '');

      await runValidationTests(testPluginName, false);

      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['exec', 'vitest', 'run', 'test/platform/']),
        expect.any(Object),
      );
      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining([
          'exec',
          'vitest',
          'run',
          expect.stringContaining(testPluginName),
        ]),
        expect.any(Object),
      );
    });

    it('should handle nested test directories', async () => {
      const nested = join(testPluginDir, 'sub', 'folder');
      mkdirSync(nested, { recursive: true });
      writeFileSync(join(nested, 'deep.spec.tsx'), '');

      await runValidationTests(testPluginName, false);

      expect(childProcess.execFileSync).toHaveBeenCalled();
    });

    it('should ignore non-test files', async () => {
      mkdirSync(testPluginDir, { recursive: true });
      writeFileSync(join(testPluginDir, 'index.ts'), '');
      writeFileSync(join(testPluginDir, 'README.md'), '');

      // Should throw because no tests found
      await expect(runValidationTests(testPluginName, false)).rejects.toThrow(
        /No test files found/,
      );

      // Should NOT have run plugin tests
      // Should have run platform tests but NOT plugin tests
      expect(childProcess.execFileSync).toHaveBeenCalledTimes(1);
      expect(childProcess.execFileSync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['exec', 'vitest', 'run', 'test/platform/']),
        expect.any(Object),
      );
    });
  });

  describe('Skip Tests Flag Behavior', () => {
    it('should allow packaging without tests when skip flag is set', async () => {
      // Create dir strictly without tests
      mkdirSync(testPluginDir, { recursive: true });
      writeFileSync(join(testPluginDir, 'index.ts'), '');

      // Should not throw, should just warn (which we can catch via spy or just ensure no throw)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        runValidationTests(testPluginName, true),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEPRECATION WARNING'),
      );
    });

    it('should block packaging without tests when skip flag is NOT set', async () => {
      mkdirSync(testPluginDir, { recursive: true });
      writeFileSync(join(testPluginDir, 'index.ts'), '');

      await expect(runValidationTests(testPluginName, false)).rejects.toThrow(
        /No test files found/,
      );
    });
  });
});

describe('Zip Script - Integration Behavior', () => {
  it.todo('should execute platform tests before plugin tests'); // Marked as todo as requested
});
