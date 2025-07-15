import { desc, eq, sql } from "drizzle-orm";
import type { GraphQLContext } from "~/src/graphql/context";
import { pluginMapRequestsTable } from "../database/tables";

// Get overview of extension points available in the system
export async function getExtensionPointsOverview(
  _parent: unknown,
  _args: {},
  context: GraphQLContext
) {
  try {
    // This provides a simple overview of extension points
    const extensionPoints = {
      admin: {
        global: {
          routes: [
            { id: "admin_global_dashboard", name: "Dashboard", path: "/dashboard" },
            { id: "admin_global_plugins", name: "Plugins", path: "/plugins" },
            { id: "admin_global_settings", name: "Settings", path: "/settings" },
            { id: "admin_global_users", name: "Users", path: "/users" }
          ],
          drawers: [
            { id: "admin_global_nav", name: "Navigation Drawer", location: "main_nav" },
            { id: "admin_global_sidebar", name: "Sidebar", location: "sidebar" }
          ],
          injectors: [
            { id: "admin_global_header", name: "Header Injector", location: "header" },
            { id: "admin_global_footer", name: "Footer Injector", location: "footer" }
          ]
        },
        organization: {
          routes: [
            { id: "admin_org_overview", name: "Organization Overview", path: "/org/:id" },
            { id: "admin_org_members", name: "Members", path: "/org/:id/members" },
            { id: "admin_org_events", name: "Events", path: "/org/:id/events" },
            { id: "admin_org_settings", name: "Org Settings", path: "/org/:id/settings" }
          ],
          drawers: [
            { id: "admin_org_nav", name: "Organization Navigation", location: "org_nav" },
            { id: "admin_org_tools", name: "Organization Tools", location: "org_tools" }
          ],
          injectors: [
            { id: "admin_org_banner", name: "Organization Banner", location: "org_header" },
            { id: "admin_org_widgets", name: "Organization Widgets", location: "org_sidebar" }
          ]
        }
      },
      user: {
        global: {
          routes: [
            { id: "user_global_profile", name: "User Profile", path: "/profile" },
            { id: "user_global_notifications", name: "Notifications", path: "/notifications" },
            { id: "user_global_preferences", name: "Preferences", path: "/preferences" }
          ],
          drawers: [
            { id: "user_global_menu", name: "User Menu", location: "user_menu" },
            { id: "user_global_quick_actions", name: "Quick Actions", location: "quick_actions" }
          ],
          injectors: [
            { id: "user_global_avatar", name: "Avatar Injector", location: "avatar" },
            { id: "user_global_status", name: "Status Injector", location: "status" }
          ]
        },
        organization: {
          routes: [
            { id: "user_org_dashboard", name: "User Org Dashboard", path: "/user/org/:id" },
            { id: "user_org_events", name: "My Events", path: "/user/org/:id/events" },
            { id: "user_org_posts", name: "Posts", path: "/user/org/:id/posts" }
          ],
          drawers: [
            { id: "user_org_nav", name: "User Org Navigation", location: "user_org_nav" },
            { id: "user_org_shortcuts", name: "Shortcuts", location: "user_shortcuts" }
          ],
          injectors: [
            { id: "user_org_feed", name: "Feed Injector", location: "user_feed" },
            { id: "user_org_actions", name: "Action Buttons", location: "user_actions" }
          ]
        }
      }
    };

    const summary = {
      totalExtensionPoints: 32,
      adminGlobal: 10,
      adminOrganization: 10,
      userGlobal: 6,
      userOrganization: 6,
      lastUpdated: new Date().toISOString()
    };

    return {
      extensionPoints,
      summary
    };
  } catch (error) {
    context.logger?.error("Error getting extension points overview:", error);
    throw new Error("Failed to get extension points overview");
  }
}

// Get all logged requests
export async function getPluginMapRequests(
  _parent: unknown,
  { 
    requestType, 
    limit = 50, 
    offset = 0 
  }: { 
    requestType?: string; 
    limit?: number; 
    offset?: number; 
  },
  context: GraphQLContext
) {
  try {
    const whereConditions = [];
    
    if (requestType) {
      whereConditions.push(eq(pluginMapRequestsTable.requestType, requestType));
    }

    const requests = await context.db
      .select()
      .from(pluginMapRequestsTable)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(pluginMapRequestsTable.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await context.db
      .select({ count: sql<number>`count(*)` })
      .from(pluginMapRequestsTable)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    return {
      requests,
      totalCount: count,
      hasMore: offset + limit < count
    };
  } catch (error) {
    context.logger?.error("Error getting plugin map requests:", error);
    throw new Error("Failed to get plugin map requests");
  }
}
