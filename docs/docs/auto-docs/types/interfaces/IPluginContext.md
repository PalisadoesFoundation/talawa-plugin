[Plugin Docs](/)

***

# Interface: IPluginContext

Defined in: [plugins/types.ts:12](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L12)

Plugin context provided to lifecycle hooks
Contains database, logger, and other shared resources

## Properties

### config?

> `optional` **config**: `Record`\<`string`, `unknown`\>

Defined in: [plugins/types.ts:23](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L23)

Plugin configuration from manifest

***

### db?

> `optional` **db**: `unknown`

Defined in: [plugins/types.ts:14](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L14)

Database connection for plugin data access

***

### logger?

> `optional` **logger**: `object`

Defined in: [plugins/types.ts:16](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L16)

Logger instance for plugin logging

#### debug()?

> `optional` **debug**: (...`args`) => `void`

##### Parameters

###### args

...`unknown`[]

##### Returns

`void`

#### error()?

> `optional` **error**: (...`args`) => `void`

##### Parameters

###### args

...`unknown`[]

##### Returns

`void`

#### info()?

> `optional` **info**: (...`args`) => `void`

##### Parameters

###### args

...`unknown`[]

##### Returns

`void`

#### warn()?

> `optional` **warn**: (...`args`) => `void`

##### Parameters

###### args

...`unknown`[]

##### Returns

`void`
