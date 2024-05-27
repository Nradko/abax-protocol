import { stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';
import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { deposit } from 'tests/scenarios/utils/actions';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/psp22_for_audit';

const LENDING_POOL_ADDRESS = '5HCeJm2B9Vj5kzFrtGBEjEbv7xPDxW1QzSZXTixJqTBfycPh';

(async () => {
  if (require.main !== module) return;
  const wsEndpoint = 'wss://ws.test.azero.dev';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed, set SEED env variable';
  const api = await getApiProviderWrapper(wsEndpoint).getAndWaitForReady();
  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');

  const lendingPool = new LendingPoolContract(LENDING_POOL_ADDRESS, signer, api);

  const res = await lendingPool.query.viewMarketRule(0);
  console.log(stringifyNumericProps(res.value));
  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
