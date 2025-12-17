[Plugin Docs](/)

***

# Interface: IPluginLifecycle\<TDb, TConfig\>

Defined in: [plugins/types.ts:44](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L44)

Plugin lifecycle interface

Defines the contract for plugin lifecycle hooks that must be implemented
by all plugins to ensure proper initialization, activation, and cleanup.
All hooks receive a context object for accessing shared resources.

## Type Parameters

### TDb

`TDb` = `unknown`

### TConfig

`TConfig` = `Record`\<`string`, `unknown`\>

## Properties

### onActivate()?

> `optional` **onActivate**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:60](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L60)

Called when plugin is activated
Use for validation, SDK initialization, and resource setup

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onDeactivate()?

> `optional` **onDeactivate**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:67](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L67)

Called when plugin is deactivated
Use for cleanup, canceling operations, and releasing resources

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onInstall()?

> `optional` **onInstall**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:81](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L81)

Called when plugin is first installed
Use for creating default configuration, database records, webhooks

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onLoad()?

> `optional` **onLoad**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:53](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L53)

Called when plugin is loaded into memory
Use for initial setup and resource allocation

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onUninstall()?

> `optional` **onUninstall**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:88](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L88)

Called when plugin is uninstalled
Use for removing configuration, cleaning up data, unregistering webhooks

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onUnload()?

> `optional` **onUnload**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:74](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L74)

Called when plugin is unloaded from memory
Use for final cleanup and resource release

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>

***

### onUpdate()?

> `optional` **onUpdate**: (`fromVersion`, `toVersion`, `context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:97](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L97)

Called when plugin is updated from one version to another
Use for database migrations, configuration transformations

#### Parameters

##### fromVersion

`string`

Previous plugin version

##### toVersion

`string`

New plugin version

##### context

[`IPluginContext`](IPluginContext.md)\<`TDb`, `TConfig`\>

Plugin context with db, logger, and config

#### Returns

`Promise`\<`void`\>
