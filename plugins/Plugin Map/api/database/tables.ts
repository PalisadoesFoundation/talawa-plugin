import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

// Plugin Map Requests table - logs requests from different contexts
export const pluginMapRequestsTable = pgTable("plugin_map_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestNumber: integer("request_number").notNull(), // Auto-incrementing request number
  requestType: text("request_type").notNull(), // 'admin_global', 'admin_org', 'user_global', 'user_org'
  requestSource: text("request_source").notNull(), // Which extension sent the request
  message: text("message").notNull(), // Simple message like "Request 1", "Request 2", etc.
  metadata: text("metadata"), // Optional additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// Debug exports to help with module loading
export const __debug = {
  tables: {
    pluginMapRequestsTable,
  },
};
