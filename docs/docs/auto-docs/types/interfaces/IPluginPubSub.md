[Plugin Docs](/)

***

# Interface: IPluginPubSub

Defined in: [plugins/types.ts:116](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L116)

Interface for PubSub operations available to plugins

## Methods

### asyncIterator()

> **asyncIterator**\<`T`\>(`triggers`): `AsyncIterator`\<`T`\>

Defined in: [plugins/types.ts:118](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L118)

#### Type Parameters

##### T

`T`

#### Parameters

##### triggers

`string` | `string`[]

#### Returns

`AsyncIterator`\<`T`\>

***

### publish()

> **publish**(`triggerName`, `payload`): `void` \| `Promise`\<`void`\>

Defined in: [plugins/types.ts:117](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L117)

#### Parameters

##### triggerName

`string`

##### payload

`any`

#### Returns

`void` \| `Promise`\<`void`\>
