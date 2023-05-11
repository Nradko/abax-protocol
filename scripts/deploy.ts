import path from 'path';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';
import fs from 'fs-extra';
import Keyring from '@polkadot/keyring';
import { deployAndConfigureSystem, deployBlockTimestampProvider } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? process.env.PWD;
  if (!outputJsonFolder) throw 'could not determine path';
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';
  const api = await apiProviderWrapper.getAndWaitForReady();

  const timestamp = await api.query.timestamp.now();
  console.log(new Date(parseInt(timestamp.toString())));

  const keyring = new Keyring();
  const owner = keyring.createFromUri(seed, {}, 'sr25519');
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.azero.testnet.json');

  console.log(`owner: ${owner.address}`);
  const system = await deployAndConfigureSystem({ shouldUseMockTimestamp: false }, deployPath);

  console.log(`lendingPool: ${system.lendingPool}`);

  await api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
