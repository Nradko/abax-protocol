import { LendingPool, getContractObject } from 'wookashwackomytest-contract-helpers';
import { getArgvObj } from 'wookashwackomytest-utils';
import Keyring from '@polkadot/keyring';
import { apiProviderWrapper } from 'tests/setup/helpers';
import chalk from 'chalk';
import LendingPoolDeployer from 'typechain/deployers/lending_pool';

const CONTRACT_ADDR = '5CaYwwWqGqVEDSYVmMi7qhV9T3kLQmKeF5VGxiz6jt4sZrPE';
const COTNRACT_CONSTRUCTOR = LendingPool;
(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';
  const api = await apiProviderWrapper.getAndWaitForReady();
  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');
  //code

  const existingContract = getContractObject(COTNRACT_CONSTRUCTOR, CONTRACT_ADDR, signer, api);
  const dummyDeploy = await new LendingPoolDeployer(api, signer).new();
  console.log('query contract info');
  const { codeHash } = (await api.query.contracts.contractInfoOf(dummyDeploy.contract.address)).toHuman() as { codeHash: string };
  console.log('code hash', codeHash.toString());
  console.log('query set code');
  const queryRes = await existingContract.query.setCode(codeHash as any);

  if (queryRes.value.ok?.ok === null) {
    console.log('set code tx');
    const txRes = await existingContract.tx.setCode(codeHash as any);
    console.log(`completed at ${txRes.blockHash?.toString()}`);
  } else {
    console.log('query failed');
    console.log(queryRes.value.err);
    console.log(queryRes.value.ok?.err);
  }
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
