# Plugin Zipper

This script allows you to create zip files of Talawa plugins for distribution.

## Features

- **Plugin Selection**: Choose from available plugins in the `plugins/` directory
- **Build Types**:
  - **Development**: Zips TypeScript files directly (for development/testing)
  - **Production**: Compiles TypeScript to JavaScript before zipping (for deployment)
- **Automatic Detection**: Detects which modules (Admin/API) are present in each plugin
- **Clean Output**: Creates properly structured zip files in the `plugin-zips/` directory

## Usage

```bash
npm run zip-plugin
```

## How it Works

### Development Build

- Scans the selected plugin directory
- Zips all TypeScript (`.ts`, `.tsx`) and non-TypeScript files
- Preserves the original directory structure
- Output: `plugin-zips/{plugin-id}-dev.zip`

### Production Build

1. **Compilation**: Compiles TypeScript files to JavaScript
   - Admin: Uses React JSX compilation settings
   - API: Uses CommonJS module compilation settings
2. **File Processing**: Copies all non-TypeScript files (JSON, MD, assets, etc.)
3. **Zipping**: Creates a zip with compiled JavaScript and other files
4. **Cleanup**: Restores original TypeScript files

- Output: `plugin-zips/{plugin-id}-prod.zip`

## File Structure

The generated zip files maintain the plugin structure:

```
plugin-zips/
└── {plugin-id}-{build-type}.zip
├── admin/           # Admin module (if present)
│   ├── pages/
│   ├── assets/
│   ├── injector/
│   ├── index.js     # Compiled from index.tsx
│   ├── manifest.json
│   └── ...
├── api/             # API module (if present)
│   ├── database/
│   ├── graphql/
│   ├── index.js     # Compiled from index.ts
│   ├── manifest.json
│   └── ...
├── manifest.json    # Plugin-level manifest (if present)
└── README.md        # Plugin README (if present)
```

## Requirements

- Node.js 16+
- TypeScript compiler (`npx tsc`)
- `archiver` package (automatically installed)

## Plugin ID Resolution

The script determines the plugin ID for zip naming by checking manifest files in this order:

1. Plugin-level `manifest.json` (if exists)
2. Admin module `manifest.json` (if exists)
3. API module `manifest.json` (if exists)
4. Falls back to plugin directory name if no `pluginId` found in manifests

## Notes

- Production builds temporarily replace TypeScript files with compiled JavaScript
- Original files are restored after zipping
- Backup files are created during the process for safety
- The script handles both Admin (React/JSX) and API (Node.js) compilation settings
