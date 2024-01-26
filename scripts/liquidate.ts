import { LendingPool, LendingPoolErrorBuilder, Psp22Ownable, getContractObject, replaceNumericPropsWithStrings } from '@abaxfinance/contract-helpers';
import { getArgvObj } from '@abaxfinance/utils';
import { ApiPromise } from '@polkadot/api';
import Keyring from '@polkadot/keyring';
import BN from 'bn.js';
import chalk from 'chalk';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { isEqual } from 'lodash';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { bnToBn } from '@polkadot/util';

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

async function tryLiquidate(userAddress: string) {
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
  const borrowerBiggestDebtReserveBefore = (await lendingPool.query.viewUserReserveData(WETH_ADDR, userAddress)).value.ok!;
  const borrowerBiggestCollateralReserveBefore = (await lendingPool.query.viewUserReserveData(AZERO_ADDR, userAddress)).value.ok!;
  const liquidationSpenderBiggestDebtReserveBefore = (await lendingPool.query.viewUserReserveData(WETH_ADDR, liquidationSignerSpender.address)).value
    .ok!;
  const liqudationSpenderBiggestCollateralReserveBefore = (await lendingPool.query.viewUserReserveData(AZERO_ADDR, liquidationSignerSpender.address))
    .value.ok!;

  const biggestDebtPSPBalanceOfLendingPool = (
    await getContractObject(Psp22Ownable, WETH_ADDR, liquidationSignerSpender, api).query.balanceOf(lendingPool.address)
  ).value.ok!;
  const queryResD = await lendingPool.query.getUserFreeCollateralCoefficient(userAddress);
  console.log({
    userAddress,
    collateralized: replaceNumericPropsWithStrings(queryResD.value.ok)[0],
    collateralCoefficient: replaceNumericPropsWithStrings(queryResD.value.ok)[1],
  });
  //DEBUG

  const queryRes = await lendingPool
    .withSigner(liquidationSignerSpender)
    .query.liquidate(userAddress, WETH_ADDR, AZERO_ADDR, amountToRepay, minimumTokenReceivedE18, []);
  try {
    queryRes.value.unwrapRecursively();
    console.log('Succesfully queried liquidation');
    const tx = await lendingPool
      .withSigner(liquidationSignerSpender)
      .tx.liquidate(userAddress, WETH_ADDR, AZERO_ADDR, amountToRepay, minimumTokenReceivedE18, [], { gasLimit: getMaxGasLimit(api) });
    console.log(
      `${userAddress}| Liquidation success: ${tx.blockHash?.toString()} | events: ${JSON.stringify(replaceNumericPropsWithStrings(tx.events))}`,
    );
    const queryResAfter = await lendingPool.query.getUserFreeCollateralCoefficient(userAddress);

    const biggestDebtReserveAfter = (await lendingPool.query.viewReserveData(WETH_ADDR.toString())).value.ok!;
    const biggestDebtPSPBalanceOfLendingPoolAfter = (
      await getContractObject(Psp22Ownable, WETH_ADDR, liquidationSignerSpender, api).query.balanceOf(lendingPool.address)
    ).value.ok!;
    const borrowerBiggestDebtReserveAfter = (await lendingPool.query.viewUserReserveData(WETH_ADDR, userAddress)).value.ok!;

    const borrowerBiggestCollateralReserveAfter = (await lendingPool.query.viewUserReserveData(AZERO_ADDR, userAddress)).value.ok!;
    const liquidationSpenderBiggestDebtReserveAfter = (await lendingPool.query.viewUserReserveData(WETH_ADDR, liquidationSignerSpender.address)).value
      .ok!;
    const liqudationSpenderBiggestCollateralReserveAfter = (await lendingPool.query.viewUserReserveData(AZERO_ADDR, liquidationSignerSpender.address))
      .value.ok!;

    console.log({
      userAddress,
      collateralized: replaceNumericPropsWithStrings(queryResAfter.value.ok)[0],
      collateralCoefficient: replaceNumericPropsWithStrings(queryResAfter.value.ok)[1],
      biggestDebtReserveBefore: replaceNumericPropsWithStrings(biggestDebtReserveBefore),
      biggestDebtDataAfter: replaceNumericPropsWithStrings(biggestDebtReserveAfter),
      biggestDebtPSPBalanceOfLendingPool: biggestDebtPSPBalanceOfLendingPool.toString(),
      biggestDebtPSPBalanceOfLendingPoolAfter: biggestDebtPSPBalanceOfLendingPoolAfter.toString(),
      borrowerBiggestDebtReserveBefore: replaceNumericPropsWithStrings(borrowerBiggestDebtReserveBefore),
      borrowerBiggestDebtReserveAfter: replaceNumericPropsWithStrings(borrowerBiggestDebtReserveAfter),
      borrowerBiggestCollateralReserveBefore: replaceNumericPropsWithStrings(borrowerBiggestCollateralReserveBefore),
      borrowerBiggestCollateralReserveAfter: replaceNumericPropsWithStrings(borrowerBiggestCollateralReserveAfter),
      liquidationSpenderBiggestDebtReserveBefore: replaceNumericPropsWithStrings(liquidationSpenderBiggestDebtReserveBefore),
      liquidationSpenderBiggestDebtReserveAfter: replaceNumericPropsWithStrings(liquidationSpenderBiggestDebtReserveAfter),
      liqudationSpenderBiggestCollateralReserveBefore: replaceNumericPropsWithStrings(liqudationSpenderBiggestCollateralReserveBefore),
      liqudationSpenderBiggestCollateralReserveAfter: replaceNumericPropsWithStrings(liqudationSpenderBiggestCollateralReserveAfter),
    });
  } catch (e) {
    console.error(`${userAddress}| liquidation unsuccessfull`);
    console.error(e);
    if (isEqual(LendingPoolErrorBuilder.Collaterized(), e)) {
      console.log(`${userAddress}| user was collateralized`);
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
