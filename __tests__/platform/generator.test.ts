import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAdminSkeleton } from '../../scripts/init/initAdmin';
import { createAPISkeleton } from '../../scripts/init/initApi';

describe('Plugin Generator', () => {
    describe('Admin Module Generation', () => {
        it('should create admin module structure', () => {
            const tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));

            try {
                createAdminSkeleton('TestPlugin', tempDir);

                // Check if admin directory exists
                expect(existsSync(join(tempDir, 'TestPlugin/admin'))).toBe(true);

                // Check if essential files exist
                expect(existsSync(join(tempDir, 'TestPlugin/admin/index.tsx'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/manifest.json'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/info.json'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/README.md'))).toBe(true);

                // Check if directories and nested files exist
                expect(existsSync(join(tempDir, 'TestPlugin/admin/pages'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/pages/index.tsx'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/assets'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/assets/placeholder.txt'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/injector'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/injector/IconInjector.tsx'))).toBe(true);
            } finally {
                // Cleanup
                if (existsSync(tempDir)) {
                    rmSync(tempDir, { recursive: true, force: true });
                }
            }
        });
    });

    describe('API Module Generation', () => {
        it('should create api module structure', () => {
            const tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));

            try {
                createAPISkeleton('TestPlugin', tempDir);

                // Check if api directory exists
                expect(existsSync(join(tempDir, 'TestPlugin/api'))).toBe(true);

                // Check if essential files exist
                expect(existsSync(join(tempDir, 'TestPlugin/api/index.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/manifest.json'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/README.md'))).toBe(true);

                // Check if nested directories and files exist
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql/inputs.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql/queries.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql/mutations.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql/types.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/database'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/database/tables.ts'))).toBe(true);
            } finally {
                // Cleanup
                if (existsSync(tempDir)) {
                    rmSync(tempDir, { recursive: true, force: true });
                }
            }
        });
    });
});
