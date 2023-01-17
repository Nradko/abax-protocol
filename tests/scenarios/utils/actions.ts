import { KeyringPair } from '@polkadot/keyring/types';
import { ReturnNumber, SignAndSendSuccessResponse } from '@727-ventures/typechain-types';
import BN from 'bn.js';
import chalk from 'chalk';
import { isNil, maxBy } from 'lodash';
import { LendingToken, ONE_YEAR, RateMode } from 'tests/consts';
import { expect } from 'tests/setup/chai';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { sleep } from 'tests/setup/nodePersistence';
import { PSP22Metadata } from 'tests/types/PSP22Metadata';
import {
  LendingPoolErrorBuilder,
  AccessControlError,
  PSP22ErrorBuilder,
  ReserveData,
  UserReserveData,
  StorageErrorBuilder,
} from 'typechain/types-returns/lending_pool';
import AToken from '../../../typechain/contracts/a_token';
import BlockTimestampProvider from '../../../typechain/contracts/block_timestamp_provider';
import LendingPool from '../../../typechain/contracts/lending_pool';
import PSP22Emitable from '../../../typechain/contracts/psp22_emitable';
import SToken from '../../../typechain/contracts/s_token';
import VToken from '../../../typechain/contracts/v_token';
import { calcExpectedUserDataAfterSetUseAsCollateral } from './calculations';
import {
  checkBorrowStable,
  CheckBorrowStableParameters,
  checkBorrowVariable,
  CheckBorrowVariableParameters,
  checkDeposit,
  CheckDepositParameters,
  checkRedeem,
  CheckRedeemParameters,
  checkRepayStable,
  CheckRepayStableParameters,
  checkRepayVariable,
  CheckRepayVariableParameters,
} from './comparisons';
import { TokenReserve, TestEnv, TestEnvReserves } from './make-suite';
import {
  advanceBlockTimestamp,
  createEnumChecker,
  getReserveDefaultObj,
  getUserReserveDataDefaultObj,
  parseAmountToBN,
  subscribeOnEvents,
} from './misc';
import { ValidateEventParameters } from './validateEvents';

export const convertToCurrencyDecimals = async <T extends PSP22Metadata>(token: T, amount: BN | number | string) => {
  const { value: decimals } = await token.methods.tokenDecimals({});
  const { amountParsed, amountParsedDecimals } = BN.isBN(amount) ? { amountParsed: amount, amountParsedDecimals: 0 } : parseAmountToBN(amount);
  return amountParsed.mul(new BN(Math.pow(10, decimals - amountParsedDecimals).toString()));
};

export const convertFromCurrencyDecimals = async <T extends PSP22Metadata>(token: T, amount: BN | number | string) => {
  const { value: decimals } = await token.methods.tokenDecimals({});
  return new BN(amount).div(new BN(Math.pow(10, decimals).toString()));
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
  await reserves[reserveSymbol].sToken.withSigner(user).tx.approve(lendingPool.address, amountBN);
  await reserves[reserveSymbol].aToken.withSigner(user).tx.approve(lendingPool.address, amountBN);
  await reserves[reserveSymbol].vToken.withSigner(user).tx.approve(lendingPool.address, amountBN);
};

