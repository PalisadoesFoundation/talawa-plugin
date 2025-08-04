import { desc, eq, sql, and, isNull } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { pollsTable } from "../database/tables";
import { PluginMapPollsResultRef } from "./types";
import { getPluginMapPollsInputSchema } from "./inputs";

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
