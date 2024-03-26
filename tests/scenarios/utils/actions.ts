import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import chalk from 'chalk';
import { isNil } from 'lodash';
import { LendingToken, MAX_U128 } from 'tests/consts';
import { expect } from 'tests/setup/chai';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { PSP22ErrorBuilder } from 'typechain/types-returns/a_token';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import { SignAndSendSuccessResponse } from 'wookashwackomytest-typechain-types';
import { parseAmountToBN } from 'wookashwackomytest-utils';
import AToken from '../../../typechain/contracts/a_token';
import LendingPool from '../../../typechain/contracts/lending_pool';
import PSP22Emitable from '../../../typechain/contracts/psp22_emitable';
import VToken from '../../../typechain/contracts/v_token';
import {
  CheckBorrowParameters,
  CheckDepositParameters,
  CheckWithdrawParameters,
  CheckRepayParameters,
  checkBorrow,
  checkDeposit,
  checkWithdraw,
  checkRepay,
} from './comparisons';
import { TestEnv, TokenReserve } from './make-suite';

export const convertToCurrencyDecimals = async (token: any, amount: BN | number | string) => {
  const decimals = (await token.query.tokenDecimals()).value.ok!;
  const { amountParsed, amountParsedDecimals } = BN.isBN(amount) ? { amountParsed: amount, amountParsedDecimals: 0 } : parseAmountToBN(amount);
  return amountParsed.mul(new BN(Math.pow(10, decimals - amountParsedDecimals).toString()));
};

export const mint = async (tokenContract: PSP22Emitable, amount: BN | number | string, user: KeyringPair) => {
  await tokenContract.withSigner(user).query.mint(user.address, await convertToCurrencyDecimals(tokenContract, amount));
  await tokenContract.withSigner(user).tx.mint(user.address, await convertToCurrencyDecimals(tokenContract, amount));
};

export const approve = async (reserveSymbol: string, user: KeyringPair, testEnv: TestEnv, amount?: BN | number | string) => {
  const { lendingPool, reserves } = testEnv;
  const reserve = reserves[reserveSymbol].underlying;
  const amountBN = amount ? (BN.isBN(amount) ? amount : new BN(amount)) : new BN('100000000000000000000000000000');
  await reserve.withSigner(user).tx.approve(lendingPool.address, amountBN);
  await reserves[reserveSymbol].aToken.withSigner(user).tx.approve(lendingPool.address, amountBN);
  await reserves[reserveSymbol].vToken.withSigner(user).tx.approve(lendingPool.address, amountBN);
};

export const getExpectedError = (errorName: string) => {
  if (Object.getOwnPropertyNames(PSP22ErrorBuilder).includes(errorName)) {
    return LendingPoolErrorBuilder.PSP22Error(PSP22ErrorBuilder[errorName]());
  }

  if (Object.getOwnPropertyNames(LendingPoolErrorBuilder).includes(errorName)) {
    return LendingPoolErrorBuilder[errorName]();
  }

  console.log(chalk.yellow(`Cannot construct error of given name (${chalk.white(errorName)})`));
  return errorName;
};

export const increaseAllowance = async (
  reserveSymbol: string,
  user: KeyringPair,
  targetUser: KeyringPair,
  amount: string,
  testEnv: TestEnv,
  lendingToken?: LendingToken,
) => {
  const { reserves } = testEnv;
  if (isNil(lendingToken)) {
    const amountConverted = await convertToCurrencyDecimals(reserves[reserveSymbol].underlying, amount);
    await reserves[reserveSymbol].underlying.withSigner(user).methods.increaseAllowance(targetUser.address, amountConverted, {});
    return;
  }
  switch (lendingToken) {
    case LendingToken.AToken: {
      const amountConverted = await convertToCurrencyDecimals(reserves[reserveSymbol].aToken, amount);
      if (process.env.DEBUG) await reserves[reserveSymbol].aToken.withSigner(user).query.increaseAllowance(targetUser.address, amountConverted, {});
      await reserves[reserveSymbol].aToken.withSigner(user).methods.increaseAllowance(targetUser.address, amountConverted, {});
      break;
    }
    case LendingToken.VToken: {
      const amountConverted = await convertToCurrencyDecimals(reserves[reserveSymbol].vToken, amount);
      if (process.env.DEBUG) await reserves[reserveSymbol].vToken.withSigner(user).query.increaseAllowance(targetUser.address, amountConverted, {});
      await reserves[reserveSymbol].vToken.withSigner(user).methods.increaseAllowance(targetUser.address, amountConverted, {});
      break;
    }
  }
};

