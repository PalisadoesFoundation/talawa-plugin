import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

// Plugin Map Polls table - simple polling system to test requests from frontend
export const pollsTable = pgTable('plugin_map_polls', {
  id: uuid('id').primaryKey().defaultRandom(),
  pollNumber: integer('poll_number').notNull(), // Auto-incrementing poll number
  userId: text('user_id').notNull(), // The user that is polling from the frontend
  userRole: text('user_role').notNull(), // Role of user that is polling
  organizationId: text('organization_id'), // Only if is a org specific route, null for global route
  extensionPoint: text('extension_point').notNull(), // Frontend sends the extension point ID (RA1, RA2, etc.)
  createdAt: timestamp('created_at').defaultNow(),
});

// Debug exports to help with module loading
export const __debug = {
  tables: {
    pollsTable,
  },
};
