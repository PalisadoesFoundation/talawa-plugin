// scripts/initAdmin.ts
import { spinner } from '@clack/prompts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Scaffolds the Admin (web) part of a plugin.
 *
 * tree:
 * plugins/<name>/admin/
 * ├─ components/
 * │  └─ index.tsx
 * ├─ dashboard/
 * │  └─ index.tsx
 * ├─ <name>/
 * │  └─ index.tsx
 * ├─ manifest.json
 * └─ README.md
 */
export function createAdminSkeleton(
  pluginName: string,
  pluginsRoot = 'plugins'
): void {
  const s = spinner();
  s.start('Creating Admin skeleton…');

  const adminRoot = join(pluginsRoot, pluginName, 'admin');
  const componentsDir = join(adminRoot, 'components');
  const dashboardDir = join(adminRoot, 'dashboard');
  const routeDir = join(adminRoot, pluginName);

  // Create all dirs
  [componentsDir, dashboardDir, routeDir].forEach((d) =>
    mkdirSync(d, { recursive: true })
  );

  /* ─────────── components/index.tsx ─────────── */
  writeFileSync(
    join(componentsDir, 'index.tsx'),
    `/**
 * Shared UI widgets for the ${pluginName} Admin module.
 */
export default function ${pascal(pluginName)}UI() {
  return <div>${pluginName} admin works!</div>;
}
`
  );

  /* ─────────── dashboard/index.tsx ─────────── */
  writeFileSync(
    join(dashboardDir, 'index.tsx'),
    `/**
 * Dashboard screen for the ${pluginName} Admin module.
 */
export default function ${pascal(pluginName)}Dashboard() {
  return <div>${pluginName} Dashboard</div>;
}
`
  );

  /* ─────────── custom route ─────────── */
  writeFileSync(
    join(routeDir, 'index.tsx'),
    `/**
 * Custom route entry for the ${pluginName} Admin module.
 */
export default function ${pascal(pluginName)}Route() {
  return <div>Welcome to ${pluginName}</div>;
}
`
  );

  /* ─────────── README.md ─────────── */
  writeFileSync(
    join(adminRoot, 'README.md'),
    `# ${pluginName} – Admin module

This folder contains the React code that extends **Talawa-Admin**.  
Export your main components via **manifest.json** so the Plugin Manager
can mount them at runtime.
`
  );

  /* ─────────── manifest.json ─────────── */
  writeFileSync(
    join(adminRoot, 'manifest.json'),
    JSON.stringify(
      {
        name: pluginName,
        version: '0.1.0',
        description: `Admin UI for ${pluginName} plugin`,
        extensionPoint: '', // e.g. "sidebar", "settings"
        dashboard: true,
        routes: [`/${pluginName}`], // custom paths to register
      },
      null,
      2
    )
  );

  s.stop('Admin skeleton created.');
}

/* ─────────────────────────────────────── */
function pascal(str: string): string {
  return str
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}
