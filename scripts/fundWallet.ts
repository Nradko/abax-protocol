import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import path from 'path';
import { argvObj } from './compile/common';
import chalk from 'chalk';
import { apiProviderWrapper, getSigners } from 'tests/setup/helpers';
import { toE12, toE6 } from 'tests/scenarios/utils/misc';
import { readContractsFromFile } from 'tests/setup/nodePersistence';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const address = (args['address'] as string) ?? process.argv[2] ?? process.env.PWD;
  const amountE12 = (args['amountE12'] as string) ?? process.argv[3] ?? process.env.PWD;
  const api = await apiProviderWrapper.getAndWaitForReady();

  const signers = getSigners();
  await new Promise((resolve, reject) => {
    api.tx.balances
      .transfer(address, toE12(amountE12))
      .signAndSend(signers[2], ({ status }) => {
        if (status.isInBlock) {
          console.log(`Completed at block hash #${status.asInBlock.toString()}`);
          resolve('');
        } else {
          console.log(`Current status: ${status.type}`);
        }
      })
      .catch((error: any) => {
        console.log(':( transaction failed', error);
        reject('');
      });
  });

  const testEnv = await readContractsFromFile('deployedContracts.json');

  for (const reserve of Object.values(testEnv.reserves)) {
    await reserve.underlying.tx.mint(address, toE12(amountE12));
  }

  api.disconnect();
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