export const runAndRetrieveTxCost = async (sender: KeyringPair, transaction: () => Promise<SignAndSendSuccessResponse>) => {
  if (!process.env.DEBUG) {
    const txResult = await transaction();
    return { txResult, txCost: -1 };
  }
  const balancePre = await (await apiProviderWrapper.getAndWaitForReady()).query.system.account(sender.address);
  const txResult = await transaction();
  const balanceAfter = await (await apiProviderWrapper.getAndWaitForReady()).query.system.account(sender.address);
  const realCost = BigInt((balancePre.toJSON() as any).data.free) - BigInt((balanceAfter.toJSON() as any).data.free);
  return { txResult, txCost: realCost };
};

export const deposit = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const amountToDeposit = await convertToCurrencyDecimals(reserve.underlying, amount);
  const args: Parameters<typeof lendingPool.tx.deposit> = [reserve.underlying.address, onBehalfOf.address, amountToDeposit, []];

  if (expectedResult === 'success') {
    const parametersBefore = await getCheckDepositParameters(lendingPool, reserve.underlying, reserve.aToken, caller, onBehalfOf);

    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.deposit(...args);
    }

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.deposit(...args));

    const parametersAfter = await getCheckDepositParameters(lendingPool, reserve.underlying, reserve.aToken, caller, onBehalfOf);
    await checkDeposit(lendingPool, reserve, caller.address, onBehalfOf.address, amountToDeposit, parametersBefore, parametersAfter, txResult);
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      const queryRes = (await lendingPool.withSigner(caller).query.deposit(...args)).value.ok;
      expect(queryRes).to.have.deep.property('err', getExpectedError(expectedErrorName));
    } else {
      await expect(lendingPool.withSigner(caller).tx.deposit(...args)).to.eventually.be.rejected;
    }
  }
};

export const withdraw = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckWithdrawParameters(lendingPool, reserve.underlying, reserve.aToken, caller, onBehalfOf);
  let amountToWithdraw: BN;
  if (amount) {
    amountToWithdraw = await convertToCurrencyDecimals(reserve.underlying, amount);
  } else {
    amountToWithdraw = new BN(MAX_U128);
  }
  const args: Parameters<typeof lendingPool.tx.withdraw> = [reserve.underlying.address, onBehalfOf.address, amountToWithdraw, []];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.withdraw(...args);
    }

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.withdraw(...args));

    const parametersAfter = await getCheckWithdrawParameters(lendingPool, reserve.underlying, reserve.aToken, caller, onBehalfOf);

    await checkWithdraw(lendingPool, reserve, caller.address, onBehalfOf.address, amountToWithdraw, parametersBefore, parametersAfter, txResult);
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      const queryRes = (await lendingPool.withSigner(caller).query.withdraw(...args)).value.ok;
      expect(queryRes).to.have.deep.property('err', getExpectedError(expectedErrorName));
    } else {
      await expect(lendingPool.withSigner(caller).tx.withdraw(...args)).to.eventually.be.rejected;
    }
  }
};

export const borrow = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckBorrowParameters(lendingPool, reserve.underlying, reserve.vToken, caller, onBehalfOf);

  const amountToBorrow = await convertToCurrencyDecimals(reserve.underlying, amount);
  const args: Parameters<typeof lendingPool.tx.borrow> = [reserve.underlying.address, onBehalfOf.address, amountToBorrow, [0]];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.borrow(...args);
    }

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.borrow(...args));

    const parametersAfter = await getCheckBorrowParameters(lendingPool, reserve.underlying, reserve.vToken, caller, onBehalfOf);

    checkBorrow(lendingPool, reserve, caller.address, onBehalfOf.address, amountToBorrow, parametersBefore, parametersAfter, txResult);
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      const queryRes = (await lendingPool.withSigner(caller).query.borrow(...args)).value.ok;
      expect(queryRes).to.have.deep.property('err', getExpectedError(expectedErrorName));
    } else {
      await expect(lendingPool.withSigner(caller).tx.borrow(...args)).to.eventually.be.rejected;
    }
  }
};

