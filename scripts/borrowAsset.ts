import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { deposit } from 'tests/scenarios/utils/actions';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/psp22_for_audit';

const PSP22Decimals = 18;

const RESERVE_UNDERLYING_ADDRESS = 'FILL HERE';
const LENDING_POOL_ADDRESS = 'FILL HERE';
const ON_BEHALF_OF: string | null = null; //defaults to signer
const AMOUNT = 1000;

// const DEPOSIT_AMOUNT =
function toTokenDecimals(amount: number | string | BN) {
  return new BN(amount).mul(new BN(10).pow(new BN(PSP22Decimals)));
}

(async () => {
  if (require.main !== module) return;
  const wsEndpoint = 'wss://ws.test.azero.dev';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed, set SEED env variable';
  const api = await getApiProviderWrapper(wsEndpoint).getAndWaitForReady();
  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');

  const lendingPool = new LendingPoolContract(LENDING_POOL_ADDRESS, signer, api);

  const onBehalfOfArg = ON_BEHALF_OF ? ON_BEHALF_OF : signer.address;

  await lendingPool.withSigner(signer).tx.borrow(RESERVE_UNDERLYING_ADDRESS, onBehalfOfArg, toTokenDecimals(AMOUNT), []);

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
