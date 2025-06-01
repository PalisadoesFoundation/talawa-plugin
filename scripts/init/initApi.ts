// scripts/initAPI.ts
import { spinner } from '@clack/prompts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Scaffolds the Server/API side of a plugin.
 *
 * tree:
 * plugins/<name>/api/
 * ├─ graphql/
 * │  ├─ schema.graphql
 * │  └─ resolvers.ts
 * ├─ services/
 * │  └─ index.ts
 * └─ migrations/
 *    └─ README.md
 */
export function createAPISkeleton(
  pluginName: string,
  pluginsRoot = 'plugins',
): void {
  const s = spinner();
  s.start('Creating API skeleton…');

  const apiRoot = join(pluginsRoot, pluginName, 'api');
  const gqlDir = join(apiRoot, 'graphql');
  const svcDir = join(apiRoot, 'services');
  const migDir = join(apiRoot, 'migrations');

  [gqlDir, svcDir, migDir].forEach((d) => mkdirSync(d, { recursive: true }));

  // GraphQL schema & resolver stubs
  writeFileSync(
    join(gqlDir, 'schema.graphql'),
    `# GraphQL extension for ${pluginName}
extend type Query {
  ${pluginName}Hello: String!
}
`,
  );

  writeFileSync(
    join(gqlDir, 'resolvers.ts'),
    `import { Resolvers } from '@talawa-api/types';

export const resolvers: Resolvers = {
  Query: {
    ${pluginName}Hello: () => 'Hello from ${pluginName} API',
  },
};
`,
  );

  // Service layer stub
  writeFileSync(
    join(svcDir, 'index.ts'),
    `export class ${pascal(pluginName)}Service {
  hello() {
    return 'Business logic for ${pluginName}';
  }
}
`,
  );

  // Migration placeholder
  writeFileSync(
    join(migDir, 'README.md'),
    `Place SQL migration files here. They will run on plugin install / uninstall.`,
  );

  s.stop('API skeleton created.');
}

// ──────────────────────────────────────────────────────────────
function pascal(str: string): string {
  return str
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}
