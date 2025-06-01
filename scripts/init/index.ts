// scripts/index.ts
import { intro, outro, isCancel } from '@clack/prompts';
import bold from 'chalk';
import green from 'chalk';
import { promptForPluginName } from './infoName';
import { promptForDocker } from './infoDocker';
import { createAdminSkeleton } from './initAdmin';
import { createAPISkeleton } from './initApi';
import { createAppSkeleton } from './initApp';
import { addDockerConfig } from './initDocker';

const PLUGINS_DIR = 'plugins';

async function main() {
  intro(`${bold('Talawa Plugin Generator')}`);

  try {
    const pluginName = await promptForPluginName();
    createAdminSkeleton(pluginName, PLUGINS_DIR);
    createAPISkeleton(pluginName, PLUGINS_DIR);
    createAppSkeleton(pluginName, PLUGINS_DIR);

    if (await promptForDocker()) {
      addDockerConfig(pluginName, PLUGINS_DIR);
    }

    outro(green(`Plugin “${pluginName}” scaffolded successfully.`));
  } catch (err: unknown) {
    process.exitCode = 1;
  }
}

main();
