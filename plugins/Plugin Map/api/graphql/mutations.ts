import { sql } from "drizzle-orm";
import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { pollsTable } from "../database/tables";
import { PluginMapPollRef, ClearPollsResultRef } from "./types";
import { pluginMapPollInputSchema } from "./inputs";

// Log a new poll from any of the 4 contexts
export async function logPluginMapPollResolver(
  _parent: unknown,
  args: {
    input: {
      userId: string;
      userRole: string;
      organizationId?: string | null;
      extensionPoint: string;
    };
  },
  ctx: GraphQLContext
) {
  if (!ctx.currentClient.isAuthenticated) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
  }

  const {
    success,
    data: parsedArgs,
    error,
  } = pluginMapPollInputSchema.safeParse(args.input);

  if (!success) {
    ctx.log?.error("Invalid arguments for logPluginMapPoll:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }

  try {
    // Get the next poll number
    const maxPollResult = await ctx.drizzleClient
      .select({
        maxPollNumber: sql<number>`COALESCE(MAX(${pollsTable.pollNumber}), 0)`,
      })
      .from(pollsTable);

    const maxPollNumber = maxPollResult[0]?.maxPollNumber || 0;
    const nextPollNumber = maxPollNumber + 1;

    // Insert the new poll
    const [newPoll] = await ctx.drizzleClient
      .insert(pollsTable)
      .values({
        pollNumber: nextPollNumber,
        userId: parsedArgs.userId,
        userRole: parsedArgs.userRole,
        organizationId: parsedArgs.organizationId,
        extensionPoint: parsedArgs.extensionPoint,
      })
      .returning();

    ctx.log?.info(
      `Plugin Map: Logged poll ${nextPollNumber} from ${parsedArgs.extensionPoint} by ${parsedArgs.userRole} ${parsedArgs.userId}`
    );

    return newPoll;
  } catch (error) {
    ctx.log?.error("Error logging plugin map poll:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Clear all logged polls
export async function clearPluginMapPollsResolver(
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
    // Get count before deletion
    const countResult = await ctx.drizzleClient
      .select({ count: sql<number>`count(*)` })
      .from(pollsTable);

    const count = countResult[0]?.count || 0;

    // Delete all polls
    await ctx.drizzleClient.delete(pollsTable);

    ctx.log?.info(`Plugin Map: Cleared ${count} logged polls`);

    return {
      success: true,
      clearedCount: count,
      message: `Cleared ${count} polls`,
    };
  } catch (error) {
    ctx.log?.error("Error clearing plugin map polls:", error);
    throw new TalawaGraphQLError({
      extensions: { code: "unexpected" },
    });
  }
}

// Register all Plugin Map mutations with the builder
export function registerPluginMapMutations(
  builderInstance: typeof builder
): void {
  // Log plugin map poll
  builderInstance.mutationField("logPluginMapPoll", (t) =>
    t.field({
      type: PluginMapPollRef,
      args: {
        input: t.arg({
          type: builder.inputType("PluginMapPollInput", {
            fields: (t) => ({
              userId: t.string({ required: true }),
              userRole: t.string({ required: true }),
              organizationId: t.string({ required: false }),
              extensionPoint: t.string({ required: true }),
            }),
          }),
          required: true,
        }),
      },
      description: "Log a new plugin map poll",
      resolve: logPluginMapPollResolver,
    })
  );

  // Clear plugin map polls
  builderInstance.mutationField("clearPluginMapPolls", (t) =>
    t.field({
      type: ClearPollsResultRef,
      description: "Clear all logged plugin map polls",
      resolve: clearPluginMapPollsResolver,
    })
  );
}
