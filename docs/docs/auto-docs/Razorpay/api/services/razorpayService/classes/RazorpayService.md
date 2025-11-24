[Plugin Docs](/)

***

# Class: RazorpayService

Defined in: [Razorpay/api/services/razorpayService.ts:61](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L61)

## Constructors

### Constructor

> **new RazorpayService**(`context`): `RazorpayService`

Defined in: [Razorpay/api/services/razorpayService.ts:65](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L65)

#### Parameters

##### context

`GraphQLContext`

#### Returns

`RazorpayService`

## Methods

### createOrder()

> **createOrder**(`orderData`): `Promise`\<`any`\>

Defined in: [Razorpay/api/services/razorpayService.ts:93](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L93)

#### Parameters

##### orderData

[`RazorpayOrderData`](../interfaces/RazorpayOrderData.md)

#### Returns

`Promise`\<`any`\>

***

### createPayment()

> **createPayment**(`paymentData`): `Promise`\<`any`\>

Defined in: [Razorpay/api/services/razorpayService.ts:159](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L159)

#### Parameters

##### paymentData

[`RazorpayPaymentData`](../interfaces/RazorpayPaymentData.md)

#### Returns

`Promise`\<`any`\>

***

### getPaymentDetails()

> **getPaymentDetails**(`paymentId`): `Promise`\<`any`\>

Defined in: [Razorpay/api/services/razorpayService.ts:349](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L349)

#### Parameters

##### paymentId

`string`

#### Returns

`Promise`\<`any`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [Razorpay/api/services/razorpayService.ts:69](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L69)

#### Returns

`Promise`\<`void`\>

***

### processWebhook()

> **processWebhook**(`webhookData`): `Promise`\<`void`\>

Defined in: [Razorpay/api/services/razorpayService.ts:249](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L249)

#### Parameters

##### webhookData

[`RazorpayWebhookData`](../interfaces/RazorpayWebhookData.md)

#### Returns

`Promise`\<`void`\>

***

### refundPayment()

> **refundPayment**(`paymentId`, `amount?`): `Promise`\<`any`\>

Defined in: [Razorpay/api/services/razorpayService.ts:364](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L364)

#### Parameters

##### paymentId

`string`

##### amount?

`number`

#### Returns

`Promise`\<`any`\>

***

### testConnection()

> **testConnection**(): `Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

Defined in: [Razorpay/api/services/razorpayService.ts:382](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L382)

#### Returns

`Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

***

### verifyPayment()

> **verifyPayment**(`paymentId`, `orderId`, `signature`, `paymentData`): `Promise`\<`boolean`\>

Defined in: [Razorpay/api/services/razorpayService.ts:181](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L181)

#### Parameters

##### paymentId

`string`

##### orderId

`string`

##### signature

`string`

##### paymentData

`string`

#### Returns

`Promise`\<`boolean`\>

***

### verifyWebhookSignature()

> **verifyWebhookSignature**(`webhookBody`, `signature`): `Promise`\<`boolean`\>

Defined in: [Razorpay/api/services/razorpayService.ts:215](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L215)

#### Parameters

##### webhookBody

`string`

##### signature

`string`

#### Returns

`Promise`\<`boolean`\>
