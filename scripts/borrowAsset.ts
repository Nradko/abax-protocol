import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { deposit } from 'tests/scenarios/utils/actions';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/test_psp22';

const RESERVE_UNDERLYING_ADDRESS = '5EbQ2QZ552Yh936tZDX38nArMFxDutmEuFXkD4vJd7ZjJoaB';
const LENDING_POOL_ADDRESS = '5EKSauepfGB3SxFSMCfhcurSb7ZvN7g6khtbySuJ6X7tHnep';
const ON_BEHALF_OF: string | null = null; //defaults to signer
const AMOUNT = 1;

function toTokenDecimals(amount: number | string | BN, decimals: number) {
  return new BN(amount).mul(new BN(10).pow(new BN(decimals)));
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
  const decimals = (await new Psp22ForAuditContract(RESERVE_UNDERLYING_ADDRESS, signer, api).query.tokenDecimals()).value.unwrap();

  (
    await lendingPool.withSigner(signer).query.borrow(RESERVE_UNDERLYING_ADDRESS, onBehalfOfArg, toTokenDecimals(AMOUNT, decimals.toNumber()), [])
  ).value.unwrapRecursively();
  await lendingPool.withSigner(signer).tx.borrow(RESERVE_UNDERLYING_ADDRESS, onBehalfOfArg, toTokenDecimals(AMOUNT, decimals.toNumber()), []);

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
