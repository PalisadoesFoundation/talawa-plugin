// scripts/zip/createZip.ts
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  readdirSync,
} from "node:fs";
import { join, relative, sep } from "node:path";
import archiver from "archiver";

interface PluginInfo {
  name: string;
  path: string;
  hasAdmin: boolean;
  hasApi: boolean;
}

async function getPluginId(pluginPath: string): Promise<string> {
  const tryManifest = (p: string) => {
    if (!existsSync(p)) return null;
    try {
      const manifestContent = readFileSync(p, "utf-8");
      const manifest = JSON.parse(manifestContent);
      return manifest?.pluginId ?? null;
    } catch {
      return null;
    }
  };

  return (
    tryManifest(join(pluginPath, "manifest.json")) ||
    tryManifest(join(pluginPath, "admin", "manifest.json")) ||
    tryManifest(join(pluginPath, "api", "manifest.json")) ||
    pluginPath.split("/").pop() ||
    "unknown"
  );
}

async function validateZipFile(zipPath: string): Promise<void> {
  try {
    const stats = statSync(zipPath);
    if (stats.size < 100)
      throw new Error("Zip file is too small - may be corrupted");
  } catch (error) {
    throw new Error(`Zip validation failed: ${error}`);
  }
}

// Ignore typical OS/build cruft
const IGNORE_BASENAMES = new Set([".DS_Store", "Thumbs.db"]);
const IGNORE_DIRS = new Set(["__MACOSX", ".git", ".svn", ".hg"]);

function shouldIgnore(fullPath: string, base: string, isDir: boolean): boolean {
  if (isDir && IGNORE_DIRS.has(base)) return true;
  if (!isDir && IGNORE_BASENAMES.has(base)) return true;
  return false;
}

function listFilesRecursive(
  root: string,
  baseInZip: string,
): Array<{
  fsPath: string;
  zipPath: string;
  stats: ReturnType<typeof statSync>;
}> {
  const out: Array<{
    fsPath: string;
    zipPath: string;
    stats: ReturnType<typeof statSync>;
  }> = [];
  const stack: Array<{ dir: string; prefix: string }> = [
    { dir: root, prefix: baseInZip },
  ];

  while (stack.length) {
    const { dir, prefix } = stack.pop()!;
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const ent of entries) {
      const fsPath = join(dir, ent.name);
      const base = ent.name;
      if (shouldIgnore(fsPath, base, ent.isDirectory())) continue;

      // Normalize zip path with forward slashes
      const zipPath =
        (prefix ? `${prefix}/` : "") +
        base.replace(
          new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          "/",
        );

      if (ent.isDirectory()) {
        stack.push({ dir: fsPath, prefix: zipPath });
      } else if (ent.isFile()) {
        const stats = statSync(fsPath);
        // Skip zero-length weirdness (optional)
        // if (stats.size === 0) continue;
        out.push({ fsPath, zipPath, stats });
      }
    }
  }

  return out;
}

export async function createZip(
  plugin: PluginInfo,
  isDevelopment: boolean,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const buildType = isDevelopment ? "dev" : "prod";

    const pluginId = await getPluginId(plugin.path);
    const zipFileName = `${pluginId}-${buildType}.zip`;

    const zipOutputDir = join(process.cwd(), "plugin-zips");
    if (!existsSync(zipOutputDir)) {
      mkdirSync(zipOutputDir, { recursive: true });
    }
    const zipPath = join(zipOutputDir, zipFileName);

    // Prepare list of files deterministically
    const files: Array<{
      fsPath: string;
      zipPath: string;
      stats: ReturnType<typeof statSync>;
    }> = [];

    // Optional: include only selected subtrees
    if (plugin.hasAdmin && existsSync(join(plugin.path, "admin"))) {
      files.push(...listFilesRecursive(join(plugin.path, "admin"), "admin"));
    }
    if (plugin.hasApi && existsSync(join(plugin.path, "api"))) {
      files.push(...listFilesRecursive(join(plugin.path, "api"), "api"));
    }

    // Top-level files we explicitly include
    for (const top of ["manifest.json", "README.md", "package.json"]) {
      const p = join(plugin.path, top);
      if (existsSync(p)) {
        const stats = statSync(p);
        files.push({ fsPath: p, zipPath: top, stats });
      }
    }

    const output = createWriteStream(zipPath);

    const archive = archiver("zip", {
      zlib: { level: 9 }, // max compression but broadly compatible
      store: false, // compress entries (no "stored" entries)
      forceZip64: false, // avoid ZIP64 unless absolutely needed
      // comment: 'Talawa plugin package', // optional
    });

    const done = new Promise<void>((resolveClose, rejectClose) => {
      output.on("close", () => resolveClose());
      output.on("error", rejectClose);
      archive.on("warning", (err) => {
        if ((err as any)?.code !== "ENOENT") {
          rejectClose(err);
        }
      });
      archive.on("error", rejectClose);
    });

    archive.pipe(output);

    // Add files with known stats → prevents “data descriptor” streaming headers.
    for (const f of files) {
      if (!f.stats) continue; // Skip files without stats

      // Normalize mtime to seconds (avoid extended precision extra fields)
      const mtimeMs = Number(f.stats.mtimeMs);
      const mtime = new Date(Math.floor(mtimeMs / 1000) * 1000);
      archive.file(f.fsPath, {
        name: f.zipPath.replace(/\\/g, "/"),
        stats: {
          ...f.stats,
          mtime,
        } as any,
      });
    }

    // Finalize & wait
    archive.finalize();

    try {
      await done;

      console.log(`📦 Zip created: ${zipFileName}`);
      console.log(
        `📊 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`,
      );

      await validateZipFile(zipPath);
    } catch (e) {
      console.error("Archive finalize/validate error:", e);
      return reject(e);
    }

    resolve();
  });
}
