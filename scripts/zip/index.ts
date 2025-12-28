// scripts/zip/index.ts
import {
  intro,
  outro,
  isCancel,
  select,
  confirm,
  spinner,
} from '@clack/prompts';
import bold from 'chalk';
import green from 'chalk';
import { readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { createZip } from './createZip.js';
import { compileForProduction } from './compileProduction.js';

const PLUGINS_DIR = 'plugins';

interface PluginInfo {
  name: string;
  path: string;
  hasAdmin: boolean;
  hasApi: boolean;
}

async function getAvailablePlugins(): Promise<PluginInfo[]> {
  const plugins: PluginInfo[] = [];

  if (!existsSync(PLUGINS_DIR)) {
    return plugins;
  }

  const pluginDirs = readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const pluginName of pluginDirs) {
    const pluginPath = join(PLUGINS_DIR, pluginName);
    const adminPath = join(pluginPath, 'admin');
    const apiPath = join(pluginPath, 'api');

    plugins.push({
      name: pluginName,
      path: pluginPath,
      hasAdmin: existsSync(adminPath),
      hasApi: existsSync(apiPath),
    });
  }

  return plugins;
}

async function runValidationTests(pluginName: string): Promise<void> {
  const s = spinner();

  try {
    // Run platform validation tests
    s.start('Running platform validation tests...');
    execSync('pnpm exec vitest run test/platform/ --reporter=verbose', {
      stdio: 'inherit',
    });
    s.stop('Platform validation tests passed');

    // Check if plugin-specific tests exist
    const pluginTestPath = join('test', 'plugins', pluginName);

    // Check if directory exists AND contains test files
    let hasTestFiles = false;
    if (existsSync(pluginTestPath)) {
      const { readdirSync } = await import('node:fs');
      const files = readdirSync(pluginTestPath, { recursive: true });
      hasTestFiles = files.some(
        (file: any) =>
          typeof file === 'string' &&
          (file.endsWith('.test.ts') ||
            file.endsWith('.test.tsx') ||
            file.endsWith('.spec.ts') ||
            file.endsWith('.spec.tsx')),
      );
    }

    if (hasTestFiles) {
      s.start(`Running ${pluginName} plugin tests...`);
      execSync(
        `pnpm exec vitest run test/plugins/${pluginName}/ --reporter=verbose`,
        { stdio: 'inherit' },
      );
      s.stop(`${pluginName} plugin tests passed`);
    } else {
      s.stop('No test files found');
      throw new Error(
        `No test files found for ${pluginName} plugin at ${pluginTestPath}.\nPlease add tests before packaging this plugin.`,
      );
    }
  } catch (error) {
    s.stop('Validation tests failed');
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'Platform validation failed - cannot create plugin zip. Please fix test failures and try again.',
    );
  }
}

async function main() {
  intro(`${bold('Talawa Plugin Zipper')}`);

  try {
    // Get available plugins
    const s = spinner();
    s.start('Scanning for available plugins...');

    const availablePlugins = await getAvailablePlugins();

    if (availablePlugins.length === 0) {
      s.stop('No plugins found');
      outro('No plugins found in the plugins directory.');
      return;
    }

    s.stop(`Found ${availablePlugins.length} plugin(s)`);

    // Let user select a plugin
    const pluginOptions = availablePlugins.map((plugin) => ({
      value: plugin.name,
      label:
        `${plugin.name} ${plugin.hasAdmin ? '(Admin)' : ''} ${plugin.hasApi ? '(API)' : ''}`.trim(),
    }));

    const selectedPluginName = await select({
      message: 'Select a plugin to zip:',
      options: pluginOptions,
    });

    if (isCancel(selectedPluginName)) {
      outro('Operation cancelled');
      return;
    }

    const selectedPlugin = availablePlugins.find(
      (p) => p.name === selectedPluginName,
    );
    if (!selectedPlugin) {
      outro('Selected plugin not found');
      return;
    }

    // Ask if it's for development or production
    const isDevelopment = await confirm({
      message: 'Is this for development? (Yes = development, No = production)',
      initialValue: true,
    });

    if (isCancel(isDevelopment)) {
      outro('Operation cancelled');
      return;
    }

    // For production builds, ask about type checking
    let skipTypeCheck = false;
    if (!isDevelopment) {
      const typeCheckResponse = await confirm({
        message:
          'Skip type checking for production build? (Yes = skip, No = run type check)',
        initialValue: false,
      });

      if (isCancel(typeCheckResponse)) {
        outro('Operation cancelled');
        return;
      }

      skipTypeCheck = typeCheckResponse;
    }

    // Run validation tests before creating zip
    await runValidationTests(selectedPluginName as string);

    // Create zip
    const zipSpinner = spinner();
    zipSpinner.start(
      `Creating ${isDevelopment ? 'development' : 'production'} zip for ${selectedPluginName}...`,
    );

    try {
      if (isDevelopment) {
        // For development: zip TypeScript files directly
        await createZip(selectedPlugin, true);
      } else {
        // For production: compile TypeScript to JavaScript first, then zip
        await compileForProduction(selectedPlugin, skipTypeCheck);
        await createZip(selectedPlugin, false);

        // Restore original TypeScript files
        const { execSync } = await import('node:child_process');
        const { existsSync, rmSync } = await import('node:fs');
        const backupPath = `${selectedPlugin.path}.backup`;

        if (existsSync(backupPath)) {
          rmSync(selectedPlugin.path, { recursive: true, force: true });
          execSync(`cp -r "${backupPath}" "${selectedPlugin.path}"`);
          rmSync(backupPath, { recursive: true, force: true });
        }
      }

      zipSpinner.stop(`${selectedPluginName} zipped successfully!`);
      outro(
        green(
          `Plugin "${selectedPluginName}" has been zipped as ${isDevelopment ? 'development' : 'production'} build.`,
        ),
      );
    } catch (error) {
      zipSpinner.stop('Failed to create zip');
      console.error('Error creating zip:', error);

      // Restore original files on error for production builds
      if (!isDevelopment) {
        const { execSync } = await import('node:child_process');
        const { existsSync, rmSync } = await import('node:fs');
        const backupPath = `${selectedPlugin.path}.backup`;

        if (existsSync(backupPath)) {
          rmSync(selectedPlugin.path, { recursive: true, force: true });
          execSync(`cp -r "${backupPath}" "${selectedPlugin.path}"`);
          rmSync(backupPath, { recursive: true, force: true });
        }
      }

      outro('Failed to create plugin zip');
    }
  } catch (err: unknown) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
}

main();
