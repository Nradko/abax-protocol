import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { getContractObject } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { StoredContractInfo } from 'tests/setup/nodePersistence';
import LendingPool from 'typechain/contracts/lending_pool';
import { getArgvObj } from '@abaxfinance/utils';
import { E8 } from '@abaxfinance/utils';

const RESERVE_TOKENS_INFO: StoredContractInfo[] = [
  { name: 'psp22_ownable', address: '5DDyvXWoxRKX1PpwHcFkUnZX9MwPmHbWU17SPZ2AKFgAVjya', reserveName: 'DAI_TEST' },
  { name: 'psp22_ownable', address: '5G8Jpgj7dZoP5wuMgTHdBPUWTmZaYaEyvaYurJpgVb1ki3ky', reserveName: 'USDC_TEST' },
  { name: 'psp22_ownable', address: '5CVxZjK7WQCcjmgGZA35pTqyXr1cvvEe22nrz6wSTcsW1nTv', reserveName: 'WETH_TEST' },
  { name: 'psp22_ownable', address: '5GRu3YzEN9YBrcB9EaqiGpKpjwW9HmuwSAbDdeCw4v69sn6C', reserveName: 'BTC_TEST' },
  { name: 'psp22_ownable', address: '5DRWtNpAKukhyTHzEfkk7PjLQZq9E7CcArc8bGkLx9AE3Z5p', reserveName: 'AZERO_TEST' },
  { name: 'psp22_ownable', address: '5ELWMYwQSgmKLYJhu5WigEZA5t6Y7QZ8w4dzeFkawU436LJ9', reserveName: 'DOT_TEST' },
];

const PRICES_E8 = {
  // Update to USD-based price feeds
  DAI_TEST: E8,
  AZERO_TEST: E8 * 1.5,
  USDC_TEST: E8,
  WETH_TEST: 270 * E8,
  DOT_TEST: 6 * E8,
  BTC_TEST: 29_000 * E8,
} as const;

const LENDING_POOL_ADDRESS = '5C9MoPeD8rEATyW77U6fmUcnzGpvoLvqQ9QTMiA9oByGwffx';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? process.env.PWD;
  if (!outputJsonFolder) throw 'could not determine path';
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';
  const api = await apiProviderWrapper.getAndWaitForReady();

  const timestamp = await api.query.timestamp.now();
  console.log(new Date(parseInt(timestamp.toString())));

  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');

  const lendingPool = await getContractObject(LendingPool, LENDING_POOL_ADDRESS, signer);

  console.log(`signer(owner): ${signer.address}`);
  console.log(`lending pool: ${lendingPool.address}`);

  const printReserveTokenPrices = async () => {
    for (const reserve of RESERVE_TOKENS_INFO) {
      const result = await lendingPool.withSigner(signer).query.getReserveTokenPriceE8(reserve.address);
      result.value.unwrap();
      console.log(`[${reserve.name}] - ${result.value.ok?.rawNumber.toString()}`);
    }
  };

  const insertPrices = async () => {
    for (const reserve of RESERVE_TOKENS_INFO) {
      const reservePrice = PRICES_E8[reserve.name as keyof typeof PRICES_E8];
      const result = await lendingPool.withSigner(signer).query.insertReserveTokenPriceE8(reserve.address, reservePrice);
      result.value.unwrap().unwrap();
      await lendingPool.tx.insertReserveTokenPriceE8(reserve.address, reservePrice);
    }
  };

  console.log('Prices before:');
  await printReserveTokenPrices();

  await insertPrices();

  console.log('Prices after:');
  await printReserveTokenPrices();

  await api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
