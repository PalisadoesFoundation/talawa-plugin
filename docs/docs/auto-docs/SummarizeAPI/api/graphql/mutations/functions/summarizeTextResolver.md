[Plugin Docs](/)

***

# Function: summarizeTextResolver()

> **summarizeTextResolver**(`_parent`, `args`, `ctx`): `Promise`\<\{ `originalLength`: `number`; `postId`: `string`; `summary`: `string`; `summaryLength`: `number`; \}\>

Defined in: [plugins/SummarizeAPI/api/graphql/mutations.ts:137](https://github.com/PalisadoesFoundation/talawa-plugin/tree/mainplugins/SummarizeAPI/api/graphql/mutations.ts#L137)

## Parameters

### \_parent

`unknown`

### args

#### input

\{ `postId?`: `string`; `text`: `string`; \} = `summarizeAPIInputSchema`

#### input.postId?

`string` = `...`

#### input.text

`string` = `...`

### ctx

`GraphQLContext`

## Returns

`Promise`\<\{ `originalLength`: `number`; `postId`: `string`; `summary`: `string`; `summaryLength`: `number`; \}\>
