import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as checkI18n from '../../scripts/check-i18n.js';
import fs from 'fs';
import path from 'path';

vi.mock('fs');
vi.mock('child_process');

describe('check-i18n', () => {
    describe('parseArgs', () => {
        it('should parse files argument', () => {
            const args = ['file1.ts', 'file2.tsx'];
            const result = checkI18n.parseArgs(args);
            expect(result.files).toEqual(['file1.ts', 'file2.tsx']);
            expect(result.diffOnly).toBe(false);
        });

        it('should parse --diff flag', () => {
            const args = ['--diff'];
            const result = checkI18n.parseArgs(args);
            expect(result.diffOnly).toBe(true);
        });

        it('should parse --staged flag', () => {
            const args = ['--staged'];
            const result = checkI18n.parseArgs(args);
            expect(result.staged).toBe(true);
            expect(result.diffOnly).toBe(true);
        });

        it('should parse --base and --head arguments', () => {
            const args = ['--base=main', '--head=feat-branch'];
            const result = checkI18n.parseArgs(args);
            expect(result.base).toBe('main');
            expect(result.head).toBe('feat-branch');
        });

        it('should parse --base and --head arguments with spaces', () => {
            const args = ['--base', 'main', '--head', 'feat-branch'];
            const result = checkI18n.parseArgs(args);
            expect(result.base).toBe('main');
            expect(result.head).toBe('feat-branch');
        });
    });

    describe('stripComments', () => {
        it('should remove single-line comments', () => {
            const code = 'const a = 1; // comment';
            expect(checkI18n.stripComments(code).trim()).toBe('const a = 1;');
        });

        it('should remove block comments', () => {
            const code = 'const a = 1; /* comment */';
            const result = checkI18n.stripComments(code);
            // It replaces with newlines to preserve line numbers if multiline, 
            // but inline block comments might just be stripped.
            // The implementation seems to replace block comments with nothing?
            // Wait, let's verify implementation behavior from previous read.
            // "replaces block comment content with newlines"
            // If single line block comment: /* comment */ -> if it contains newlines, they are kept.
            expect(result).toContain('const a = 1;');
            expect(result).not.toContain('comment');
        });

        it('should preserve line numbers for multiline block comments', () => {
            const code = '/*\nLine 2\n*/\nconst a = 1;';
            const result = checkI18n.stripComments(code);
            const lines = result.split('\n');
            expect(lines.length).toBe(4);
            expect(lines[3]).toBe('const a = 1;');
        });

        it('should not remove comments inside strings', () => {
            const code = 'const s = "// comment";';
            expect(checkI18n.stripComments(code)).toBe(code);
        });

        it('should not remove comments inside template literals', () => {
            const code = 'const s = `// comment`;';
            expect(checkI18n.stripComments(code)).toBe(code);
        });
    });

    describe('isInSkipContext', () => {
        it('should return true for console.log', () => {
            const line = 'console.log("Hello")';
            expect(checkI18n.isInSkipContext(line, line.indexOf('"Hello"'))).toBe(true);
        });

        it('should return true for throw Error', () => {
            const line = 'throw new Error("Err")';
            expect(checkI18n.isInSkipContext(line, line.indexOf('"Err"'))).toBe(true);
        });
    });

    describe('looksLikeUrl', () => {
        it('should detect http/https urls', () => {
            expect(checkI18n.looksLikeUrl('https://example.com')).toBe(true);
            expect(checkI18n.looksLikeUrl('http://example.com')).toBe(true);
        });

        it('should detect relative paths', () => {
            expect(checkI18n.looksLikeUrl('/path/to/resource')).toBe(true);
        });

        it('should not detect normal text', () => {
            expect(checkI18n.looksLikeUrl('Hello World')).toBe(false);
        });
    });

    describe('countWords', () => {
        it('should count words correctly', () => {
            expect(checkI18n.countWords('Hello World')).toBe(2);
            expect(checkI18n.countWords('Hello')).toBe(1);
            expect(checkI18n.countWords('123')).toBe(0);
        });
    });

    describe('collectViolations', () => {
        // We need to mock fs.readFileSync

        it('should detect hardcoded text in JSX', () => {
            const filePath = '/path/to/file.tsx';
            const content = '<div>Hello World</div>';
            vi.spyOn(fs, 'readFileSync').mockReturnValue(content);

            const violations = checkI18n.collectViolations(filePath);
            expect(violations).toHaveLength(1);
            expect(violations[0].text).toBe('Hello World');
        });

        it('should ignore i18n-ignore-line', () => {
            const filePath = '/path/to/file.tsx';
            const content = '<div>Hello World</div> // i18n-ignore-line';
            vi.spyOn(fs, 'readFileSync').mockReturnValue(content);

            const violations = checkI18n.collectViolations(filePath);
            expect(violations).toHaveLength(0);
        });
    });
});