export const repay = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckRepayParameters(lendingPool, reserve.underlying, reserve.vToken, caller, onBehalfOf);
  let amountToRepay: BN;
  if (amount) {
    amountToRepay = await convertToCurrencyDecimals(reserve.underlying, amount);
  } else {
    amountToRepay = new BN(MAX_U128);
  }
  const args: Parameters<typeof lendingPool.tx.repay> = [reserve.underlying.address, onBehalfOf.address, amountToRepay, [0]];
  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.repay(...args);
    }

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.repay(...args));

    const parametersAfter = await getCheckRepayParameters(lendingPool, reserve.underlying, reserve.vToken, caller, onBehalfOf);

    checkRepay(lendingPool, reserve, caller.address, onBehalfOf.address, amountToRepay, parametersBefore, parametersAfter, txResult);
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      const queryRes = (await lendingPool.withSigner(caller).query.repay(...args)).value.ok;
      expect(queryRes).to.have.deep.property('err', getExpectedError(expectedErrorName));
    } else {
      await expect(lendingPool.withSigner(caller).tx.repay(...args)).to.eventually.be.rejected;
    }
  }
};

export const setUseAsCollateral = async (
  reserveSymbol: string,
  caller: KeyringPair,
  useAsCollateral: string,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves } = testEnv;
  const underlying = reserves[reserveSymbol].underlying;

  const assetId = (await testEnv.lendingPool.query.viewAssetId(underlying.address)).value.ok;

  if (assetId === undefined || assetId === null) {
    throw new Error(`ERROR READING ASSET ID (asset: ${underlying.address})`);
  }
  const { reserveData: reserveDataBefore } = await getUserReserveDataWithTimestamp(underlying, caller, lendingPool);

  const useAsCollateralToSet = useAsCollateral.toLowerCase() === 'true';
  const args: Parameters<typeof lendingPool.tx.setAsCollateral> = [underlying.address, useAsCollateralToSet];
  if (expectedResult === 'success') {
    const { userConfig: userConfigBefore } = await getUserReserveDataWithTimestamp(underlying, caller, lendingPool);
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.setAsCollateral(...args);
    }

    const txQuery = await lendingPool.withSigner(caller).query.setAsCollateral(...args);
    const txResult = await lendingPool.withSigner(caller).tx.setAsCollateral(...args);

    const { userConfig: userConfigAfter } = await getUserReserveDataWithTimestamp(underlying, caller, lendingPool);

    if (userConfigBefore.collaterals !== userConfigAfter.collaterals) {
      expect(txResult.events).to.deep.equal([
        {
          args: {
            asset: testEnv.reserves[reserveSymbol].underlying.address,
            caller: caller.address,
            set: (userConfigAfter.collaterals.toNumber() >> assetId.toNumber()) % 2 === 1 ? true : false,
          },
          name: 'CollateralSet',
        },
      ]);
    }
    expect.toBeDefined(userConfigAfter);
    expect((userConfigAfter.collaterals.toNumber() >> assetId.toNumber()) % 2, 'setUseAsCollateral didnt work').to.equal(
      useAsCollateralToSet ? 1 : 0,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      const queryRes = (await lendingPool.withSigner(caller).query.setAsCollateral(...args)).value.ok;
      expect(queryRes).to.have.deep.property('err', getExpectedError(expectedErrorName));
    } else {
      await expect(lendingPool.withSigner(caller).tx.setAsCollateral(...args)).to.eventually.be.rejected;
    }
  }
};

export const getTxTimestamp = async (tx: SignAndSendSuccessResponse) => {
  if (!tx.blockHash || !tx.txHash) {
    throw new Error('No tx blocknumber');
  }
  const txTimestamp = new BN((await (await (await apiProviderWrapper.getAndWaitForReady()).at(tx.blockHash)).query.timestamp.now()).toString());

  return { txTimestamp };
};

