[Plugin Docs](/)

***

# Interface: IPluginContext\<TDb, TConfig\>

Defined in: [plugins/types.ts:20](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L20)

Plugin context provided to all lifecycle hooks
Contains database, logger, and other shared resources

## Type Parameters

### TDb

`TDb` = `unknown`

Type for the database connection (default: unknown)

### TConfig

`TConfig` = `Record`\<`string`, `unknown`\>

Type for plugin configuration (default: Record<string, unknown>)

## Properties

### config?

> `optional` **config**: `TConfig`

Defined in: [plugins/types.ts:34](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L34)

Plugin configuration from manifest

***

### db?

> `optional` **db**: `TDb`

Defined in: [plugins/types.ts:25](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L25)

Database connection for plugin data access

***

### logger?

> `optional` **logger**: `object`

Defined in: [plugins/types.ts:27](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L27)

Logger instance for plugin logging (use instead of console.*)

#### debug()

> **debug**: (...`args`) => `void`

##### Parameters

###### args

...[`LogArg`](../type-aliases/LogArg.md)[]

##### Returns

`void`

#### error()

> **error**: (...`args`) => `void`

##### Parameters

###### args

...[`LogArg`](../type-aliases/LogArg.md)[]

##### Returns

`void`

#### info()

> **info**: (...`args`) => `void`

##### Parameters

###### args

...[`LogArg`](../type-aliases/LogArg.md)[]

##### Returns

`void`

#### warn()

> **warn**: (...`args`) => `void`

##### Parameters

###### args

...[`LogArg`](../type-aliases/LogArg.md)[]

##### Returns

`void`
