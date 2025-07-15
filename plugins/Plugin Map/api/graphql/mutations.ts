import { sql } from "drizzle-orm";
import type { GraphQLContext } from "~/src/graphql/context";
import { pluginMapRequestsTable } from "../database/tables";

// Log a new request from any of the 4 contexts
export async function logPluginMapRequest(
  _parent: unknown,
  {
    requestType,
    requestSource,
    metadata
  }: {
    requestType: string; // 'admin_global', 'admin_org', 'user_global', 'user_org'
    requestSource: string; // Which extension sent the request
    metadata?: string;
  },
  context: GraphQLContext
) {
  try {
    // Validate request type
    const validTypes = ['admin_global', 'admin_org', 'user_global', 'user_org'];
    if (!validTypes.includes(requestType)) {
      throw new Error(`Invalid request type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Get the next request number
    const [{ maxRequestNumber }] = await context.db
      .select({ 
        maxRequestNumber: sql<number>`COALESCE(MAX(${pluginMapRequestsTable.requestNumber}), 0)` 
      })
      .from(pluginMapRequestsTable);

    const nextRequestNumber = (maxRequestNumber || 0) + 1;
    const message = `Request ${nextRequestNumber}`;

    // Insert the new request
    const [newRequest] = await context.db
      .insert(pluginMapRequestsTable)
      .values({
        requestNumber: nextRequestNumber,
        requestType,
        requestSource,
        message,
        metadata,
      })
      .returning();

    context.logger?.info(`Plugin Map: Logged ${message} from ${requestSource} (${requestType})`);

    return newRequest;
  } catch (error) {
    context.logger?.error("Error logging plugin map request:", error);
    throw new Error(`Failed to log request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Clear all logged requests
export async function clearPluginMapRequests(
  _parent: unknown,
  _args: {},
  context: GraphQLContext
) {
  try {
    // Get count before deletion
    const [{ count }] = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(pluginMapRequestsTable);

    // Delete all requests
    await context.db
      .delete(pluginMapRequestsTable);

    context.logger?.info(`Plugin Map: Cleared ${count} logged requests`);

    return {
      success: true,
      clearedCount: count,
      message: `Cleared ${count} requests`
    };
  } catch (error) {
    context.logger?.error("Error clearing plugin map requests:", error);
    throw new Error("Failed to clear requests");
  }
} 