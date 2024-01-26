import { LendingPool, getContractObject } from '@abaxfinance/contract-helpers';
import { getArgvObj } from '@abaxfinance/utils';
import Keyring from '@polkadot/keyring';
import { deployWithLog } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import chalk from 'chalk';

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
  const dummyDeploy = await deployWithLog(signer, COTNRACT_CONSTRUCTOR, 'lending_pool');
  console.log('query contract info');
  const { codeHash } = (await api.query.contracts.contractInfoOf(dummyDeploy.address)).toHuman() as { codeHash: string };
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
