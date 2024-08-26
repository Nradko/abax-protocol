import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { deposit } from 'tests/scenarios/utils/actions';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/test_psp22';

const RESERVE_UNDERLYING_ADDRESS = '5HPKPXW3vjbY2zrLYZY56mu1aryxfpEvQ1fWnwJwhbJZbkF5';
const LENDING_POOL_ADDRESS = '5EKSauepfGB3SxFSMCfhcurSb7ZvN7g6khtbySuJ6X7tHnep';

const IS_COLLATERAL_TO_SET = true;

(async () => {
  if (require.main !== module) return;
  const wsEndpoint = 'wss://ws.test.azero.dev';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed, set SEED env variable';
  const api = await getApiProviderWrapper(wsEndpoint).getAndWaitForReady();
  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');

  const lendingPool = new LendingPoolContract(LENDING_POOL_ADDRESS, signer, api);

  (await lendingPool.withSigner(signer).query.setAsCollateral(RESERVE_UNDERLYING_ADDRESS, IS_COLLATERAL_TO_SET)).value.unwrapRecursively();
  await lendingPool.withSigner(signer).tx.setAsCollateral(RESERVE_UNDERLYING_ADDRESS, IS_COLLATERAL_TO_SET);

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
