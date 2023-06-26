import chalk from 'chalk';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { readContractsFromFile } from 'tests/setup/nodePersistence';
import { getArgvObj } from '@abaxfinance/utils';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const address = (args['address'] as string) ?? process.argv[2] ?? process.env.PWD;
  const supplyOnBehalfOf = (args['address'] as string) ?? process.argv[3] ?? process.env.PWD;
  const api = await apiProviderWrapper.getAndWaitForReady();

  const testEnv = await readContractsFromFile('deployedContracts.json');
  for (const reserve of Object.values(testEnv.reserves)) {
    if (supplyOnBehalfOf === 'true') {
      const depositAmount = '10000';
      await reserve.underlying.withSigner(testEnv.owner).tx.approve(testEnv.owner.address, depositAmount);
      await testEnv.lendingPool.query.deposit(reserve.underlying.address, address, depositAmount, []);
      await testEnv.lendingPool.tx.deposit(reserve.underlying.address, address, depositAmount, []);
    }
    const reserveV = (await testEnv.lendingPool.query.viewReserveData(reserve.underlying.address)).value.unwrap();
    const { value } = await testEnv.lendingPool.query.viewUserReserveData(reserve.underlying.address, address);

    console.log(value, reserveV?.totalSupplied.toString(), reserve.underlying.address, address);
  }

  api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
