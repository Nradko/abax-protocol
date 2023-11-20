import { getArgvObj } from '@abaxfinance/utils';
import { ApiPromise } from '@polkadot/api';
import chalk from 'chalk';
import { deployDiaOracle } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper, getSigners } from 'tests/setup/helpers';

export async function getLatestBlockNumber(api: ApiPromise) {
  const latestSignedBlock = await api.rpc.chain.getBlock();
  const endBlockNumber = latestSignedBlock.block.header.number.toNumber();
  return endBlockNumber;
}

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  //code
  const signer = getSigners()[0];
  const api = await apiProviderWrapper.getAndWaitForReady();

  const preChangeTimestamp = await api.query.timestamp.now();
  const blockNumberPreSet = await getLatestBlockNumber(api);
  console.log('preChangeTimestamp', preChangeTimestamp.toString());
  console.log('blockNumberPreSet', blockNumberPreSet.toString());

  // await deployDiaOracle(signer);
  const res2 = await api.tx.timestamp.setTime(1500).signAndSend(signer);
  // await deployDiaOracle(signer);
  const res3 = await api.tx.timestamp.setTime(1500).signAndSend(signer);
  console.log(res2.toHuman());
  console.log(res3.toHuman());
  const blockNumberPostSet = await getLatestBlockNumber(api);
  const postChangeTimestamp = await api.query.timestamp.now();
  console.log('blockNumberPostSet', blockNumberPostSet.toString());
  console.log('postChangeTimestamp', postChangeTimestamp.toString());

  const res4 = await api.tx.timestamp.setTime(0).signAndSend(signer);
  // await deployDiaOracle(signer);
  const res5 = await api.tx.timestamp.setTime(0).signAndSend(signer);
  console.log(res4.toHuman());
  console.log(res5.toHuman());

  const blockNumberPostReset = await getLatestBlockNumber(api);
  const timestampPostReset = await api.query.timestamp.now();
  console.log('blockNumberPostReset', blockNumberPostReset.toString());
  console.log('timestampPostReset', timestampPostReset.toString());
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
