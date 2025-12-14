[Plugin Docs](/)

***

# Class: RazorpayService

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:61](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L61)

## Constructors

### Constructor

> **new RazorpayService**(`context`, `razorpayInstance?`): `RazorpayService`

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:65](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L65)

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

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:96](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L96)

#### Parameters

##### orderData

[`RazorpayOrderData`](../interfaces/RazorpayOrderData.md)

#### Returns

`Promise`\<`any`\>

***

### createPayment()

> **createPayment**(`paymentData`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:162](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L162)

#### Parameters

##### paymentData

[`RazorpayPaymentData`](../interfaces/RazorpayPaymentData.md)

#### Returns

`Promise`\<`any`\>

***

### getPaymentDetails()

> **getPaymentDetails**(`paymentId`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:403](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L403)

#### Parameters

##### paymentId

`string`

#### Returns

`Promise`\<`any`\>

***

### initialize()

> **initialize**(): `Promise`\<`void`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:72](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L72)

#### Returns

`Promise`\<`void`\>

***

### processWebhook()

> **processWebhook**(`webhookData`): `Promise`\<`void`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:303](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L303)

#### Parameters

##### webhookData

[`RazorpayWebhookData`](../interfaces/RazorpayWebhookData.md)

#### Returns

`Promise`\<`void`\>

***

### refundPayment()

> **refundPayment**(`paymentId`, `amount?`): `Promise`\<`any`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:418](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L418)

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

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:436](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L436)

#### Returns

`Promise`\<\{ `message`: `string`; `success`: `boolean`; \}\>

***

### verifyPayment()

> **verifyPayment**(`paymentId`, `orderId`, `signature`, `paymentData`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:184](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L184)

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

### verifyPaymentSignature()

> **verifyPaymentSignature**(`orderId`, `paymentId`, `signature`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:231](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L231)

#### Parameters

##### orderId

`string`

##### paymentId

`string`

##### signature

`string`

#### Returns

`Promise`\<`boolean`\>

***

### verifyWebhookSignature()

> **verifyWebhookSignature**(`webhookBody`, `signature`): `Promise`\<`boolean`\>

Defined in: [plugins/Razorpay/api/services/razorpayService.ts:269](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/Razorpay/api/services/razorpayService.ts#L269)

#### Parameters

##### webhookBody

`string`

##### signature

`string`

#### Returns

`Promise`\<`boolean`\>
