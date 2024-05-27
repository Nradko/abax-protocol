import { getApiProviderWrapper } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { MAX_U128 } from 'tests/consts';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import Psp22ForAuditContract from 'typechain/contracts/psp22_for_audit';

const RESERVE_UNDERLYING_ADDRESS = '5HPKPXW3vjbY2zrLYZY56mu1aryxfpEvQ1fWnwJwhbJZbkF5';
const LENDING_POOL_ADDRESS = '5EKSauepfGB3SxFSMCfhcurSb7ZvN7g6khtbySuJ6X7tHnep';

function toTokenDecimals(amount: number | string | BN, decimals: number) {
  return new BN(amount).mul(new BN(10).pow(new BN(decimals)));
}

const ADDRESSES_TO_MINT_TO_WITH_AMOUNTS: [string | null, number][] = [
  [null, 10], //null => to signer
  [null, 10000],
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

  const psp22Mintable = new Psp22ForAuditContract(RESERVE_UNDERLYING_ADDRESS, signer, api);

  const decimals = (await new Psp22ForAuditContract(RESERVE_UNDERLYING_ADDRESS, signer, api).query.tokenDecimals()).value.unwrap();
  for (const [address, amount] of ADDRESSES_TO_MINT_TO_WITH_AMOUNTS) {
    console.log(`Minting ${amount} to ${address}`);
    await psp22Mintable.tx.mint(address ?? signer.address, toTokenDecimals(amount, decimals.toNumber()));
  }

  //give allowances to lending pool
  const lendingPool = new LendingPoolContract(LENDING_POOL_ADDRESS, signer, api);

  for (const [address, amount] of ADDRESSES_TO_MINT_TO_WITH_AMOUNTS) {
    console.log(`Approving ${amount} to lending pool`);
    await psp22Mintable.tx.tApprove(address ?? signer.address, lendingPool.address, MAX_U128);
  }

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
