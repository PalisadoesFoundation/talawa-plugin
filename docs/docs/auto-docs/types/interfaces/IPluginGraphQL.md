[Plugin Docs](/)

***

# Interface: IPluginGraphQL

Defined in: [plugins/types.ts:109](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L109)

Interface for GraphQL operations available to plugins

## Methods

### execute()

> **execute**(`query`, `variables?`): `Promise`\<`any`\>

Defined in: [plugins/types.ts:110](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L110)

#### Parameters

##### query

`string`

##### variables?

`Record`\<`string`, [`JsonValue`](../type-aliases/JsonValue.md)\>

#### Returns

`Promise`\<`any`\>
