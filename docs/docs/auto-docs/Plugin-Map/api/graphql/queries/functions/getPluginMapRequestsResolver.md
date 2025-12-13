[Plugin Docs](/)

***

# Function: getPluginMapRequestsResolver()

> **getPluginMapRequestsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `hasMore`: `boolean`; `requests`: `any`; `totalCount`: `any`; \}\>

Defined in: [plugins/Plugin Map/api/graphql/queries.ts:88](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Plugin Map/api/graphql/queries.ts#L88)

## Parameters

### \_parent

`unknown`

### args

#### input?

\{ `extensionPoint?`: `string`; `organizationId?`: `string`; `userId?`: `string`; `userRole?`: `string`; \}

#### input.extensionPoint?

`string`

#### input.organizationId?

`string`

#### input.userId?

`string`

#### input.userRole?

`string`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `hasMore`: `boolean`; `requests`: `any`; `totalCount`: `any`; \}\>
