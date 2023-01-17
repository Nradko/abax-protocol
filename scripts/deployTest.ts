import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import path from 'path';
import { argvObj } from './compile/common';
import chalk from 'chalk';
import { apiProviderWrapper } from 'tests/setup/helpers';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? process.env.PWD;
  if (!outputJsonFolder) throw 'could not determine path';
  const api = await apiProviderWrapper.getAndWaitForReady();
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.json');

  await deployAndConfigureSystem(undefined, deployPath);
  api.disconnect();
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
