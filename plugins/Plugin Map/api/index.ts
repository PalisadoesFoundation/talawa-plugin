import type { IPluginContext } from "~/src/plugin/types";

// Export all GraphQL components
export * from "./graphql/queries";
export * from "./graphql/mutations";
export * from "./graphql/types";
export * from "./graphql/inputs";

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin loaded successfully");

  // Initialize plugin table if it doesn't exist
  try {
    const { pollsTable } = await import("./database/tables");

    // Check if table exists by trying to query it
    if (context.db) {
      await context.db.select().from(pollsTable).limit(1);
    }

    context.logger?.info("Plugin Map polls table verified");
  } catch (error) {
    context.logger?.warn("Failed to verify plugin table:", error);
  }
}

export async function onActivate(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin activated");

  // Register GraphQL schema extensions
  if (context.graphql) {
    try {
      const { registerPluginMapQueries } = await import("./graphql/queries");
      const { registerPluginMapMutations } = await import(
        "./graphql/mutations"
      );

      // Register queries and mutations with the GraphQL builder
      registerPluginMapQueries(context.graphql);
      registerPluginMapMutations(context.graphql);

      context.logger?.info(
        "GraphQL schema extensions registered for Plugin Map Plugin"
      );
    } catch (error) {
      context.logger?.error("Failed to register GraphQL extensions:", error);
    }
  }
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin deactivated");
}

export async function onUnload(context: IPluginContext): Promise<void> {
  context.logger?.info("Plugin Map Plugin unloaded");
}

// Plugin information
export function getPluginInfo() {
  return {
    name: "Plugin Map",
    version: "1.0.0",
    description: "Simple polling system to test requests from frontend",
    author: "Plugin Map Team",
    dependencies: [],
    graphqlOperations: [
      "getPluginMapPolls",
      "logPluginMapPoll",
      "clearPluginMapPolls",
    ],
  };
}
