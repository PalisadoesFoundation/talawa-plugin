import { describe, it, expect } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAdminSkeleton } from '../../scripts/init/initAdmin';
import { createAPISkeleton } from '../../scripts/init/initApi';

describe('Plugin Generator', () => {
    let tempDir: string;

    describe('Admin Module Generation', () => {
        it('should create admin module structure', () => {
            tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));

            try {
                createAdminSkeleton('TestPlugin', tempDir);

                // Check if admin directory exists
                expect(existsSync(join(tempDir, 'TestPlugin/admin'))).toBe(true);

                // Check if essential files exist
                expect(existsSync(join(tempDir, 'TestPlugin/admin/index.tsx'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/admin/manifest.json'))).toBe(true);

                // Check if directories exist
                expect(existsSync(join(tempDir, 'TestPlugin/admin/pages'))).toBe(true);
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
            tempDir = mkdtempSync(join(tmpdir(), 'plugin-test-'));

            try {
                createAPISkeleton('TestPlugin', tempDir);

                // Check if api directory exists
                expect(existsSync(join(tempDir, 'TestPlugin/api'))).toBe(true);

                // Check if essential files exist
                expect(existsSync(join(tempDir, 'TestPlugin/api/index.ts'))).toBe(true);
                expect(existsSync(join(tempDir, 'TestPlugin/api/manifest.json'))).toBe(true);

                // Check if directories exist
                expect(existsSync(join(tempDir, 'TestPlugin/api/graphql'))).toBe(true);
            } finally {
                // Cleanup
                if (existsSync(tempDir)) {
                    rmSync(tempDir, { recursive: true, force: true });
                }
            }
        });
    });
});
