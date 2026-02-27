[Plugin Docs](/)

***

# Function: getOrganizationTransactionStatsResolver()

> **getOrganizationTransactionStatsResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `averageTransactionAmount`: `number`; `currency`: `any`; `failedTransactions`: `any`; `successfulTransactions`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>

Defined in: [plugins/razorpay/api/graphql/queries.ts:430](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/razorpay/api/graphql/queries.ts#L430)

## Parameters

### \_parent

`unknown`

### args

#### dateFrom?

`string` = `...`

#### dateTo?

`string` = `...`

#### organizationId

`string` = `...`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `averageTransactionAmount`: `number`; `currency`: `any`; `failedTransactions`: `any`; `successfulTransactions`: `any`; `totalAmount`: `any`; `totalTransactions`: `any`; \}\>
