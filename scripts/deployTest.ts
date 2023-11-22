import { deployAndConfigureSystem, deployDiaOracle } from 'tests/setup/deploymentHelpers';
import path from 'path';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';
import { apiProviderWrapper, getSigners } from 'tests/setup/helpers';
import { increaseBlockTimestamp } from 'tests/scenarios/utils/misc';
import { storeTimestamp } from 'tests/setup/nodePersistence';

(async (args: Record<string, string>) => {
  if (require.main !== module) return;
  const outputJsonFolder = args['path'] ?? process.env.PWD;
  const shouldUseMockTimestamp = (args['shouldUseMockTimestamp'] === 'true' || args['shouldUseMockTimestamp'] === '1') ?? true;
  if (!outputJsonFolder) throw 'could not determine path';
  const api = await apiProviderWrapper.getAndWaitForReady();
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.json');

  // to force mining first block and initializeing timestamp
  const signer = getSigners()[0];
  await deployDiaOracle(signer);
  // to force using fake_time
  await increaseBlockTimestamp(0);
  await deployAndConfigureSystem({ shouldUseMockTimestamp }, deployPath);
  await storeTimestamp();
  api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
