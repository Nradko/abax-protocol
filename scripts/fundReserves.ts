import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import path from 'path';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';
import { apiProviderWrapper, getSigners } from 'tests/setup/helpers';
import { toE12, toE6 } from '@abaxfinance/utils';
import { readContractsFromFile } from 'tests/setup/nodePersistence';
import { approve, convertToCurrencyDecimals } from 'tests/scenarios/utils/actions';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const amountArg = (args['amount'] as string) ?? process.argv[2];
  const api = await apiProviderWrapper.getAndWaitForReady();

  const [owner] = getSigners();

  const testEnv = await readContractsFromFile('deployedContracts.json');

  for (const [symbol, reserve] of Object.entries(testEnv.reserves)) {
    console.log(symbol);
    const amount = await convertToCurrencyDecimals(reserve.underlying, amountArg);
    console.log('mint');
    await reserve.underlying.tx.mint(owner.address, amount);
    console.log('approve');
    await approve(symbol, owner, testEnv, amount);
    console.log('deposit');
    await testEnv.lendingPool.withSigner(owner).tx.deposit(reserve.underlying.address, owner.address, amount, []);
  }

  api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
