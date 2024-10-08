import { LendingPool, LendingPoolErrorBuilder, Psp22Ownable, getContractObject } from '@abaxfinance/contract-helpers';
import { getArgvObj } from '@abaxfinance/utils';
import { ApiPromise } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { isEqual } from 'lodash';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { bnToBn } from '@polkadot/util';
import { stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';

const LENDING_POOL_ADDRESS = '5CaYwwWqGqVEDSYVmMi7qhV9T3kLQmKeF5VGxiz6jt4sZrPE';

const BORROWER_TO_LIQUIDATE = '5HomjhpkXVAKNpFqyTUVFjiA3F7SKQfDV5TWmpKy3hCXek7f';
const WETH_ADDR = '5GDDKd4iKDBXseSXCqfraWxECM5nWpZmLNTVuGdpcm2WZX2w'; //debt
const AZERO_ADDR = '5FwJkGXsRHctjDbDSw6mU6ZvGgsY8PKGWdEEp1M2VcYox7Mh'; //collateral

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  //code

  await tryLiquidate(BORROWER_TO_LIQUIDATE);

  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});

function getLiquidationSignerSpender() {
  const keyring = new Keyring();
  return keyring.createFromUri(process.env.SEED ?? '', {}, 'sr25519');
}

async function tryLiquidate(accountAddress: string) {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const liquidationSignerSpender = await getLiquidationSignerSpender();
  const lendingPool = getContractObject(LendingPool, LENDING_POOL_ADDRESS, liquidationSignerSpender, api);
  // const minimumTokenReceivedE18 = calculateMinimumTokenReceivedE18();
  const minimumTokenReceivedE18 = 1;

  const reserveTokenToRepay = getContractObject(Psp22Ownable, WETH_ADDR, liquidationSignerSpender, api);

  const amountToRepay = new BN('30000000000000000000'); //.muln(2); //TODO remove muln2
  const approveQueryRes = await reserveTokenToRepay.query.approve(lendingPool.address, amountToRepay);
  try {
    approveQueryRes.value.unwrapRecursively();
    await reserveTokenToRepay.tx.approve(lendingPool.address, amountToRepay.muln(2)); //TODO handle unhandled rejections
  } catch (e) {
    console.error(`failed to approve: reason ${JSON.stringify(e)}`); //TODO
    return false;
  }

  //DEBUG
  const biggestDebtReserveBefore = (await lendingPool.query.viewReserveData(WETH_ADDR)).value.ok!;
  const borrowerBiggestDebtReserveBefore = (await lendingPool.query.viewAccountReserveData(WETH_ADDR, accountAddress)).value.ok!;
  const borrowerBiggestCollateralReserveBefore = (await lendingPool.query.viewAccountReserveData(AZERO_ADDR, accountAddress)).value.ok!;
  const liquidationSpenderBiggestDebtReserveBefore = (await lendingPool.query.viewAccountReserveData(WETH_ADDR, liquidationSignerSpender.address))
    .value.ok!;
  const liqudationSpenderBiggestCollateralReserveBefore = (
    await lendingPool.query.viewAccountReserveData(AZERO_ADDR, liquidationSignerSpender.address)
  ).value.ok!;

  const biggestDebtPSPBalanceOfLendingPool = (
    await getContractObject(Psp22Ownable, WETH_ADDR, liquidationSignerSpender, api).query.balanceOf(lendingPool.address)
  ).value.ok!;
  const queryResD = await lendingPool.query.getAccountFreeCollateralCoefficient(accountAddress);
  console.log({
    accountAddress,
    collateralized: stringifyNumericProps(queryResD.value.ok!)[0],
    collateralCoefficient: stringifyNumericProps(queryResD.value.ok!)[1],
  });
  //DEBUG

  const queryRes = await lendingPool
    .withSigner(liquidationSignerSpender)
    .query.liquidate(accountAddress, WETH_ADDR, AZERO_ADDR, amountToRepay, minimumTokenReceivedE18, []);
  try {
    queryRes.value.unwrapRecursively();
    console.log('Succesfully queried liquidation');
    const tx = await lendingPool
      .withSigner(liquidationSignerSpender)
      .tx.liquidate(accountAddress, WETH_ADDR, AZERO_ADDR, amountToRepay, minimumTokenReceivedE18, [], { gasLimit: getMaxGasLimit(api) });
    console.log(`${accountAddress}| Liquidation success: ${tx.blockHash?.toString()} | events: ${JSON.stringify(stringifyNumericProps(tx.events))}`);
    const queryResAfter = await lendingPool.query.getAccountFreeCollateralCoefficient(accountAddress);

    const biggestDebtReserveAfter = (await lendingPool.query.viewReserveData(WETH_ADDR.toString())).value.ok!;
    const biggestDebtPSPBalanceOfLendingPoolAfter = (
      await getContractObject(Psp22Ownable, WETH_ADDR, liquidationSignerSpender, api).query.balanceOf(lendingPool.address)
    ).value.ok!;
    const borrowerBiggestDebtReserveAfter = (await lendingPool.query.viewAccountReserveData(WETH_ADDR, accountAddress)).value.ok!;

    const borrowerBiggestCollateralReserveAfter = (await lendingPool.query.viewAccountReserveData(AZERO_ADDR, accountAddress)).value.ok!;
    const liquidationSpenderBiggestDebtReserveAfter = (await lendingPool.query.viewAccountReserveData(WETH_ADDR, liquidationSignerSpender.address))
      .value.ok!;
    const liqudationSpenderBiggestCollateralReserveAfter = (
      await lendingPool.query.viewAccountReserveData(AZERO_ADDR, liquidationSignerSpender.address)
    ).value.ok!;

    console.log({
      accountAddress,
      collateralized: stringifyNumericProps(queryResAfter.value.ok!)[0],
      collateralCoefficient: stringifyNumericProps(queryResAfter.value.ok!)[1],
      biggestDebtReserveBefore: stringifyNumericProps(biggestDebtReserveBefore),
      biggestDebtDataAfter: stringifyNumericProps(biggestDebtReserveAfter),
      biggestDebtPSPBalanceOfLendingPool: biggestDebtPSPBalanceOfLendingPool.toString(),
      biggestDebtPSPBalanceOfLendingPoolAfter: biggestDebtPSPBalanceOfLendingPoolAfter.toString(),
      borrowerBiggestDebtReserveBefore: stringifyNumericProps(borrowerBiggestDebtReserveBefore),
      borrowerBiggestDebtReserveAfter: stringifyNumericProps(borrowerBiggestDebtReserveAfter),
      borrowerBiggestCollateralReserveBefore: stringifyNumericProps(borrowerBiggestCollateralReserveBefore),
      borrowerBiggestCollateralReserveAfter: stringifyNumericProps(borrowerBiggestCollateralReserveAfter),
      liquidationSpenderBiggestDebtReserveBefore: stringifyNumericProps(liquidationSpenderBiggestDebtReserveBefore),
      liquidationSpenderBiggestDebtReserveAfter: stringifyNumericProps(liquidationSpenderBiggestDebtReserveAfter),
      liqudationSpenderBiggestCollateralReserveBefore: stringifyNumericProps(liqudationSpenderBiggestCollateralReserveBefore),
      liqudationSpenderBiggestCollateralReserveAfter: stringifyNumericProps(liqudationSpenderBiggestCollateralReserveAfter),
    });
  } catch (e) {
    console.error(`${accountAddress}| liquidation unsuccessfull`);
    console.error(e);
    if (isEqual(LendingPoolErrorBuilder.Collaterized(), e)) {
      console.log(`${accountAddress}| account was collateralized`);
      return false;
    }
  }
  return true;
}

export const getGasLimit = (api: ApiPromise, _refTime: string | BN, _proofSize: string | BN) => {
  const refTime = bnToBn(_refTime);
  const proofSize = bnToBn(_proofSize);

  return api.registry.createType('WeightV2', {
    refTime,
    proofSize,
  }) as WeightV2;
};

export const getMaxGasLimit = (api: ApiPromise, reductionFactor = 0.3) => {
  const blockWeights = api.consts.system.blockWeights.toPrimitive() as any;
  const maxExtrinsic = blockWeights?.perClass?.normal?.maxExtrinsic;
  const maxRefTime = maxExtrinsic?.refTime
    ? bnToBn(maxExtrinsic.refTime)
        .mul(new BN(reductionFactor * 100))
        .div(new BN(100))
    : new BN(0);
  const maxProofSize = maxExtrinsic?.proofSize
    ? bnToBn(maxExtrinsic.proofSize)
        .mul(new BN(reductionFactor * 100))
        .div(new BN(100))
    : new BN(0);

  return getGasLimit(api, maxRefTime as any, maxProofSize as any);
};
