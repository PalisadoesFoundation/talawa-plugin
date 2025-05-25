---
id: managing-plugins
title: Managing Plugins
slug: /getting-started/managing
sidebar_position: 2
---

# Managing Plugins

Talawa Admin provides a Plugin Store where organisation admins can view, install, uninstall, and manage plugins as needed. This section guides you through accessing the plugin store and using its core features.

## Accessing the Plugin Store

1. Log in to the **Talawa Admin Panel**.
2. Click on the **Plugins** section in the sidebar.
3. The Plugin Store will show two sections:
   - **Available Plugins** – plugins that are not yet installed
   - **Installed Plugins** – plugins currently active in your organisation

You can search plugins by name or browse by category.

## Installing a Plugin

To install a plugin:

1. Find a plugin in the **Available Plugins** section.
2. Click the **Install** button.
3. Follow any additional setup steps (e.g., API keys or configuration).
4. The plugin will now appear under **Installed Plugins**.

Installed plugins may start working immediately or require activation depending on their type.

## Uninstalling a Plugin

To remove a plugin:

1. Go to the **Installed Plugins** tab.
2. Click **Uninstall** on the plugin you want to remove.
3. You will be asked whether to **retain the plugin’s data for future use** or **delete everything permanently**:
   - **Retain Backup** – The plugin can be reinstalled later with its previous state preserved.
   - **Delete Completely** – All plugin-related data will be erased.

Uninstalling a plugin immediately disables its functionality across Admin, Server, and Mobile components.

## Managing Installed Plugins

Once a plugin is installed, you can:

- **Enable/Disable** it temporarily using the toggle switch
- **Reconfigure settings** if the plugin supports runtime configuration
- **Check status** for version, compatibility, and activity
- **View plugin details** including author, description, and usage info

Plugin settings and toggles are visible in the **Installed Plugins** section.

## Notes

- Only Admins with appropriate permissions can manage plugins
- Some plugins may require restarting the mobile app to reflect changes
- Always check plugin compatibility with your version of Talawa before installing