export const getExpectedError = (errorName: string) => {
  if (Object.getOwnPropertyNames(StorageErrorBuilder).includes(errorName)) {
    return StorageErrorBuilder[errorName]();
  }
  if (Object.getOwnPropertyNames(PSP22ErrorBuilder).includes(errorName)) {
    //TODO handle "Custom" and "SafeTransferCheckFailed"
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
    case LendingToken.SToken: {
      const amountConverted = await convertToCurrencyDecimals(reserves[reserveSymbol].sToken, amount);
      if (process.env.DEBUG) await reserves[reserveSymbol].sToken.withSigner(user).query.increaseAllowance(targetUser.address, amountConverted, {});
      await reserves[reserveSymbol].sToken.withSigner(user).methods.increaseAllowance(targetUser.address, amountConverted, {});
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
//Args<TMethod>

// type LendingPoolTransactionKey = keyof lending_pool['tx'];
// type LendingPoolTransaction<Key extends LendingPoolTransactionKey> = lending_pool['tx'][Key];
// export const trrt = async <TMethod extends LendingPoolTransactionKey>(
//   sender: KeyringPair,
//   contract: lending_pool,
//   method: TMethod,
//   args: Parameters<LendingPoolTransaction<TMethod>>,
// ) => {
//   const balancePre = await (getApi.get()).query.system.account(sender.address);
//   if(args.length === 0){
//     const queryResult1 = await contract.query[method](args);
//   }

//   const queryResult = await contract.query[method](args);
//   const txResult = await contract.tx[method](args);
//   const balanceAfter = await (getApi.get()).query.system.account(sender.address);
//   const realCost = BigInt((balancePre.toJSON() as any).data.free) - BigInt((balanceAfter.toJSON() as any).data.free);
//   return { txResult, txCost: realCost };
// };

export const deposit = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const amountToDeposit = await convertToCurrencyDecimals(reserve.underlying, amount);
  const args: Parameters<typeof lendingPool.tx.deposit> = [reserve.underlying.address, onBehalfOf.address, amountToDeposit, []];

  if (expectedResult === 'success') {
    const parametersBefore = await getCheckDepositParameters(
      lendingPool,
      reserve.underlying,
      reserve.aToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.deposit(...args);
    }

    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.deposit(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);
    const parametersAfter = await getCheckDepositParameters(
      lendingPool,
      reserve.underlying,
      reserve.aToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );
    checkDeposit(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToDeposit,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );

    unsubscribePromises.forEach((unsub) => {
      return unsub();
    });
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.deposit(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.deposit(...args)).to.eventually.be.rejected;
    }
  }
};

export const redeem = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckRedeemParameters(
    lendingPool,
    reserve.underlying,
    reserve.aToken,
    blockTimestampProvider,
    caller,
    onBehalfOf,
  );

  let amountToWithdraw: BN | null = null;

  if (amount !== null) {
    amountToWithdraw = await convertToCurrencyDecimals(reserve.underlying, amount);
  }
  const args: Parameters<typeof lendingPool.tx.redeem> = [reserve.underlying.address, onBehalfOf.address, amountToWithdraw, []];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.redeem(...args);
    }
    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.redeem(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);

    const parametersAfter = await getCheckRedeemParameters(
      lendingPool,
      reserve.underlying,
      reserve.aToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    checkRedeem(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToWithdraw,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.redeem(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.redeem(...args)).to.eventually.be.rejected;
    }
  }
};

export const borrow = async (
  reserveSymbol: string,
  amount: string,
  interestRateMode: string,
  user: KeyringPair,
  onBehalfOf: KeyringPair,
  timeTravelInDays: string,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  if (interestRateMode === RateMode.Stable) {
    await borrowStable(reserveSymbol, amount, user, onBehalfOf, timeTravelInDays, expectedResult, testEnv, expectedErrorName);
  } else {
    await borrowVariable(reserveSymbol, amount, user, onBehalfOf, timeTravelInDays, expectedResult, testEnv, expectedErrorName);
  }
};
export const borrowVariable = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  timeTravelInDays: string,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckBorrowVariableParameters(
    lendingPool,
    reserve.underlying,
    reserve.vToken,
    blockTimestampProvider,
    caller,
    onBehalfOf,
  );

  const amountToBorrow = await convertToCurrencyDecimals(reserve.underlying, amount);
  const args: Parameters<typeof lendingPool.tx.borrow> = [reserve.underlying.address, onBehalfOf.address, amountToBorrow, [0]];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.borrow(...args);
    }
    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.borrow(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);

    if (timeTravelInDays) {
      const secondsToTravel = new BN(timeTravelInDays).mul(ONE_YEAR).div(new BN(365)).toNumber();
      await advanceBlockTimestamp(testEnv.blockTimestampProvider, secondsToTravel);
    }

    const parametersAfter = await getCheckBorrowVariableParameters(
      lendingPool,
      reserve.underlying,
      reserve.vToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    checkBorrowVariable(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToBorrow,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.borrow(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.borrow(...args)).to.eventually.be.rejected;
    }
  }
};
export const borrowStable = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  timeTravelInDays: string,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckBorrowStableParameters(
    lendingPool,
    reserve.underlying,
    reserve.sToken,
    blockTimestampProvider,
    caller,
    onBehalfOf,
  );

  const amountToBorrow = await convertToCurrencyDecimals(reserve.underlying, amount);
  const args: Parameters<typeof lendingPool.tx.borrow> = [reserve.underlying.address, onBehalfOf.address, amountToBorrow, [1]];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.borrow(...args);
    }
    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.borrow(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);

    if (timeTravelInDays) {
      const secondsToTravel = new BN(timeTravelInDays).mul(ONE_YEAR).div(new BN(365)).toNumber();
      await advanceBlockTimestamp(testEnv.blockTimestampProvider, secondsToTravel);
    }

    const parametersAfter = await getCheckBorrowStableParameters(
      lendingPool,
      reserve.underlying,
      reserve.sToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    checkBorrowStable(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToBorrow,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.borrow(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.borrow(...args)).to.eventually.be.rejected;
    }
  }
};

