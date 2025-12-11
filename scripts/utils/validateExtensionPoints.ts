import { promises as fs } from 'fs';
import * as path from 'path';
import { PluginManifest } from './types';
import { ValidationResult } from './validateManifest';

interface ExtensionPoint {
  type?: string;
  name?: string;
  id?: string;
  file?: string;
  builderDefinition?: string;
  [key: string]: unknown;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

    for (let i = 0; i < extensions.length; i++) {
      const ext = extensions[i] as ExtensionPoint;
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
            `Missing "type" in extension point "${pointId}" (entry: ${ext.name ?? ext.id ?? `index ${i}`})`,
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
          const resolvedPath = path.resolve(pluginRoot, ext.file);
          const normalizedRoot = path.resolve(pluginRoot);

          if (!resolvedPath.startsWith(normalizedRoot)) {
            errors.push(
              `File "${ext.file}" for extension "${ext.name ?? ext.id ?? `index ${i}`}" is outside plugin root`,
            );
          } else {
            try {
              await fs.access(resolvedPath); // Async check for existence

              // 3. Function Exports
              if (ext.builderDefinition) {
                try {
                  const fileContent = await fs.readFile(resolvedPath, 'utf-8');
                  const safeDef = escapeRegExp(ext.builderDefinition);

                  // Robust regex to check for various export styles:
                  // 1. Named: export const/function/class/type name ...
                  // 2. Default: export default function name ...
                  // 3. Re-export: export { name } from ...
                  // 4. In-block: export { name }
                  const exportRegex = new RegExp(
                    `export\\s+(const|function|async\\s+function|class|type)\\s+${safeDef}\\b|` +
                      `export\\s+default\\s+(function|class|async\\s+function)\\s+${safeDef}\\b|` +
                      `export\\s*{[^}]*\\b${safeDef}\\b[^}]*}`,
                    'm',
                  );

                  if (!exportRegex.test(fileContent)) {
                    errors.push(
                      `Function "${ext.builderDefinition}" is not exported from "${ext.file}"`,
                    );
                  }
                } catch (e) {
                  errors.push(
                    `Error reading file "${ext.file}" for export check: ${e}`,
                  );
                }
              }
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : String(err);
              errors.push(
                `File "${ext.file}" not found for extension "${ext.name}": ${errorMessage}`,
              );
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
