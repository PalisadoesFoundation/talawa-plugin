[Plugin Docs](/)

***

# Function: getOrganizationTransactionStatsResolver()

> **getOrganizationTransactionStatsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>

Defined in: [plugins/Razorpay/api/graphql/queries.ts:374](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/graphql/queries.ts#L374)

## Parameters

### \_parent

`unknown`

### args

#### dateFrom?

`string` = `...`

#### dateTo?

`string` = `...`

#### orgId?

`string` = `...`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>
