import { Keyring, type ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ISubmittableResult } from '@polkadot/types/types';
import chalk from 'chalk';
import { writeFileSync } from 'fs-extra';
import FlipperMapDeployer from 'typechain/deployers/flipper_map';
import FlipperVecDeployer from 'typechain/deployers/flipper_vec';
import { generateRandomSignerWithBalance, getApiProviderWrapper } from 'wookashwackomytest-polkahat-network-helpers';
import { _genValidGasLimitAndValue } from 'wookashwackomytest-typechain-types';
import { getArgvObj } from 'wookashwackomytest-utils';

const API_PROVIDER_WRAPPER = getApiProviderWrapper(process.env.WS_ENDPOINT!);
const TOTAL_ASSET_LENGTH = 32;
const MAX_RETRIES = 50;
const AMOUNT_OF_CALLS = 40;

export const runAndRetrieveTxCost = async (
  api: ApiPromise,
  sender: KeyringPair,
  transaction: SubmittableExtrinsic<'promise', ISubmittableResult>,
) => {
  const estimatedCost = (await transaction.paymentInfo(sender)).partialFee;
  const balancePre = await api.query.system.account(sender.address);
  const txResult = await transaction.signAndSend(sender);
  const balanceAfter = await api.query.system.account(sender.address);
  const realCost = parseInt((BigInt((balancePre.toJSON() as any).data.free) - BigInt((balanceAfter.toJSON() as any).data.free)).toString());
  return { txResult, txCost: realCost, estimatedCost: estimatedCost.toNumber() };
};

async function run(api: ApiPromise, signer: KeyringPair, contract: any, method: string, args: any[], times: number = 1) {
  let totalCost = 0;
  let estimatedTotalCost = 0;
  const gasLimit = await _genValidGasLimitAndValue(api);
  let err: Error | undefined = undefined;
  for (const _ of Array(times).keys()) {
    let ret;
    let currentRetries = 0;
    while (currentRetries < MAX_RETRIES) {
      try {
        ret = await runAndRetrieveTxCost(api, signer, contract.withSigner(signer).buildExtrinsic[method](...args, gasLimit));
        break;
      } catch (e: any) {
        currentRetries++;
        err = e;
      }
    }
    if (!ret) throw new Error(`Failed to run ${method} for ${contract.name} ${err}`);
    totalCost += ret.txCost;
    estimatedTotalCost += ret.estimatedCost;
  }

  return { totalCost, estimatedTotalCost };
}

async function runAddUserData(api: ApiPromise, signer: KeyringPair, contract: any) {
  let totalCost = 0;
  let estimatedTotalCost = 0;
  const gasLimit = await _genValidGasLimitAndValue(api);
  for (const i of Array(TOTAL_ASSET_LENGTH).keys()) {
    let ret;
    let currentRetries = 0;
    while (currentRetries < MAX_RETRIES) {
      try {
        ret = await runAndRetrieveTxCost(api, signer, contract.withSigner(signer).buildExtrinsic.addUserData(i, gasLimit));
        break;
      } catch (e) {
        currentRetries++;
      }
    }
    if (!ret) throw new Error(`Failed to run addUserData for ${contract.name}`);
    totalCost += ret.txCost;
    estimatedTotalCost += ret.estimatedCost;
  }

  return { totalCost, estimatedTotalCost };
}

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  //code
  const api = await API_PROVIDER_WRAPPER.getAndWaitForReady();
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';

  const keyring = new Keyring();
  const signer1 = keyring.createFromUri(seed, {}, 'sr25519'); // getSigners()[0];
  const flipperMap = (await new FlipperMapDeployer(api, signer1).new(TOTAL_ASSET_LENGTH)).contract;
  //   const signer2 = await generateRandomSignerWithBalance(api, signer1);
  const flipperVec = (await new FlipperVecDeployer(api, signer1).new(TOTAL_ASSET_LENGTH)).contract;

  console.log('Running addUserData...');
  const flipperMapAddUserDataRes = await runAddUserData(api, signer1, flipperMap);
  const flipperVecAddUserDataRes = await runAddUserData(api, signer1, flipperVec);

  console.log('Running mutateAll...');
  const flipperMapMutateAllRes = await run(api, signer1, flipperMap, 'mutateAll', [], AMOUNT_OF_CALLS);
  const flipperVecMutateAllRes = await run(api, signer1, flipperVec, 'mutateAll', [], AMOUNT_OF_CALLS);

  console.log('Running mutateSingleAt...');
  const flipperMapMutateSingleAtRes = await run(api, signer1, flipperMap, 'mutateSingleAt', [0], AMOUNT_OF_CALLS);
  const flipperVecMutateSingleAtRes = await run(api, signer1, flipperVec, 'mutateSingleAt', [0], AMOUNT_OF_CALLS);

  const resFileContent: string[] = [
    `Run with  env SEED="<seed>" WS_ENDPOINT="wss://ws.test.azero.dev" npx tsx runWithoutWarnings.ts npx tsx scripts/bench.ts`,
  ];
  resFileContent.push('Results: addUserData');
  resFileContent.push(`Total cost for flipper_map: ${flipperMapAddUserDataRes.totalCost}`);
  resFileContent.push(`Total cost for flipper_vec: ${flipperVecAddUserDataRes.totalCost}`);
  resFileContent.push(`Estimated total cost for flipper_map: ${flipperMapAddUserDataRes.estimatedTotalCost}`);
  resFileContent.push(`Estimated total cost for flipper_vec: ${flipperVecAddUserDataRes.estimatedTotalCost}`);

  resFileContent.push('Results: mutateAll');
  resFileContent.push(`(avg)Total cost for flipper_map: ${flipperMapMutateAllRes.totalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Total cost for flipper_vec: ${flipperVecMutateAllRes.totalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Estimated total cost for flipper_map: ${flipperMapMutateAllRes.estimatedTotalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Estimated total cost for flipper_vec: ${flipperVecMutateAllRes.estimatedTotalCost / AMOUNT_OF_CALLS}`);

  resFileContent.push('Results: mutateSingleAt');
  resFileContent.push(`(avg)Total cost for flipper_map: ${flipperMapMutateSingleAtRes.totalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Total cost for flipper_vec: ${flipperVecMutateSingleAtRes.totalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Estimated total cost for flipper_map: ${flipperMapMutateSingleAtRes.estimatedTotalCost / AMOUNT_OF_CALLS}`);
  resFileContent.push(`(avg)Estimated total cost for flipper_vec: ${flipperVecMutateSingleAtRes.estimatedTotalCost / AMOUNT_OF_CALLS}`);

  writeFileSync('results.txt', resFileContent.join('\n'));

  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
