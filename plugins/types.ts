/**
 * Plugin Types
 *
 * Shared type definitions for plugin lifecycle and context interfaces.
 * All plugins should import these interfaces to ensure consistent lifecycle behavior.
 */

/**
 * Allowed types for logger arguments
 */
export type LogArg = string | number | boolean | null | undefined | object;

/**
 * Plugin context provided to all lifecycle hooks
 * Contains database, logger, and other shared resources
 *
 * @template TDb - Type for the database connection (default: unknown)
 * @template TConfig - Type for plugin configuration (default: Record<string, unknown>)
 */
export interface IPluginContext<
  TDb = unknown,
  TConfig = Record<string, unknown>,
> {
  /** Database connection for plugin data access */
  db?: TDb;
  /** Logger instance for plugin logging (use instead of console.*) */
  logger?: {
    info: (...args: LogArg[]) => void;
    warn: (...args: LogArg[]) => void;
    error: (...args: LogArg[]) => void;
    debug: (...args: LogArg[]) => void;
  };
  /** Plugin configuration from manifest */
  config?: TConfig;
}

/**
 * Plugin lifecycle interface
 *
 * Defines the contract for plugin lifecycle hooks that must be implemented
 * by all plugins to ensure proper initialization, activation, and cleanup.
 * All hooks receive a context object for accessing shared resources.
 */
export interface IPluginLifecycle<
  TDb = unknown,
  TConfig = Record<string, unknown>,
> {
  /**
   * Called when plugin is loaded into memory
   * Use for initial setup and resource allocation
   * @param context - Plugin context with db, logger, and config
   */
  onLoad?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is activated
   * Use for validation, SDK initialization, and resource setup
   * @param context - Plugin context with db, logger, and config
   */
  onActivate?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is deactivated
   * Use for cleanup, canceling operations, and releasing resources
   * @param context - Plugin context with db, logger, and config
   */
  onDeactivate?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is unloaded from memory
   * Use for final cleanup and resource release
   * @param context - Plugin context with db, logger, and config
   */
  onUnload?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is first installed
   * Use for creating default configuration, database records, webhooks
   * @param context - Plugin context with db, logger, and config
   */
  onInstall?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is uninstalled
   * Use for removing configuration, cleaning up data, unregistering webhooks
   * @param context - Plugin context with db, logger, and config
   */
  onUninstall?: (context: IPluginContext<TDb, TConfig>) => Promise<void>;

  /**
   * Called when plugin is updated from one version to another
   * Use for database migrations, configuration transformations
   * @param fromVersion - Previous plugin version
   * @param toVersion - New plugin version
   * @param context - Plugin context with db, logger, and config
   */
  onUpdate?: (
    fromVersion: string,
    toVersion: string,
    context: IPluginContext<TDb, TConfig>,
  ) => Promise<void>;
}
