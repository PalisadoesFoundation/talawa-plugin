/**
 * Plugin Map Plugin for Talawa Admin
 *
 * This plugin provides a comprehensive map of all extension points available in the Talawa Admin Panel.
 * It serves as a developer tool to understand where plugins can inject components and functionality:
 * - Dashboard view showing all extension points with documentation
 * - Global overview of admin and user extension points
 * - Visual indicators for injection points throughout the UI
 * - Detailed examples and usage instructions for each extension point
 */

import { IPluginLifecycle } from '../../types';

// Import all components
import ExtensionPointsDashboard from './pages/ExtensionPointsDashboard';
import ExtensionPointsOrganization from './pages/ExtensionPointsOrganization';
import ExtensionPointsUser from './pages/ExtensionPointsUser';
import ExtensionPointsGlobal from './pages/ExtensionPointsGlobal';
import MapIconInjector from './injector/MapIconInjector';

// Plugin lifecycle implementation
const PluginMapLifecycle: IPluginLifecycle = {
  onActivate: async () => {
    console.log('Plugin Map plugin activated');
  },

  onDeactivate: async () => {
    console.log('Plugin Map plugin deactivated');
  },

  onInstall: async () => {
    console.log('Plugin Map plugin installed');
  },

  onUninstall: async () => {
    console.log('Plugin Map plugin uninstalled');
  },

  onUpdate: async (fromVersion: string, toVersion: string) => {
    console.log(`Plugin Map plugin updated from ${fromVersion} to ${toVersion}`);
  },
};

// Export the lifecycle as default
export default PluginMapLifecycle;

// Export all components
export {
  ExtensionPointsDashboard,
  ExtensionPointsOrganization,
  ExtensionPointsUser,
  ExtensionPointsGlobal,
  MapIconInjector,
};
