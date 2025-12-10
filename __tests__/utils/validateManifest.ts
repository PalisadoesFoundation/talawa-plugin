export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateManifest(manifest: any): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!manifest.name) errors.push('Missing required field: name');
    if (!manifest.pluginId) errors.push('Missing required field: pluginId');
    if (!manifest.version) errors.push('Missing required field: version');
    if (!manifest.description) errors.push('Missing required field: description');
    if (!manifest.author) errors.push('Missing required field: author');

    // Field types
    if (manifest.name && typeof manifest.name !== 'string') {
        errors.push('Field "name" must be a string');
    }
    if (manifest.pluginId && typeof manifest.pluginId !== 'string') {
        errors.push('Field "pluginId" must be a string');
    }
    if (manifest.version && typeof manifest.version !== 'string') {
        errors.push('Field "version" must be a string');
    }
    if (manifest.description && typeof manifest.description !== 'string') {
        errors.push('Field "description" must be a string');
    }
    if (manifest.author && typeof manifest.author !== 'string') {
        errors.push('Field "author" must be a string');
    }

    // PluginId format (lowercase with hyphens/underscores)
    if (manifest.pluginId && !/^[a-z0-9-_]+$/.test(manifest.pluginId)) {
        errors.push('Field "pluginId" must be lowercase with hyphens or underscores only');
    }

    // Version format (semantic versioning)
    if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        errors.push('Field "version" must follow semantic versioning (e.g., 1.0.0)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
