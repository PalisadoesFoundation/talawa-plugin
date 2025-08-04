import { builder } from "~/src/graphql/builder";

// PluginMapPoll type
export const PluginMapPollRef = builder.objectRef<{
  id: string;
  pollNumber: number;
  userId: string;
  userRole: string;
  organizationId: string | null;
  extensionPoint: string;
  createdAt: Date | null;
}>("PluginMapPoll");

PluginMapPollRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    pollNumber: t.exposeInt("pollNumber"),
    userId: t.exposeString("userId"),
    userRole: t.exposeString("userRole"),
    organizationId: t.exposeString("organizationId", { nullable: true }),
    extensionPoint: t.exposeString("extensionPoint"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});

// PluginMapPollsResult type
export const PluginMapPollsResultRef = builder.objectRef<{
  polls: Array<{
    id: string;
    pollNumber: number;
    userId: string;
    userRole: string;
    organizationId: string | null;
    extensionPoint: string;
    createdAt: Date | null;
  }>;
  totalCount: number;
  hasMore: boolean;
}>("PluginMapPollsResult");

PluginMapPollsResultRef.implement({
  fields: (t) => ({
    polls: t.field({
      type: t.listRef(PluginMapPollRef),
      resolve: (parent) => parent.polls,
    }),
    totalCount: t.exposeInt("totalCount"),
    hasMore: t.exposeBoolean("hasMore"),
  }),
});

// ClearPollsResult type
export const ClearPollsResultRef = builder.objectRef<{
  success: boolean;
  clearedCount: number;
  message: string;
}>("ClearPollsResult");

ClearPollsResultRef.implement({
  fields: (t) => ({
    success: t.exposeBoolean("success"),
    clearedCount: t.exposeInt("clearedCount"),
    message: t.exposeString("message"),
  }),
});
