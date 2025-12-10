import { PluginManifest, SEMVER_SIMPLE_REGEX } from './types';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateManifest(manifest: unknown): ValidationResult {
    const errors: string[] = [];

    // Type guard for basic object structure
    if (!manifest || typeof manifest !== 'object') {
        return { valid: false, errors: ['Manifest must be an object'] };
    }

    const m = manifest as Partial<PluginManifest>;

    // Required fields
    if (!m.name) errors.push('Missing required field: name');
    if (!m.pluginId) errors.push('Missing required field: pluginId');
    if (!m.version) errors.push('Missing required field: version');
    if (!m.description) errors.push('Missing required field: description');
    if (!m.author) errors.push('Missing required field: author');

    // Field types
    if (m.name && typeof m.name !== 'string') {
        errors.push('Field "name" must be a string');
    }
    if (m.pluginId && typeof m.pluginId !== 'string') {
        errors.push('Field "pluginId" must be a string');
    }
    if (m.version && typeof m.version !== 'string') {
        errors.push('Field "version" must be a string');
    }
    if (m.description && typeof m.description !== 'string') {
        errors.push('Field "description" must be a string');
    }
    if (m.author && typeof m.author !== 'string') {
        errors.push('Field "author" must be a string');
    }

    // PluginId format (lowercase with hyphens/underscores)
    if (m.pluginId && !/^[a-z0-9-_]+$/.test(m.pluginId)) {
        errors.push('Field "pluginId" must be lowercase with hyphens or underscores only');
    }

    // Version format (semantic versioning)
    if (m.version && !SEMVER_SIMPLE_REGEX.test(m.version)) {
        errors.push('Field "version" must follow semantic versioning (e.g., 1.0.0)');
    }

    // Optional fields
    if (m.main !== undefined && typeof m.main !== 'string') {
        errors.push('Field "main" must be a string when provided');
    }
    if (m.icon !== undefined && typeof m.icon !== 'string') {
        errors.push('Field "icon" must be a string when provided');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
