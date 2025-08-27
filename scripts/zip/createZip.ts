// scripts/zip/createZip.ts
import { createWriteStream } from 'node:fs';
import { readdirSync, statSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import archiver from 'archiver';

interface PluginInfo {
  name: string;
  path: string;
  hasAdmin: boolean;
  hasApi: boolean;
}

async function getPluginId(pluginPath: string): Promise<string> {
  // Try to get plugin ID from plugin-level manifest first
  const pluginManifestPath = join(pluginPath, 'manifest.json');
  if (existsSync(pluginManifestPath)) {
    try {
      const manifestContent = readFileSync(pluginManifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      if (manifest.pluginId) {
        return manifest.pluginId;
      }
    } catch (error) {
      console.warn('Failed to read plugin manifest:', error);
    }
  }

  // Try to get plugin ID from admin manifest
  const adminManifestPath = join(pluginPath, 'admin', 'manifest.json');
  if (existsSync(adminManifestPath)) {
    try {
      const manifestContent = readFileSync(adminManifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      if (manifest.pluginId) {
        return manifest.pluginId;
      }
    } catch (error) {
      console.warn('Failed to read admin manifest:', error);
    }
  }

  // Try to get plugin ID from API manifest
  const apiManifestPath = join(pluginPath, 'api', 'manifest.json');
  if (existsSync(apiManifestPath)) {
    try {
      const manifestContent = readFileSync(apiManifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent);
      if (manifest.pluginId) {
        return manifest.pluginId;
      }
    } catch (error) {
      console.warn('Failed to read API manifest:', error);
    }
  }

  // Fallback to plugin name if no pluginId found
  return pluginPath.split('/').pop() || 'unknown';
}

export async function createZip(plugin: PluginInfo, isDevelopment: boolean): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const buildType = isDevelopment ? 'dev' : 'prod';
    
    // Get plugin ID from manifest files
    const pluginId = await getPluginId(plugin.path);
    const zipFileName = `${pluginId}-${buildType}.zip`;
    
    // Create zip output directory in root
    const zipOutputDir = join(process.cwd(), 'plugin-zips');
    if (!existsSync(zipOutputDir)) {
      mkdirSync(zipOutputDir, { recursive: true });
    }
    
    const zipPath = join(zipOutputDir, zipFileName);
    
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level
    });

    output.on('close', () => {
      console.log(`\n📦 Zip created: ${zipFileName}`);
      console.log(`📁 Location: ${zipPath}`);
      console.log(`📊 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Add admin folder if it exists
    if (plugin.hasAdmin) {
      const adminPath = join(plugin.path, 'admin');
      if (existsSync(adminPath)) {
        addDirectoryToArchive(archive, adminPath, `admin`);
      }
    }

    // Add api folder if it exists
    if (plugin.hasApi) {
      const apiPath = join(plugin.path, 'api');
      if (existsSync(apiPath)) {
        addDirectoryToArchive(archive, apiPath, `api`);
      }
    }

    // Add plugin manifest if it exists
    const pluginManifestPath = join(plugin.path, 'manifest.json');
    if (existsSync(pluginManifestPath)) {
      archive.file(pluginManifestPath, { name: 'manifest.json' });
    }

    // Add README if it exists
    const readmePath = join(plugin.path, 'README.md');
    if (existsSync(readmePath)) {
      archive.file(readmePath, { name: 'README.md' });
    }

    archive.finalize();
  });
}

function addDirectoryToArchive(archive: archiver.Archiver, dirPath: string, archivePath: string): void {
  const items = readdirSync(dirPath);

  for (const item of items) {
    const fullPath = join(dirPath, item);
    const relativePath = join(archivePath, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively add subdirectories
      addDirectoryToArchive(archive, fullPath, relativePath);
    } else {
      // Add file to archive
      archive.file(fullPath, { name: relativePath });
    }
  }
}
