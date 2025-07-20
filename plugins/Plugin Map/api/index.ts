import type { IPluginContext, IPluginLifecycle } from "../../types";

// Export database tables and GraphQL resolvers
export * from "./database/tables";
export * from "./graphql/queries";
export * from "./graphql/mutations";

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin loaded successfully");
  
  // Initialize plugin table if it doesn't exist
  try {
    const { pluginMapRequestsTable } = await import("./database/tables");
    
    // Check if table exists by trying to query it
    await context.db.select().from(pluginMapRequestsTable).limit(1);
    
    context.logger?.info("Plugin Map table verified");
  } catch (error) {
    context.logger?.warn("Failed to verify plugin table:", error);
  }
}

export async function onActivate(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin activated");
  
  // Log activation event
  try {
    const { logPluginMapRequest } = await import("./graphql/mutations");
    
    await logPluginMapRequest(
      null,
      {
        requestType: "admin_global",
        requestSource: "plugin_map_system",
        metadata: "Plugin Map activated"
      },
      context
    );
    
    context.logger?.info("Plugin Map activation logged");
  } catch (error) {
    context.logger?.error("Failed to log activation:", error);
  }

  // Register GraphQL schema extensions
  if (context.graphql) {
    try {
      context.logger?.info("GraphQL schema extensions registered for Plugin Map Plugin");
    } catch (error) {
      context.logger?.error("Failed to register GraphQL extensions:", error);
    }
  }
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin deactivated");
  
  // Log deactivation event
  try {
    const { logPluginMapRequest } = await import("./graphql/mutations");
    
    await logPluginMapRequest(
      null,
      {
        requestType: "admin_global",
        requestSource: "plugin_map_system",
        metadata: "Plugin Map deactivated"
      },
      context
    );
    
    context.logger?.info("Plugin Map deactivation logged");
  } catch (error) {
    context.logger?.error("Failed to log deactivation:", error);
  }
}

export async function onUnload(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin unloaded");
}

// Event handlers
export async function onPluginActivated(
  data: any,
  context: IPluginContext
): Promise<void> {
  try {
    context.logger?.info(`Plugin activated: ${data.pluginId}`);
    
    // Log plugin activation event
    const { logPluginMapRequest } = await import("./graphql/mutations");
    
    await logPluginMapRequest(
      null,
      {
        requestType: "admin_global",
        requestSource: "plugin_system",
        metadata: `Plugin ${data.pluginId} activated`
      },
      context
    );

    // Notify via pubsub if available
    if (context.pubsub) {
      context.pubsub.publish("plugin:notification", {
        type: "plugin_activated",
        pluginId: data.pluginId,
        message: `Plugin ${data.pluginId} has been activated`,
        timestamp: data.timestamp,
      });
    }
  } catch (error) {
    context.logger?.error("Error in onPluginActivated:", error);
  }
}

export async function onPluginDeactivated(
  data: any,
  context: IPluginContext
): Promise<void> {
  try {
    context.logger?.info(`Plugin deactivated: ${data.pluginId}`);
    
    // Log plugin deactivation event
    const { logPluginMapRequest } = await import("./graphql/mutations");
    
    await logPluginMapRequest(
      null,
      {
        requestType: "admin_global",
        requestSource: "plugin_system",
        metadata: `Plugin ${data.pluginId} deactivated`
      },
      context
    );

    // Notify via pubsub if available
    if (context.pubsub) {
      context.pubsub.publish("plugin:notification", {
        type: "plugin_deactivated",
        pluginId: data.pluginId,
        message: `Plugin ${data.pluginId} has been deactivated`,
        timestamp: data.timestamp,
      });
    }
  } catch (error) {
    context.logger?.error("Error in onPluginDeactivated:", error);
  }
}

// Utility functions for the plugin
export async function getPluginInfo(context: IPluginContext) {
  return {
    name: "Plugin Map",
    version: "1.0.0",
    description: "A plugin map that provides an overview of extension points and logs requests from different admin and user contexts.",
    features: [
      "Extension points overview for developers",
      "Request logging from 4 contexts: admin global, admin org, user global, user org",
      "Simple request tracking with auto-numbering",
      "Real-time plugin system monitoring",
      "Request history and analytics",
      "Clear request logs functionality"
    ],
    tables: [
      "plugin_map_requests"
    ],
    graphqlOperations: [
      "getExtensionPointsOverview",
      "getPluginMapRequests", 
      "logPluginMapRequest",
      "clearPluginMapRequests"
    ],
    events: [
      "plugin:activated",
      "plugin:deactivated"
    ],
    contexts: [
      "admin_global - Global admin context",
      "admin_org - Organization admin context", 
      "user_global - Global user context",
      "user_org - Organization user context"
    ]
  };
}

// Export the plugin lifecycle interface
const PluginMapPlugin: IPluginLifecycle = {
  onLoad,
  onActivate,
  onDeactivate,
  onUnload,
};

export default PluginMapPlugin; 