export const repay = async (
  reserveSymbol: string,
  amount: string,
  rateMode: string,
  user: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  if (rateMode === RateMode.Stable) {
    await repayStable(reserveSymbol, amount, user, onBehalfOf, expectedResult, testEnv, expectedErrorName);
  } else {
    await repayVariable(reserveSymbol, amount, user, onBehalfOf, expectedResult, testEnv, expectedErrorName);
  }
};

export const repayVariable = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckRepayVariableParameters(
    lendingPool,
    reserve.underlying,
    reserve.vToken,
    blockTimestampProvider,
    caller,
    onBehalfOf,
  );

  let amountToRepay: BN | null = null;

  if (amount !== null) {
    amountToRepay = await convertToCurrencyDecimals(reserve.underlying, amount);
  }
  const args: Parameters<typeof lendingPool.tx.repay> = [reserve.underlying.address, onBehalfOf.address, amountToRepay, [0]];
  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.repay(...args);
    }
    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.repay(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);

    const parametersAfter = await getCheckRepayVariableParameters(
      lendingPool,
      reserve.underlying,
      reserve.vToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    checkRepayVariable(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToRepay,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.repay(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.repay(...args)).to.eventually.be.rejected;
    }
  }
};

export const repayStable = async (
  reserveSymbol: string,
  amount: string,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
  expectedResult: string,
  testEnv: TestEnv,
  expectedErrorName?: string,
) => {
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve: TokenReserve = reserves[reserveSymbol];

  const parametersBefore = await getCheckRepayStableParameters(
    lendingPool,
    reserve.underlying,
    reserve.sToken,
    blockTimestampProvider,
    caller,
    onBehalfOf,
  );

  let amountToRepay: BN | null = null;

  if (amount !== null) {
    amountToRepay = await convertToCurrencyDecimals(reserve.underlying, amount);
  }
  const args: Parameters<typeof lendingPool.tx.repay> = [reserve.underlying.address, onBehalfOf.address, amountToRepay, [1]];

  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.repay(...args);
    }
    const capturedEvents: ValidateEventParameters[] = [];
    const unsubscribePromises = await subscribeOnEvents(testEnv, reserveSymbol, (eventName, event, sourceContract, timestamp) => {
      capturedEvents.push({ eventName, event, sourceContract, timestamp });
    });

    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.repay(...args));

    const latestEventTimestamp = maxBy(capturedEvents, 'timestamp')?.timestamp;
    const eventsFromTxOnly = capturedEvents.filter((e) => e.timestamp === latestEventTimestamp);

    const parametersAfter = await getCheckRepayStableParameters(
      lendingPool,
      reserve.underlying,
      reserve.sToken,
      blockTimestampProvider,
      caller,
      onBehalfOf,
    );

    checkRepayStable(
      lendingPool.address,
      reserve,
      caller.address,
      onBehalfOf.address,
      amountToRepay,
      parametersBefore,
      parametersAfter,
      eventsFromTxOnly,
    );
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.repay(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.repay(...args)).to.eventually.be.rejected;
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
  const { lendingPool, reserves, blockTimestampProvider } = testEnv;
  const reserve = reserves[reserveSymbol].underlying;

  const { reserveData: reserveDataBefore, userReserveData: userDataBefore } = await getUserReserveDataWithTimestamp(
    reserve,
    caller,
    lendingPool,
    blockTimestampProvider,
  );

  const useAsCollateralToSet = useAsCollateral.toLowerCase() === 'true';
  const args: Parameters<typeof lendingPool.tx.setAsCollateral> = [reserve.address, useAsCollateralToSet];
  if (expectedResult === 'success') {
    if (process.env.DEBUG) {
      const { gasConsumed } = await lendingPool.withSigner(caller).query.setAsCollateral(...args);
    }
    const { txResult, txCost } = await runAndRetrieveTxCost(caller, () => lendingPool.withSigner(caller).tx.setAsCollateral(...args));

    const { userReserveData: userDataAfter } = await getUserReserveDataWithTimestamp(reserve, caller, lendingPool, blockTimestampProvider);

    const expectedUserData = calcExpectedUserDataAfterSetUseAsCollateral(useAsCollateralToSet, reserveDataBefore, userDataBefore);

    //TODO check that nothing else changed?
    expect(expectedUserData.useAsCollateral).to.be.equal(useAsCollateralToSet);
  } else if (expectedResult === 'revert') {
    if (expectedErrorName) {
      await expect(lendingPool.withSigner(caller).query.setAsCollateral(...args)).to.eventually.be.rejected.and.to.have.deep.property(
        '_err',
        getExpectedError(expectedErrorName),
      );
    } else {
      await expect(lendingPool.withSigner(caller).query.setAsCollateral(...args)).to.eventually.be.rejected;
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

export const getReserveAndUserReserveData = async <R extends { address: string }>(
  reserve: R,
  user: KeyringPair,
  lendingPool: LendingPool,
): Promise<{ reserveData: ReserveData; userReserveData: UserReserveData }> => {
  const reserveDataResult = (await lendingPool.query.viewReserveData(reserve.address)).value;
  if (!reserveDataResult) throw new Error(`ERROR READING RESERVE DATA (reserve: ${reserve.address})`);

  const userReserveDataResult = (await lendingPool.query.viewUserReserveData(reserve.address, user.address)).value;
  const result = {
    reserveData: reserveDataResult,
    // Since we override queryOkJson with queryOk (for simpler testing) viewUserReserveData will throw - otherwise ok will not be nullt
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    userReserveData: userReserveDataResult ?? getUserReserveDataDefaultObj(),
  };
  return result;
};

export const getUserReserveDataWithTimestamp = async <R extends { address: string }>(
  reserve: R,
  user: KeyringPair,
  lendingPool: LendingPool,
  blockTimestampProvider: BlockTimestampProvider,
) => {
  const { value: timestamp } = await blockTimestampProvider.query.getBlockTimestamp();
  return {
    ...(await getReserveAndUserReserveData(reserve, user, lendingPool)),
    timestamp: new BN(timestamp.toString()),
  };
};

export const getCheckDepositParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  aToken: AToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckDepositParameters> => {
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.toString()),
    aBalance: new BN((await aToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};

export const getCheckRedeemParameters = async (
  lendingPool: LendingPool,
  underlying: PSP22Emitable,
  aToken: AToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckRedeemParameters> => {
  return {
    ...(await getReserveAndUserReserveData(underlying, onBehalfOf, lendingPool)),
    poolBalance: new BN((await underlying.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await underlying.query.balanceOf(caller.address)).value.toString()),
    aBalance: new BN((await aToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    aAllowance:
      caller.address !== onBehalfOf.address ? new BN((await aToken.query.allowance(onBehalfOf.address, caller.address)).value.toString()) : undefined,
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};

export const getCheckBorrowVariableParameters = async (
  lendingPool: LendingPool,
  underlying: PSP22Emitable,
  vToken: VToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckBorrowVariableParameters> => {
  return {
    ...(await getReserveAndUserReserveData(underlying, onBehalfOf, lendingPool)),
    poolBalance: new BN((await underlying.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await underlying.query.balanceOf(caller.address)).value.toString()),
    vBalance: new BN((await vToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    vAllowance:
      caller.address !== onBehalfOf.address ? new BN((await vToken.query.allowance(onBehalfOf.address, caller.address)).value.toString()) : undefined,
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};

export const getCheckRepayVariableParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  vToken: VToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckRepayVariableParameters> => {
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.toString()),
    vBalance: new BN((await vToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};

export const getCheckBorrowStableParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  sToken: SToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckBorrowStableParameters> => {
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.toString()),
    sBalance: new BN((await sToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    sAllowance:
      caller.address !== onBehalfOf.address ? new BN((await sToken.query.allowance(onBehalfOf.address, caller.address)).value.toString()) : undefined,
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};

export const getCheckRepayStableParameters = async (
  lendingPool: LendingPool,
  reserve: PSP22Emitable,
  sToken: SToken,
  blockTimestampProvider: BlockTimestampProvider,
  caller: KeyringPair,
  onBehalfOf: KeyringPair,
): Promise<CheckRepayStableParameters> => {
  return {
    ...(await getReserveAndUserReserveData(reserve, onBehalfOf, lendingPool)),
    poolBalance: new BN((await reserve.query.balanceOf(lendingPool.address)).value.toString()),
    callerBalance: new BN((await reserve.query.balanceOf(caller.address)).value.toString()),
    sBalance: new BN((await sToken.query.balanceOf(onBehalfOf.address)).value.toString()),
    timestamp: (await blockTimestampProvider.query.getBlockTimestamp()).value,
  };
};
