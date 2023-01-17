import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import chalk from 'chalk';
import { measureTime2 } from './utils';
import { apiProviderWrapper } from 'tests/setup/helpers';

(async () => {
  if (require.main !== module) return;

  await apiProviderWrapper.getAndWaitForReady();
  console.log('Benchmark setup...');
  const {
    lendingPool,
    users: [sender],
    reserves,
  } = await deployAndConfigureSystem();
  const reserve = reserves['DAI'].underlying;
  const amountToDeposit = '1000';
  const SAMPLE_SIZE = 1_000;

  const withQueryMarkId = 'WITH_QUERY';
  const withoutQueryMarkId = 'WITHOUT_QUERY';

  const lendingPoolAsSender = lendingPool.withSigner(sender);
  const args: Parameters<typeof lendingPool.tx.deposit> = [reserve.address, sender.address, amountToDeposit];
  await reserve.tx.mint(sender.address, '1000000000000000000000000000000');
  await reserve.withSigner(sender).methods.approve(lendingPool.address, '1000000000000000000000000000000', {});

  console.log('Starting benchmark...');
  const withQueryResult = await measureTime2(SAMPLE_SIZE, withQueryMarkId, async () => {
    await lendingPoolAsSender.query.deposit(...args);
    await lendingPoolAsSender.tx.deposit(...args);
  });
  const withoutQueryResult = await measureTime2(SAMPLE_SIZE, withoutQueryMarkId, async () => {
    await lendingPoolAsSender.tx.deposit(...args);
  });

  console.table([withQueryResult, withoutQueryResult]);
  console.log(`With query was ${withQueryResult.duration / withoutQueryResult.duration} times slower`);
  await (await apiProviderWrapper.getAndWaitForReady()).disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
