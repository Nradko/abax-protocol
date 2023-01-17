import { deployAndConfigureSystemProd } from 'tests/setup/deploymentHelpers';
import path from 'path';
import { argvObj } from './compile/common';
import chalk from 'chalk';
import fs from 'fs-extra';
import { AddRuleDeploymentData, ReserveTokenDeploymentData } from 'tests/setup/testEnvConsts';
import { apiProviderWrapper } from 'tests/setup/helpers';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? process.env.PWD;
  if (!outputJsonFolder) throw 'could not determine path';
  await (await apiProviderWrapper.getAndWaitForReady()).connect();
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.json');

  const reserveDatas = JSON.parse(await fs.readFile(`${path.join(__dirname, 'reserveTokens.json')}`, 'utf8')) as ReserveTokenDeploymentData[];
  const rules = fs.readJSONSync(path.join(__dirname, 'rules.json')) as AddRuleDeploymentData[];
  await deployAndConfigureSystemProd({ reserveDatas, rules, owner: null as any }, deployPath);
  await (await apiProviderWrapper.getAndWaitForReady()).disconnect();
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
