[Plugin Docs](/)

***

# Function: getUserTransactionStatsResolver()

> **getUserTransactionStatsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>

Defined in: [plugins/Razorpay/api/graphql/queries.ts:475](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/graphql/queries.ts#L475)

Resolver for fetching transaction statistics for a specific user.
Returns aggregation of user transactions.

## Parameters

### \_parent

`unknown`

### args

#### dateFrom?

`string` = `...`

#### dateTo?

`string` = `...`

#### userId

`string` = `...`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `currency`: `any`; `failedCount`: `any`; `pendingCount`: `any`; `successCount`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>
