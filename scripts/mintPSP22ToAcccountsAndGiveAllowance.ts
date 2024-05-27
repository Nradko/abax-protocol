import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/psp22_for_audit';

const PSP22Address = 'FILL HERE';
const PSP22Decimals = 18;
const LENDING_POOL_ADDRESS = 'FILL HERE';

function toTokenDecimals(amount: number | string | BN) {
  return new BN(amount).mul(new BN(10).pow(new BN(PSP22Decimals)));
}

const ADDRESSES_TO_MINT_TO_WITH_AMOUNTS: [string, BN][] = [
  ['FILL HERE', toTokenDecimals(10)],
  ['FILL HERE', toTokenDecimals(100)],
  //...
];

(async () => {
  if (require.main !== module) return;
  const wsEndpoint = 'wss://ws.test.azero.dev';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed, set SEED env variable';
  const api = await getApiProviderWrapper(wsEndpoint).getAndWaitForReady();
  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');

  const psp22Mintable = new Psp22ForAuditContract(PSP22Address, signer, api);

  for (const [address, amount] of ADDRESSES_TO_MINT_TO_WITH_AMOUNTS) {
    console.log(`Minting ${amount} to ${address}`);
    await psp22Mintable.tx.mint(address, amount);
  }

  //give allowances to lending pool
  const lendingPool = new LendingPoolContract(LENDING_POOL_ADDRESS, signer, api);

  for (const [address, amount] of ADDRESSES_TO_MINT_TO_WITH_AMOUNTS) {
    console.log(`Approving ${amount} to lending pool`);
    await psp22Mintable.tx.tApprove(address, lendingPool.address, amount);
  }

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
