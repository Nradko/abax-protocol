import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { getContractObject } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { StoredContractInfo } from 'tests/setup/nodePersistence';
import LendingPool from 'typechain/contracts/lending_pool';
import { getArgvObj } from '@abaxfinance/utils';

const RESERVE_TOKEN_ADDRESSES: string[] = [
  '5CRTAHVoub9SZDQXvaaHH8xT1ScYyUvKGPoEo8vTnzv6KWAs',
  '5FPNwLhzWhtvYas7gsrFpJmngUwJfFdLrsaMRVeRADkF4iGW',
  '5HTShVvCNNn3o5fiArPdkng9sjQRY7zb2JDaSU9Fq45GBQk5',
  '5DjYsoPAXYG9mAa3qDT99NFgZYndVyHYukencgkwgspDDsvs',
  '5CiAgrWH51LEUWELLhk5aLFRRTrafjJyRapBphK1iudqGLg8',
  '5FjNGvc9kABveFNrXgG2mNYyZAmJxxDpMNt5x2mJim2RsL7v',
];

const SET_RESERVES_IS_ACTIVE = false;

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
  // const alice = getSigners()[0];
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.azero.testnet.json');

  const contracts = JSON.parse(await fs.readFile(deployPath, 'utf8')) as StoredContractInfo[];
  const lendingPoolContractInfo = contracts.find((c) => c.name === 'lending_pool');
  if (!lendingPoolContractInfo?.address) throw 'lendingPool ContractInfo not found';
  const lendingPool = await getContractObject(LendingPool, lendingPoolContractInfo.address, signer);

  for (const reserveAddress of RESERVE_TOKEN_ADDRESSES) {
    const result = await lendingPool.withSigner(signer).query.setReserveIsActive(reserveAddress, SET_RESERVES_IS_ACTIVE);
    if (result.value.ok?.err) {
      console.log(result.value.ok?.err);
    }
    await lendingPool.tx.setReserveIsActive(reserveAddress, SET_RESERVES_IS_ACTIVE);
  }

  console.log(`owner: ${signer.address}`);
  console.log(`lendingPool: ${lendingPool.address}`);

  await api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
