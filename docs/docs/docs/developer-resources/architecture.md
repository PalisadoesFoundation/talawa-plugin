---
id: architecture
title: Architecture
slug: /developer-resources/architecture
sidebar_position: 2
---

# Plugin Architecture

Talawa Plugins extend the functionality of the Talawa platform by allowing features to be added, removed, or updated without modifying the core codebase.

This plugin system follows a **microkernel + drop-in** architecture — each plugin is self-contained and can support any combination of backend, admin, or mobile enhancements.

## What is a Plugin?

A plugin is an optional module that provides new capabilities across:

- **Talawa Admin** (Admin Dashboard)
- **Talawa API** (GraphQL + Service Layer)
- **Talawa Mobile App** (Flutter)

Plugins are **controlled by organisation admins** via the Admin Panel. They remain inactive until installed, and can be enabled or disabled at any time.

## Plugin Components

Each plugin lives inside the `plugins/` directory and follows a standard structure:

```
plugins/
└── plugin-name/
    ├── plugin.json        # Manifest describing plugin metadata
    ├── server/            # GraphQL schema, resolvers, services, migrations
    ├── admin/             # Admin UI modules (React/TS)
    └── mobile/            # Flutter modules (screens, flows)
```

The plugin will only load the relevant parts based on where it's being used.

## Talawa Admin

Admins access the **Plugin Store** from the Admin Panel to manage plugins.

Key functionalities:

- View available and installed plugins
- Install, uninstall, enable, or disable plugins
- Search and filter plugins by name
- See plugin descriptions and compatibility status

## Talawa API

The Talawa API handles:

- Plugin discovery and registration
- Plugin hook execution (e.g., `onCommentPosted`, `onPaymentInit`)
- GraphQL extension with plugin-specific resolvers and types
- Migration execution and data isolation

A plugin may register its presence via a model like:

```ts
Plugin = {
  name: string;
  description: string;
  createdBy: string;
  installedOrgs: string[];
  active: boolean;
}
```

Plugins are loaded lazily and are sandboxed to avoid affecting the stability of the core system.

## Talawa Mobile App

The mobile app can load plugin features in two ways:

1. **Pre-bundled:** Common plugins are included in the app build but remain inactive unless enabled by the admin.
2. **On-demand:** For advanced setups, a build pipeline can dynamically package and deliver plugin updates per organisation.

Plugins can:
- Add new screens via `TalawaPluginProvider`
- Extend navigation, posts, events, donations, or analytics features
- Communicate with server-side APIs for logic

## Plugin Lifecycle

1. **Discovery**  
   Plugins are automatically detected from the filesystem.

2. **Registration**  
   Plugin manifests are validated and matched to compatible extension points.

3. **Installation**  
   Admins can install plugins via the Plugin Store. Server-side setup (like migrations) is triggered automatically.

4. **Activation**  
   Enabled plugins begin executing registered hooks and rendering UI as needed.

5. **Deactivation/Removal**  
   Admins can disable or uninstall plugins anytime. Uninstalling optionally deletes related data.


## Notes

- Admin Portal and Mobile App must be connected to the same organisation instance
- Some plugins require configuration (e.g., API keys or credentials)
- Inactive plugins consume no memory or processing

## Demo

