[Plugin Docs](/)

***

# Class: RazorpayService

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:65](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L65)

Service class for handling Razorpay payment gateway operations.
Manages orders, payments, verification, and webhooks.

## Constructors

### Constructor

> **new RazorpayService**(`context`, `razorpayInstance?`): `RazorpayService`

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:69](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L69)

#### Parameters

##### context

`GraphQLContext`

##### razorpayInstance?

`Razorpay`

#### Returns

`RazorpayService`

## Methods

### createOrder()

> **createOrder**(`orderData`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:111](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L111)

Creates a new payment order in Razorpay.

#### Parameters

##### orderData

[`RazorpayOrderData`](../interfaces/RazorpayOrderData.md)

The order details including amount, currency, and receipt.

#### Returns

`Promise`\<`any`\>

The created Razorpay order object.

#### Throws

Error if API credentials are invalid or unrelated errors occur.

***

### createPayment()

> **createPayment**(`paymentData`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:182](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L182)

Creates a payment entry in Razorpay (note: usually handled on client side, but this wraps server-side creating if needed).

#### Parameters

##### paymentData

[`RazorpayPaymentData`](../interfaces/RazorpayPaymentData.md)

Payment details.

#### Returns

`Promise`\<`any`\>

The created payment object.

***

### getPaymentDetails()

> **getPaymentDetails**(`paymentId`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:458](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L458)

Fetches details of a specific payment from Razorpay.

#### Parameters

##### paymentId

`string`

The ID of the payment to fetch.

#### Returns

`Promise`\<`any`\>

The payment details object.

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:81](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L81)

Initializes the Razorpay instance with credentials from the database.
Fetches configuration from `configTable`.

#### Returns

`Promise`\<`void`\>

#### Throws

Error if configuration is missing or incomplete.

***

### processWebhook()

> **processWebhook**(`webhookData`): `Promise`\<`void`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:353](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L353)

Processes a verified webhook event from Razorpay.
Updates order and transaction status based on the event payload.

#### Parameters

##### webhookData

[`RazorpayWebhookData`](../interfaces/RazorpayWebhookData.md)

The parsed webhook data.

#### Returns

`Promise`\<`void`\>

***

### refundPayment()

> **refundPayment**(`paymentId`, `amount?`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:479](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L479)

Initiates a refund for a specific payment.

#### Parameters

##### paymentId

`string`

The ID of the payment to refund.

##### amount?

`number`

Optional amount to refund (if partial).

#### Returns

`Promise`\<`any`\>

The refund object.

***

### testConnection()

> **testConnection**(): `Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:501](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L501)

Tests the connection to Razorpay API using current configuration.

#### Returns

`Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

Object containing success status and message.

***

### verifyPayment()

> **verifyPayment**(`paymentId`, `orderId`, `signature`, `paymentData`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:212](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L212)

Verifies a payment signature using the webhook secret.

#### Parameters

##### paymentId

`string`

The ID of the payment.

##### orderId

`string`

The ID of the order.

##### signature

`string`

The signature to verify.

##### paymentData

`string`

The data payload to verify against.

#### Returns

`Promise`\<`boolean`\>

Boolean indicating if the signature is valid.

***

### verifyPaymentSignature()

> **verifyPaymentSignature**(`orderId`, `paymentId`, `signature`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:268](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L268)

Verifies the signature of a payment associated with an order using the Key Secret.

#### Parameters

##### orderId

`string`

The Razorpay order ID.

##### paymentId

`string`

The Razorpay payment ID.

##### signature

`string`

The signature generated by Razorpay.

#### Returns

`Promise`\<`boolean`\>

Boolean indicating if the signature is valid.

***

### verifyWebhookSignature()

> **verifyWebhookSignature**(`webhookBody`, `signature`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:314](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Razorpay/api/services/razorpayService.ts#L314)

Verifies the signature of a webhook payload.

#### Parameters

##### webhookBody

`string`

The raw body of the webhook request.

##### signature

`string`

The X-Razorpay-Signature header value.

#### Returns

`Promise`\<`boolean`\>

Boolean indicating if the signature is valid.
