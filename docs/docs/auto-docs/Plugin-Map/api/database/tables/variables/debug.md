[Plugin Docs](/)

***

# Variable: \_\_debug

> `const` **\_\_debug**: `object`

Defined in: [plugins/Plugin Map/api/database/tables.ts:30](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Plugin Map/api/database/tables.ts#L30)

## Type Declaration

### tables

> **tables**: `object`

#### tables.pollsTable

> **pollsTable**: `PgTableWithColumns`\<\{ \}\>

Plugin Map Polls Table Definition.

Represents the `plugin_map_polls` table in the database.
This table stores "polls" or requests made from the frontend to specific extension points,
serving as a logging mechanism to visualize plugin activity.

Columns:
- `id`: UUID primary key.
- `pollNumber`: Incrementing integer sequence for easy human reference.
- `userId`: ID of the user triggering the request.
- `userRole`: Role of the user (e.g., 'User', 'Admin').
- `organizationId`: Optional organization ID context.
- `extensionPoint`: The specific extension point triggered (e.g., 'RA1', 'RU2').
- `createdAt`: Timestamp of creation.
