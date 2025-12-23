[Plugin Docs](/)

***

# Function: registerPluginMapMutations()

> **registerPluginMapMutations**(`builderInstance`): `void`

Defined in: [plugins/Plugin Map/api/graphql/mutations.ts:277](https://github.com/PalisadoesFoundation/talawa-plugin/tree/main/plugins/Plugin Map/api/graphql/mutations.ts#L277)

Registers all Plugin Map mutations with the GraphQL builder.

This function exposes the following mutations:
- `logPluginMapRequest`: Logs user/admin interaction.
- `clearPluginMapRequests`: Clears interaction logs.
- `logPluginMapPoll`: Logs generic polls.
- `clearPluginMapPolls`: Clears generic poll logs.

## Parameters

### builderInstance

`any`

The Pothos schema builder instance.

## Returns

`void`
