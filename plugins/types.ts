/**
 * Plugin Types
 *
 * Shared type definitions for plugin lifecycle and context interfaces.
 * All plugins should import these interfaces to ensure consistent lifecycle behavior.
 */

/**
 * Plugin context provided to lifecycle hooks
 * Contains database, logger, and other shared resources
 */
export interface IPluginContext {
  /** Database connection for plugin data access */
  db?: unknown;
  /** Logger instance for plugin logging */
  logger?: {
    info?: (...args: unknown[]) => void;
    warn?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
    debug?: (...args: unknown[]) => void;
  };
  /** Plugin configuration from manifest */
  config?: Record<string, unknown>;
}

/**
 * Plugin lifecycle interface
 *
 * Defines the contract for plugin lifecycle hooks that must be implemented
 * by all plugins to ensure proper initialization, activation, and cleanup.
 */
export interface IPluginLifecycle {
  /**
   * Called when plugin is loaded into memory
   * Use for initial setup and resource allocation
   */
  onLoad?: (context: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is activated
   * Use for validation, SDK initialization, and resource setup
   */
  onActivate?: (context?: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is deactivated
   * Use for cleanup, canceling operations, and releasing resources
   */
  onDeactivate?: (context?: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is unloaded from memory
   * Use for final cleanup and resource release
   */
  onUnload?: (context: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is first installed
   * Use for creating default configuration, database records, webhooks
   */
  onInstall?: (context?: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is uninstalled
   * Use for removing configuration, cleaning up data, unregistering webhooks
   */
  onUninstall?: (context?: IPluginContext) => Promise<void>;

  /**
   * Called when plugin is updated from one version to another
   * Use for database migrations, configuration transformations
   * @param fromVersion - Previous plugin version
   * @param toVersion - New plugin version
   */
  onUpdate?: (fromVersion: string, toVersion: string) => Promise<void>;
}
