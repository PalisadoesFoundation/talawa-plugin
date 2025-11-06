[Plugin Docs](/)

***

# Function: initiatePaymentResolver()

> **initiatePaymentResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `amount`: `any`; `currency`: `any`; `message`: `string`; `orderId`: `any`; `paymentId`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `any`; `currency`: `any`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `amount?`: `undefined`; `currency?`: `undefined`; `message`: `string`; `orderId?`: `undefined`; `paymentId?`: `undefined`; `success`: `boolean`; `transaction`: `any`; \}\>

Defined in: [Razorpay/api/graphql/mutations.ts:267](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/graphql/mutations.ts#L267)

## Parameters

### \_parent

`unknown`

### args

`infer`\<`any`\>

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `amount`: `any`; `currency`: `any`; `message`: `string`; `orderId`: `any`; `paymentId`: `string`; `success`: `boolean`; `transaction`: \{ `amount`: `any`; `currency`: `any`; `paymentId`: `string`; `status`: `string`; \}; \} \| \{ `amount?`: `undefined`; `currency?`: `undefined`; `message`: `string`; `orderId?`: `undefined`; `paymentId?`: `undefined`; `success`: `boolean`; `transaction`: `any`; \}\>
