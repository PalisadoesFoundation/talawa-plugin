
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { validateExtensionPoints } from '../../scripts/utils/validateExtensionPoints';

// Mocks
vi.mock('fs/promises');

describe('Extension Point Validation Refinements', () => {
    const mockPluginRoot = '/mock/plugin/root';

    beforeEach(() => {
        vi.resetAllMocks();
        (fs.resolve as any) = (p: string) => p; // Simple resolve mock
        (fs.realpath as any) = vi.fn((p) => Promise.resolve(p));
        (fs.access as any) = vi.fn(() => Promise.resolve());
    });

    describe('admin:menu validation', () => {
        it('should ignore non-string titles for extension name inference', async () => {
            const manifest = {
                extensionPoints: {
                    'admin:menu': [
                        {
                            // No name
                            title: 12345, // Non-string title
                            path: '/some/path',
                        },
                    ],
                },
            };

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            // specific error message might vary based on lack of name, but it definitely shouldn't crash or use 12345 as name
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Missing "name" (or "title") in extension point "admin:menu"');
        });

        it('should use string title for extension name inference', async () => {
            const manifest = {
                extensionPoints: {
                    'admin:menu': [
                        {
                            // No name
                            title: "My Menu",
                            path: "/some/path",
                            icon: "icon"
                        },
                    ],
                },
            };

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            expect(result.valid).toBe(true);
        });
    });

    describe('Type validation', () => {
        it('should fail if file is not a string', async () => {
            const manifest = {
                extensionPoints: {
                    'api:rest': [
                        {
                            name: 'my-api',
                            type: 'query',
                            file: 123, // Invalid
                        },
                    ],
                },
            };

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid type for "file"'))).toBe(true);
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
                    ],
                },
            };

            // Mock file access for the 'valid' file part
            (fs.readFile as any) = vi.fn(() => Promise.resolve('export const 123 = () => {}'));


            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('Invalid type for "builderDefinition"'))).toBe(true);
        });
    });

    describe('Export Regex Validation', () => {
        it('should NOT match "export type"', async () => {
            const manifest = {
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
            (fs.readFile as any) = vi.fn(() => Promise.resolve('export type MyType = {};'));

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            // It should be invalid because "export type" is no longer allowed/matched
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Function "MyType" is not exported from "api.ts"');
        });

        it('should match "export const"', async () => {
            const manifest = {
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

            (fs.readFile as any) = vi.fn(() => Promise.resolve('export const myFunc = () => {};'));

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            expect(result.valid).toBe(true);
        });

        it('should not match partial identifiers with strict boundary', async () => {
            const manifest = {
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
            (fs.readFile as any) = vi.fn(() => Promise.resolve('export const myFunc$ = () => {};'));

            const result = await validateExtensionPoints(manifest as any, mockPluginRoot);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Function "myFunc" is not exported from "api.ts"');
        });
    });
});
