import * as fs from 'fs';
import * as path from 'path';
import { PluginManifest } from './types';
import { ValidationResult } from './validateManifest';

interface ExtensionPoint {
    type?: string;
    name?: string;
    file?: string;
    builderDefinition?: string;
    [key: string]: unknown;
}

/**
 * Validates extension points in a plugin manifest.
 *
 * Checks:
 * 1. Schema validation (required fields, types)
 * 2. File existence
 * 3. Function exports (files must export the builderDefinition)
 * 4. Name collision
 */
export async function validateExtensionPoints(
    manifest: PluginManifest,
    pluginRoot: string,
): Promise<ValidationResult> {
    const errors: string[] = [];
    const extensionPoints = manifest.extensionPoints;

    if (!extensionPoints) {
        return { valid: true, errors: [] };
    }

    const registeredNames = new Set<string>();

    for (const [pointId, extensions] of Object.entries(extensionPoints)) {
        if (!Array.isArray(extensions)) {
            errors.push(`Extension point "${pointId}" must be an array`);
            continue;
        }

        for (const ext of extensions as ExtensionPoint[]) {
            // 1. Schema Validation
            if (!ext.name) {
                errors.push(`Missing "name" in extension point "${pointId}"`);
            } else {
                if (registeredNames.has(ext.name)) {
                    errors.push(`Duplicate extension name "${ext.name}" found`);
                }
                registeredNames.add(ext.name);
            }

            // Specific checks for known extension point types (e.g., api:graphql)
            if (pointId.startsWith('api:')) {
                if (!ext.type) {
                    errors.push(
                        `Missing "type" in extension point "${pointId}" (entry: ${ext.name})`,
                    );
                } else if (
                    pointId === 'api:graphql' &&
                    !['query', 'mutation', 'subscription', 'type'].includes(ext.type)
                ) {
                    errors.push(
                        `Invalid graphql type "${ext.type}" for extension "${ext.name}". local type must be one of: query, mutation, subscription, type`,
                    );
                }

                if (ext.file) {
                    // 2. File Existence
                    const filePath = path.join(pluginRoot, ext.file);
                    if (!fs.existsSync(filePath)) {
                        errors.push(
                            `File "${ext.file}" not found for extension "${ext.name}"`,
                        );
                    } else {
                        // 3. Function Exports
                        if (ext.builderDefinition) {
                            try {
                                const fileContent = fs.readFileSync(filePath, 'utf-8');
                                // Robust regex to check for named exports
                                // Handles: export const foo = ..., export function foo ..., export { foo }
                                const exportRegex = new RegExp(
                                    `export\\s+(const|function|async\\s+function|class)\\s+${ext.builderDefinition}\\b|export\\s*{[^}]*\\b${ext.builderDefinition}\\b[^}]*}`,
                                );

                                if (!exportRegex.test(fileContent)) {
                                    errors.push(
                                        `Function "${ext.builderDefinition}" is not exported from "${ext.file}"`,
                                    );
                                }
                            } catch (e) {
                                errors.push(`Error reading file "${ext.file}": ${e}`);
                            }
                        }
                    }
                } else if (pointId === 'api:graphql' || pointId === 'api:rest') {
                    // File is required for code-based extensions
                    errors.push(`Missing "file" for extension "${ext.name}"`);
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
