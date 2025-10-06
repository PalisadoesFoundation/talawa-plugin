---
id: scripts
title: Plugin Scripts
slug: /developer-resources/scripts
sidebar_position: 6
---

# Plugin Scripts

Scripts for plugin development and distribution.

## Available Scripts

### Plugin Initialization

```bash
npm run init-plugin
```

Creates a complete plugin skeleton with API and Admin modules.

### Plugin Packaging

```bash
npm run zip-plugin
```

Creates distributable zip files with development (TypeScript) or production (JavaScript) builds.

**Output:** `plugin-zips/{plugin-id}-{build-type}.zip`

## Script Features

### Plugin ID Resolution
Automatically detects plugin IDs from manifest files (plugin → admin → api → directory name).

### Cross-Platform Compatibility
- Line endings normalized to LF
- UTF-8 encoding for text files
- Excludes OS artifacts (`.DS_Store`, `Thumbs.db`)
- Optimized compression for broad compatibility

## Usage Examples

### Create a New Plugin
```bash
npm run init-plugin
# Follow prompts for plugin name and Docker config
```

### Package Existing Plugin
```bash
npm run zip-plugin
# Select plugin and build type (dev/prod)
```

### Generated Structure
```
plugin-zips/
├── my_plugin-dev.zip
└── my_plugin-prod.zip
```

## Integration

Generated zips are compatible with Talawa's upload system and plugin manager.

## Best Practices

1. Define `pluginId` in manifest files
2. Test both development and production builds
3. Keep plugin source in version control, not zips

## Troubleshooting

**Common Issues:**
- Encoding errors: Check for non-UTF-8 characters
- Missing files: Ensure manifest.json and entry points exist
- Upload failures: Verify zip structure matches expected format

For more detailed information, see the [Plugin Development Guide](./plugin-development.md).
