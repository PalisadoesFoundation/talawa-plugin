import { desc, eq, sql, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { pollsTable } from "../database/tables";
import {
  PluginMapPollsResultRef,
  ExtensionPointsOverviewRef,
  PluginMapRequestsResultRef,
} from "./types";
import { getPluginMapPollsInputSchema } from "./inputs";

// Get extension points overview
export async function getExtensionPointsOverviewResolver(
  _parent: unknown,
  _args: Record<string, unknown>,
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  try {
    // Return a comprehensive overview of all available extension points
    return {
      extensionPoints: [
        {
          id: "RA1",
          name: "Admin Global Route",
          description: "Admin's global view and cross-organization features",
          context: "Global",
          userRole: "Admin",
          features: [
            "Global settings",
            "Cross-org management",
            "System-wide admin features",
          ],
        },
        {
          id: "RA2",
          name: "Admin Organization Route",
          description: "Admin's organization-specific management features",
          context: "Organization",
          userRole: "Admin",
          features: ["Org settings", "Member management", "Event management"],
        },
        {
          id: "RU1",
          name: "User Organization Route",
          description: "User's organization-specific features",
          context: "Organization",
          userRole: "User",
          features: [
            "Org participation",
            "Event registration",
            "Member features",
          ],
        },
        {
          id: "RU2",
          name: "User Global Route",
          description: "User's global view and cross-organization features",
          context: "Global",
          userRole: "User",
          features: [
            "Global profile",
            "Cross-org settings",
            "Global preferences",
          ],
        },
      ],
      totalCount: 4,
      description:
        "Overview of all available extension points in the Talawa system",
    };
  } catch (error) {
    ctx.log?.error("Error getting extension points overview:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Get plugin map requests (alias for getPluginMapPolls)
export async function getPluginMapRequestsResolver(
  _parent: unknown,
  args: {
    requestType?: string | null;
    limit?: number | null;
    offset?: number | null;
  },
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  try {
    const { requestType, limit = 50, offset = 0 } = args;

    const whereConditions = [];

    if (requestType) {
      whereConditions.push(eq(pollsTable.extensionPoint, requestType));
    }

    const polls = await ctx.drizzleClient
      .select()
      .from(pollsTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(pollsTable.createdAt))
      .limit(limit || 50)
      .offset(offset || 0);

    // Get total count
    const countResult = await ctx.drizzleClient
      .select({ count: sql<number>`count(*)` })
      .from(pollsTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const count = countResult[0]?.count || 0;

    return {
      requests: polls,
      totalCount: count,
      hasMore: (offset || 0) + (limit || 50) < count,
    };
  } catch (error) {
    ctx.log?.error("Error getting plugin map requests:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Get all logged polls
export async function getPluginMapPollsResolver(
  _parent: unknown,
  args: {
    input?: {
      userRole?: string | null;
      organizationId?: string | null;
      extensionPoint?: string | null;
      limit?: number | null;
      offset?: number | null;
    } | null;
  },
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  const input = args.input || {};
  const {
    success,
    data: parsedArgs,
    error,
  } = getPluginMapPollsInputSchema.safeParse(input);

  if (!success) {
    ctx.log?.error("Invalid arguments for getPluginMapPolls:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }

  try {
    const whereConditions = [];

    if (parsedArgs.userRole) {
      whereConditions.push(eq(pollsTable.userRole, parsedArgs.userRole));
    }

    if (parsedArgs.organizationId !== undefined) {
      if (parsedArgs.organizationId === null) {
        whereConditions.push(isNull(pollsTable.organizationId));
      } else {
        whereConditions.push(
          eq(pollsTable.organizationId, parsedArgs.organizationId)
        );
      }
    }

    if (parsedArgs.extensionPoint) {
      whereConditions.push(
        eq(pollsTable.extensionPoint, parsedArgs.extensionPoint)
      );
    }

    const limit = parsedArgs.limit || 50;
    const offset = parsedArgs.offset || 0;

    const polls = await ctx.drizzleClient
      .select()
      .from(pollsTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(pollsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await ctx.drizzleClient
      .select({ count: sql<number>`count(*)` })
      .from(pollsTable)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const count = countResult[0]?.count || 0;

    return {
      polls,
      totalCount: count,
      hasMore: offset + limit < count,
    };
  } catch (error) {
    ctx.log?.error("Error getting plugin map polls:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Register all Plugin Map queries with the builder
export function registerPluginMapQueries(
  builderInstance: typeof builder
): void {
  // Get extension points overview
  builderInstance.queryField("getExtensionPointsOverview", (t) =>
    t.field({
      type: ExtensionPointsOverviewRef,
      description:
        "Get an overview of all available extension points in the system",
      resolve: getExtensionPointsOverviewResolver,
    })
  );

  // Get plugin map requests
  builderInstance.queryField("getPluginMapRequests", (t) =>
    t.field({
      type: PluginMapRequestsResultRef,
      args: {
        requestType: t.arg.string({ required: false }),
        limit: t.arg.int({ required: false }),
        offset: t.arg.int({ required: false }),
      },
      description: "Get logged requests from different contexts",
      resolve: getPluginMapRequestsResolver,
    })
  );

  // Get plugin map polls
  builderInstance.queryField("getPluginMapPolls", (t) =>
    t.field({
      type: PluginMapPollsResultRef,
      args: {
        input: t.arg({
          type: builder.inputType("GetPluginMapPollsInput", {
            fields: (t) => ({
              userRole: t.string({ required: false }),
              organizationId: t.string({ required: false }),
              extensionPoint: t.string({ required: false }),
              limit: t.int({ required: false }),
              offset: t.int({ required: false }),
            }),
          }),
          required: false,
        }),
      },
      description: "Get plugin map polls with optional filtering",
      resolve: getPluginMapPollsResolver,
    })
  );
}
