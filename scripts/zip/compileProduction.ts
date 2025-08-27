// scripts/zip/compileProduction.ts
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { spinner } from '@clack/prompts';

interface PluginInfo {
  name: string;
  path: string;
  hasAdmin: boolean;
  hasApi: boolean;
}

export async function compileForProduction(plugin: PluginInfo): Promise<void> {
  const s = spinner();
  s.start('Compiling TypeScript for production...');

  try {
    // Create temporary build directory
    const tempBuildDir = join(process.cwd(), '.temp-build', plugin.name);
    if (existsSync(tempBuildDir)) {
      rmSync(tempBuildDir, { recursive: true, force: true });
    }
    mkdirSync(tempBuildDir, { recursive: true });

    // Compile admin if it exists
    if (plugin.hasAdmin) {
      await compileAdmin(plugin.path, tempBuildDir, s);
    }

    // Compile API if it exists
    if (plugin.hasApi) {
      await compileApi(plugin.path, tempBuildDir, s);
    }

    // Copy non-TypeScript files
    await copyNonTypeScriptFiles(plugin.path, tempBuildDir, s);

    // Replace original plugin directory with compiled version
    const originalPluginPath = plugin.path;
    const backupPath = `${originalPluginPath}.backup`;

    // Create backup
    if (existsSync(originalPluginPath)) {
      rmSync(backupPath, { recursive: true, force: true });
      execSync(`cp -r "${originalPluginPath}" "${backupPath}"`);
    }

    // Replace with compiled version
    rmSync(originalPluginPath, { recursive: true, force: true });
    execSync(`cp -r "${tempBuildDir}" "${originalPluginPath}"`);

    // Clean up temp directory
    rmSync(join(process.cwd(), '.temp-build'), { recursive: true, force: true });

    // Restore original files after zip creation
    // This will be handled by the calling function after zip is created

    s.stop('TypeScript compiled successfully for production');
  } catch (error) {
    s.stop('Failed to compile TypeScript');
    throw error;
  }
}

async function compileAdmin(pluginPath: string, tempBuildDir: string, s: any): Promise<void> {
  const adminPath = join(pluginPath, 'admin');
  const adminBuildPath = join(tempBuildDir, 'admin');

  if (!existsSync(adminPath)) return;

  mkdirSync(adminBuildPath, { recursive: true });

  // Create tsconfig for admin compilation
  const adminTsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'node',
      jsx: 'react-jsx',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: adminBuildPath,
      rootDir: adminPath,
      declaration: false,
      removeComments: true,
      sourceMap: false,
    },
    include: [`${adminPath}/**/*`],
    exclude: ['node_modules', 'dist', 'build'],
  };

  const tsConfigPath = join(process.cwd(), 'temp-admin-tsconfig.json');
  const fs = await import('node:fs');
  fs.writeFileSync(tsConfigPath, JSON.stringify(adminTsConfig, null, 2));

  try {
    // Compile TypeScript files
    execSync(`npx tsc --project "${tsConfigPath}"`, { stdio: 'pipe' });

    // Copy non-TypeScript files
    copyNonTypeScriptFilesRecursive(adminPath, adminBuildPath);

    // Clean up tsconfig
    fs.unlinkSync(tsConfigPath);
  } catch (error) {
    // Clean up tsconfig
    if (existsSync(tsConfigPath)) {
      fs.unlinkSync(tsConfigPath);
    }
    throw error;
  }
}

async function compileApi(pluginPath: string, tempBuildDir: string, s: any): Promise<void> {
  const apiPath = join(pluginPath, 'api');
  const apiBuildPath = join(tempBuildDir, 'api');

  if (!existsSync(apiPath)) return;

  mkdirSync(apiBuildPath, { recursive: true });

  // Create tsconfig for API compilation
  const apiTsConfig = {
    compilerOptions: {
      target: 'ES2020',
      module: 'CommonJS',
      moduleResolution: 'node',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: apiBuildPath,
      rootDir: apiPath,
      declaration: false,
      removeComments: true,
      sourceMap: false,
    },
    include: [`${apiPath}/**/*`],
    exclude: ['node_modules', 'dist', 'build'],
  };

  const tsConfigPath = join(process.cwd(), 'temp-api-tsconfig.json');
  const fs = await import('node:fs');
  fs.writeFileSync(tsConfigPath, JSON.stringify(apiTsConfig, null, 2));

  try {
    // Compile TypeScript files
    execSync(`npx tsc --project "${tsConfigPath}"`, { stdio: 'pipe' });

    // Copy non-TypeScript files
    copyNonTypeScriptFilesRecursive(apiPath, apiBuildPath);

    // Clean up tsconfig
    fs.unlinkSync(tsConfigPath);
  } catch (error) {
    // Clean up tsconfig
    if (existsSync(tsConfigPath)) {
      fs.unlinkSync(tsConfigPath);
    }
    throw error;
  }
}

async function copyNonTypeScriptFiles(pluginPath: string, tempBuildDir: string, s: any): Promise<void> {
  const fs = await import('node:fs');
  const { readdirSync, statSync } = fs;

  const items = readdirSync(pluginPath);

  for (const item of items) {
    const fullPath = join(pluginPath, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip admin and api directories as they're handled separately
      if (item !== 'admin' && item !== 'api') {
        const destPath = join(tempBuildDir, item);
        copyNonTypeScriptFilesRecursive(fullPath, destPath);
      }
    } else {
      // Copy non-TypeScript files
      if (!item.endsWith('.ts') && !item.endsWith('.tsx')) {
        copyFileSync(fullPath, join(tempBuildDir, item));
      }
    }
  }
}

function copyNonTypeScriptFilesRecursive(srcPath: string, destPath: string): void {
  const fs = require('node:fs');
  const { readdirSync, statSync, mkdirSync, copyFileSync } = fs;

  if (!existsSync(destPath)) {
    mkdirSync(destPath, { recursive: true });
  }

  const items = readdirSync(srcPath);

  for (const item of items) {
    const srcItemPath = join(srcPath, item);
    const destItemPath = join(destPath, item);
    const stat = statSync(srcItemPath);

    if (stat.isDirectory()) {
      copyNonTypeScriptFilesRecursive(srcItemPath, destItemPath);
    } else {
      // Copy non-TypeScript files
      if (!item.endsWith('.ts') && !item.endsWith('.tsx')) {
        copyFileSync(srcItemPath, destItemPath);
      }
    }
  }
}
