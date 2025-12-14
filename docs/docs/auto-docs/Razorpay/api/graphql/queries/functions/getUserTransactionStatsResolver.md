[Plugin Docs](/)

***

# Function: getUserTransactionStatsResolver()

> **getUserTransactionStatsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>

Defined in: [plugins/Razorpay/api/graphql/queries.ts:460](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/graphql/queries.ts#L460)

## Parameters

### \_parent

`unknown`

### args

#### dateFrom?

`string` = `...`

#### dateTo?

`string` = `...`

#### userId?

`string` = `...`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>
