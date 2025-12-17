[Plugin Docs](/)

***

# Interface: IPluginLifecycle

Defined in: [plugins/types.ts:32](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L32)

Plugin lifecycle interface

Defines the contract for plugin lifecycle hooks that must be implemented
by all plugins to ensure proper initialization, activation, and cleanup.

## Properties

### onActivate()?

> `optional` **onActivate**: (`context?`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:43](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L43)

Called when plugin is activated
Use for validation, SDK initialization, and resource setup

#### Parameters

##### context?

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onDeactivate()?

> `optional` **onDeactivate**: (`context?`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:49](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L49)

Called when plugin is deactivated
Use for cleanup, canceling operations, and releasing resources

#### Parameters

##### context?

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onInstall()?

> `optional` **onInstall**: (`context?`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:61](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L61)

Called when plugin is first installed
Use for creating default configuration, database records, webhooks

#### Parameters

##### context?

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onLoad()?

> `optional` **onLoad**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:37](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L37)

Called when plugin is loaded into memory
Use for initial setup and resource allocation

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUninstall()?

> `optional` **onUninstall**: (`context?`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:67](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L67)

Called when plugin is uninstalled
Use for removing configuration, cleaning up data, unregistering webhooks

#### Parameters

##### context?

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUnload()?

> `optional` **onUnload**: (`context`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:55](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L55)

Called when plugin is unloaded from memory
Use for final cleanup and resource release

#### Parameters

##### context

[`IPluginContext`](IPluginContext.md)

#### Returns

`Promise`\<`void`\>

***

### onUpdate()?

> `optional` **onUpdate**: (`fromVersion`, `toVersion`) => `Promise`\<`void`\>

Defined in: [plugins/types.ts:75](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/types.ts#L75)

Called when plugin is updated from one version to another
Use for database migrations, configuration transformations

#### Parameters

##### fromVersion

`string`

Previous plugin version

##### toVersion

`string`

New plugin version

#### Returns

`Promise`\<`void`\>