export const getReserveAndUserReserveData = async <R extends { address: string }>(reserve: R, user: KeyringPair, lendingPool: LendingPool) => {
  const reserveData = (await lendingPool.query.viewReserveData(reserve.address)).value.unwrap();
  const reserveIndexes = (await lendingPool.query.viewUnupdatedReserveIndexes(reserve.address)).value.unwrap();
  if (!reserveData) throw new Error(`ERROR READING RESERVE DATA (reserve: ${reserve.address})`);
  if (!reserveIndexes) throw new Error(`ERROR READING RESERVE INDEXES (reserve: ${reserve.address})`);

  const userReserveDataResult = (await lendingPool.query.viewUnupdatedUserReserveData(reserve.address, user.address)).value.unwrap();
  const userConfig = (await lendingPool.query.viewUserConfig(user.address)).value.unwrap();
  const result = {
    reserveData,
    reserveIndexes,
    userConfig,
    //return default obj to faciliate calculations
    userReserveData: userReserveDataResult,
  };
  return result;
};

export const getUserReserveDataWithTimestamp = async <R extends { address: string }>(reserve: R, user: KeyringPair, lendingPool: LendingPool) => {
  const timestamp = parseInt((await lendingPool.nativeAPI.query.timestamp.now()).toString());
  return {
    ...(await getReserveAndUserReserveData(reserve, user, lendingPool)),
    timestamp: new BN(timestamp.toString()),
  };
};

export const getCheckDepositParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  aToken: AToken,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckDepositParameters> => {
  const timestamp = parseInt((await lendingPool.nativeAPI.query.timestamp.now()).toString());
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.ok!.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.ok!.toString()),
    aBalance: new BN((await aToken.query.balanceOf(onBehalfOf.address)).value.ok!.toString()),
    timestamp,
  };
};

export const getCheckWithdrawParameters = async (
  lendingPool: LendingPool,
  underlying: PSP22Emitable,
  aToken: AToken,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckWithdrawParameters> => {
  const timestamp = parseInt((await lendingPool.nativeAPI.query.timestamp.now()).toString());
  return {
    ...(await getReserveAndUserReserveData(underlying, onBehalfOf, lendingPool)),
    poolBalance: new BN((await underlying.query.balanceOf(lendingPool.address)).value.ok!.toString()),
    callerBalance: new BN((await underlying.query.balanceOf(caller.address)).value.ok!.toString()),
    aBalance: new BN((await aToken.query.balanceOf(onBehalfOf.address)).value.ok!.toString()),
    aAllowance:
      caller.address !== onBehalfOf.address
        ? new BN((await aToken.query.allowance(onBehalfOf.address, caller.address)).value.ok!.toString())
        : undefined,
    timestamp,
  };
};

export const getCheckBorrowParameters = async (
  lendingPool: LendingPool,
  underlying: PSP22Emitable,
  vToken: VToken,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckBorrowParameters> => {
  const timestamp = parseInt((await lendingPool.nativeAPI.query.timestamp.now()).toString());
  return {
    ...(await getReserveAndUserReserveData(underlying, onBehalfOf, lendingPool)),
    poolBalance: new BN((await underlying.query.balanceOf(lendingPool.address)).value.ok!.toString()),
    callerBalance: new BN((await underlying.query.balanceOf(caller.address)).value.ok!.toString()),
    vBalance: new BN((await vToken.query.balanceOf(onBehalfOf.address)).value.ok!.toString()),
    vAllowance:
      caller.address !== onBehalfOf.address
        ? new BN((await vToken.query.allowance(onBehalfOf.address, caller.address)).value.ok!.toString())
        : undefined,
    timestamp,
  };
};

export const getCheckRepayParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  vToken: VToken,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckRepayParameters> => {
  const timestamp = parseInt((await lendingPool.nativeAPI.query.timestamp.now()).toString());
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.ok!.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.ok!.toString()),
    vBalance: new BN((await vToken.query.balanceOf(onBehalfOf.address)).value.ok!.toString()),
    timestamp,
  };
};
