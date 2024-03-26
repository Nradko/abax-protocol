import BN from 'bn.js';
import { expect } from 'tests/setup/chai';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import { Transfer } from 'typechain/event-types/a_token';
import { AnyAbaxContractEvent, ContractsEvents } from 'typechain/events/enum';
import { ReserveData, ReserveIndexes, UserReserveData } from 'typechain/types-returns/lending_pool';
import { getContractEventsFromTx } from 'wookashwackomytest-polkahat-chai-matchers';
import { SignAndSendSuccessResponse } from 'wookashwackomytest-typechain-types';
import { TokenReserve } from './make-suite';

const BN_ZERO = new BN(0);
export interface CheckDepositParameters {
  reserveData: ReserveData;
  reserveIndexes: ReserveIndexes;
  userReserveData: UserReserveData;
  poolBalance: BN;
  callerBalance: BN;
  aBalance: BN;
  timestamp: number;
}

export interface CheckWithdrawParameters {
  reserveData: ReserveData;
  reserveIndexes: ReserveIndexes;
  userReserveData: UserReserveData;
  poolBalance: BN;
  callerBalance: BN;
  aBalance: BN;
  aAllowance: BN | undefined;
  timestamp: number;
}

export interface CheckBorrowParameters {
  reserveData: ReserveData;
  reserveIndexes: ReserveIndexes;
  userReserveData: UserReserveData;
  poolBalance: BN;
  callerBalance: BN;
  vBalance: BN;
  vAllowance: BN | undefined;
  timestamp: number;
}

export interface CheckRepayParameters {
  reserveData: ReserveData;
  reserveIndexes: ReserveIndexes;
  userReserveData: UserReserveData;
  poolBalance: BN;
  callerBalance: BN;
  vBalance: BN;
  timestamp: number;
}
export interface Interests {
  supply: BN;
  variableBorrow: BN;
}

export const checkDeposit = async (
  lendingPool: LendingPoolContract,
  reserveToken: TokenReserve,
  caller: string,
  onBehalfOf: string,
  amount: BN,
  parBefore: CheckDepositParameters,
  parAfter: CheckDepositParameters,
  tx: SignAndSendSuccessResponse,
) => {
  const userInterests = getUserInterests(parBefore.userReserveData, parAfter.reserveIndexes);

  await expect(tx).to.emitEvent(lendingPool, ContractsEvents.LendingPoolEvent.Deposit, {
    asset: reserveToken.underlying.address,
    amount: amount,
    caller: caller,
    onBehalfOf: onBehalfOf,
  });

  const [aTokenEvents] = getContractEventsFromTx(tx, reserveToken.aToken as any, ContractsEvents.ATokenEvent.Transfer);
  const [vTokenEvents] = getContractEventsFromTx(tx, reserveToken.vToken as any, ContractsEvents.VTokenEvent.Transfer);

  // AToken
  checkAbacusTokenTransferEvent(aTokenEvents[0], onBehalfOf, amount, userInterests.supply, true, 'Deposit | AToken Transfer Event');
  // VToken
  checkAbacusTokenTransferEvent(vTokenEvents[0], onBehalfOf, BN_ZERO, userInterests.variableBorrow, true, 'Deposit | VToken Transfer Event');

  // ReserveData Checks
  // total_deposit <- increases on deposit
  let before = parBefore.reserveData.totalDeposit;
  let expected = before.add(amount).add(userInterests.supply);
  let actual = parAfter.reserveData.totalDeposit;

  if (expected.toString() !== actual.toString()) {
    console.log(`Deposit | ReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Deposit | ReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());

  // UserReserveData Checks
  // timestamp should be set to reserve data timestamp

  // deposit <- increases on deposit
  before = parBefore.userReserveData.deposit;
  expected = before.add(amount).add(userInterests.supply);
  actual = parAfter.userReserveData.deposit;

  if (expected.toString() !== actual.toString()) {
    console.log(`Deposit | UserReserveData | total_deposit | before:\n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Deposit | UserReserveData | total_deposit | before:\n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // Underlying Asset Checks
  // LendingPool Balance  <- increases on deposit
  before = parBefore.poolBalance;
  expected = before.add(amount);
  actual = parAfter.poolBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Deposit | Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Deposit | Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // Caller Balance  <- decreases on deposit
  before = parBefore.callerBalance;
  expected = before.sub(amount);
  actual = parAfter.callerBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Deposit | Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Deposit | Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // AToken Checks
  //balance <- increase od Deposit
  before = parBefore.aBalance;
  expected = before.add(amount).add(userInterests.supply);
  actual = parAfter.aBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Deposit | AToken user Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Deposit | AToken user Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());
  expect.flushSoft();
};

export const checkWithdraw = async (
  lendingPool: LendingPoolContract,
  reserveToken: TokenReserve,
  caller: string,
  onBehalfOf: string,
  amount: BN,
  parBefore: CheckWithdrawParameters,
  parAfter: CheckWithdrawParameters,
  tx: SignAndSendSuccessResponse,
) => {
  const userInterests = getUserInterests(parBefore.userReserveData, parAfter.reserveIndexes);
  amount = amount.lt(parBefore.userReserveData.deposit.add(userInterests.supply))
    ? amount
    : parBefore.userReserveData.deposit.add(userInterests.supply);

  await expect(tx).to.emitEvent(lendingPool, ContractsEvents.LendingPoolEvent.Withdraw, {
    asset: reserveToken.underlying.address,
    amount: amount,
    caller: caller,
    onBehalfOf: onBehalfOf,
  });

  const [aTokenEvents] = getContractEventsFromTx(tx, reserveToken.aToken as any, ContractsEvents.ATokenEvent.Transfer);
  const [vTokenEvents] = getContractEventsFromTx(tx, reserveToken.vToken as any, ContractsEvents.VTokenEvent.Transfer);

  // AToken
  checkAbacusTokenTransferEvent(aTokenEvents[0], onBehalfOf, amount.neg(), userInterests.supply, true, 'Withdraw | AToken Transfer Event');
  // VToken
  checkAbacusTokenTransferEvent(vTokenEvents[0], onBehalfOf, BN_ZERO, userInterests.variableBorrow, true, 'Withdraw | VToken Transfer Event');

  // ReserveData Checks
  // total_deposit <- decreases on Withdraw
  let before = parBefore.reserveData.totalDeposit;
  let expected = before.add(userInterests.supply).sub(amount);
  let actual = parAfter.reserveData.totalDeposit;

  if (expected.toString() !== actual.toString()) {
    console.log(`Withdraw | ReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Withdraw | ReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());

  // UserReserveData Checks
  // timestamp should be set to reserve data timestamp

  // deposit <- decreases on Withdraw
  before = parBefore.userReserveData.deposit;
  expected = before.add(userInterests.supply).sub(amount);
  actual = parAfter.userReserveData.deposit;

  if (expected.toString() !== actual.toString()) {
    console.log(
      `Withdraw | UserReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    );
  }
  expect
    .soft(
      actual.toString(),
      `Withdraw | UserReserveData | total_deposit | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());

  // Underlying Balances Checks
  // LendingPool Balance <- decreases on Withdraw
  before = parBefore.poolBalance;
  expected = before.sub(amount);
  actual = parAfter.poolBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Withdraw | Underlying Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Withdraw | Underlying Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());

  // Caller Balance <- increases on Withdraw
  before = parBefore.callerBalance;
  expected = before.add(amount);
  actual = parAfter.callerBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Withdraw | Underlying Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Withdraw | Underlying Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equal(expected.toString());

  // // AToken Checks
  // // balance <- decrease on Withdraw
  before = parBefore.aBalance;
  expected = before.add(userInterests.supply).sub(amount);
  actual = parAfter.aBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Withdraw | AToken Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Withdraw | AToken Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // alowance <- decrease on Withdraw
  if (parBefore.aAllowance !== undefined && parAfter.aAllowance !== undefined) {
    before = parBefore.aAllowance;
    expected = before.sub(amount);
    actual = parAfter.aAllowance;

    expect
      .soft(
        actual.toString(),
        `Withdraw | AToken Allowance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
      )
      .to.equal(expected.toString());
  }

  expect.flushSoft();
};

export const checkBorrow = async (
  lendingPool: LendingPoolContract,
  reserveToken: TokenReserve,
  caller: string,
  onBehalfOf: string,
  amount: BN,
  parBefore: CheckBorrowParameters,
  parAfter: CheckBorrowParameters,
  tx: SignAndSendSuccessResponse,
) => {
  const userInterests = getUserInterests(parBefore.userReserveData, parAfter.reserveIndexes);

  await expect(tx).to.emitEvent(lendingPool, ContractsEvents.LendingPoolEvent.Borrow, {
    asset: reserveToken.underlying.address,
    amount: amount,
    caller: caller,
    onBehalfOf: onBehalfOf,
  });

  const [aTokenEvents] = getContractEventsFromTx(tx, reserveToken.aToken as any, ContractsEvents.ATokenEvent.Transfer);
  const [vTokenEvents] = getContractEventsFromTx(tx, reserveToken.vToken as any, ContractsEvents.VTokenEvent.Transfer);

  // AToken
  checkAbacusTokenTransferEvent(aTokenEvents[0], onBehalfOf, BN_ZERO, userInterests.supply, true, 'Borrow | AToken Transfer Event');
  // VToken
  checkAbacusTokenTransferEvent(vTokenEvents[0], onBehalfOf, amount, userInterests.variableBorrow, true, 'Borrow | VToken Transfer Event');

  // ReserveData Checks
  // total_debt <- increases on borrow
  let before = parBefore.reserveData.totalDebt;
  let expected = before.add(userInterests.variableBorrow).add(amount);
  let actual = parAfter.reserveData.totalDebt;

  if (expected.toString() !== actual.toString()) {
    console.log(`Borrow | ReserveData | total_debt | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Borrow | ReserveData | total_debt | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.almostDeepEqual(expected.toString());

  // UserReserveData Checks
  // timestamp should be set to reserve data timestamp

  // variable_borroved <- increases on Borrow
  before = parBefore.userReserveData.debt;
  expected = before.add(userInterests.variableBorrow).add(amount);
  actual = parAfter.userReserveData.debt;

  if (expected.toString() !== actual.toString()) {
    console.log(`Borrow | UserReserveData | debt | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Borrow | UserReserveData | debt | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equalUpTo1Digit(expected.toString());

  // Underlying Balances Checks
  // LendingPool Balance <- decreases on Borrow
  before = parBefore.poolBalance;
  expected = before.sub(amount);
  actual = parAfter.poolBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Borrow | Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Borrow | Pool Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // Caller Balance <- increases on Borrow
  before = parBefore.callerBalance;
  expected = before.add(amount);
  actual = parAfter.callerBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Borrow | Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Borrow | Caller Balace | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // // VToken Checks
  // // balnce <- increase on Borrow
  before = parBefore.vBalance;
  expected = before.add(userInterests.variableBorrow).add(amount);
  actual = parAfter.vBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Borrow | VToken Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Borrow | VToken Balance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());

  // allowance <- decrease on Borrow
  if (parBefore.vAllowance !== undefined && parAfter.vAllowance !== undefined) {
    before = parBefore.vAllowance;
    expected = before.sub(amount);
    actual = parAfter.vAllowance;

    expect
      .soft(actual.toString(), `Borrow | VToken Allowance | \n before: ${before} \n amount ${amount} \n expected: ${expected} \n actual: ${actual}\n`)
      .to.equal(expected.toString());
  }

  expect.flushSoft();
};

export const checkRepay = async (
  lendingPool: LendingPoolContract,
  reserveToken: TokenReserve,
  caller: string,
  onBehalfOf: string,
  amountArg: BN | null,
  parBefore: CheckRepayParameters,
  parAfter: CheckRepayParameters,
  tx: SignAndSendSuccessResponse,
) => {
  const userInterests = getUserInterests(parBefore.userReserveData, parAfter.reserveIndexes);
  const amountToUse = amountArg?.lte(parBefore.userReserveData.debt.add(userInterests.variableBorrow))
    ? amountArg
    : parBefore.userReserveData.debt.add(userInterests.variableBorrow);

  await expect(tx).to.emitEvent(lendingPool, ContractsEvents.LendingPoolEvent.Repay, {
    asset: reserveToken.underlying.address,
    amount: amountToUse,
    caller: caller,
    onBehalfOf: onBehalfOf,
  });

  const [aTokenEvents] = getContractEventsFromTx(tx, reserveToken.aToken as any, ContractsEvents.ATokenEvent.Transfer);
  const [vTokenEvents] = getContractEventsFromTx(tx, reserveToken.vToken as any, ContractsEvents.VTokenEvent.Transfer);

  // AToken
  checkAbacusTokenTransferEvent(aTokenEvents[0], onBehalfOf, BN_ZERO, userInterests.supply, true, 'Repay | AToken Transfer Event');
  // VToken
  checkAbacusTokenTransferEvent(vTokenEvents[0], onBehalfOf, amountToUse.neg(), userInterests.variableBorrow, true, 'Repay | VToken Transfer Event');

  // ReserveData Checks
  // total_debt <- decreases on repayVariable
  let before = parBefore.reserveData.totalDebt;
  if (before.sub(amountToUse).lten(0))
    console.log('Repay | ReserveData | total_debt - repay of the amount would cause an underflow. No loss happens. Expecting total_debt to equal 0');

  let expected = before.add(userInterests.variableBorrow).sub(amountToUse);
  let actual = parAfter.reserveData.totalDebt;

  if (expected.toString() !== actual.toString()) {
    console.log(`Repay | ReserveData | total_debt | \n before: ${before} \n amount: ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Repay | ReserveData | total_debt | \n before: ${before} \n amount: ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.almostEqualOrEqualNumberE12(expected.toString());

  // UserReserveData Checks
  // variable_borroved <- decreases on Repay
  before = parBefore.userReserveData.debt;
  expected = before.add(userInterests.variableBorrow).sub(amountToUse);
  actual = parAfter.userReserveData.debt;

  if (expected.toString() !== actual.toString()) {
    console.log(`Repay | UserReserveData | debt | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(
      actual.toString(),
      `Repay | UserReserveData | debt | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`,
    )
    .to.equalUpTo1Digit(expected.toString());

  // Underlying Balances Checks
  // LendingPool Balance <- increases on Repay
  before = parBefore.poolBalance;
  expected = before.add(amountToUse);
  actual = parAfter.poolBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Repay | Pool Balace | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Repay | Pool Balace | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equalUpTo1Digit(expected.toString());

  // Caller Balance <- decreases on Repay
  before = parBefore.callerBalance;
  expected = before.sub(amountToUse);
  actual = parAfter.callerBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Repay | Caller Balace | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Repay | Caller Balace | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equalUpTo1Digit(expected.toString());

  // // VToken Checks
  // // balnce <- decreases on Repay
  before = parBefore.vBalance;
  expected = before.sub(amountToUse);
  actual = parAfter.vBalance;

  if (expected.toString() !== actual.toString()) {
    console.log(`Repay | VToken Balance | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`);
  }
  expect
    .soft(actual.toString(), `Repay | VToken Balance | \n before: ${before} \n amount ${amountToUse} \n expected: ${expected} \n actual: ${actual}\n`)
    .to.equal(expected.toString());
  expect.flushSoft();
};

const getUserInterests = (userReserveData: UserReserveData, reserveIndexesAfter: ReserveIndexes): Interests => {
  const supplyInterest = userReserveData.appliedDepositIndexE18.eqn(0)
    ? new BN(0)
    : userReserveData.deposit.mul(reserveIndexesAfter.depositIndexE18).div(userReserveData.appliedDepositIndexE18).sub(userReserveData.deposit);
  if (supplyInterest !== new BN(0)) {
    supplyInterest.addn(1);
  }

  const variableBorrowInterest = userReserveData.appliedDepositIndexE18.eqn(0)
    ? new BN(0)
    : userReserveData.debt.mul(reserveIndexesAfter.debtIndexE18).div(userReserveData.appliedDebtIndexE18).sub(userReserveData.debt);
  if (variableBorrowInterest !== new BN(0)) {
    variableBorrowInterest.addn(1);
  }

  return { supply: supplyInterest, variableBorrow: variableBorrowInterest };
};
// this function does assume that comulative Indexes are calculated correctly inside the contract.
// this corectness is tested in rust unit tests.
const getReserveInterests = (
  reserveDataBefore: ReserveData,
  reserveIndexesBefore: ReserveIndexes,
  reserveIndexesAfter: ReserveIndexes,
): Interests => {
  const supplyInterest = reserveIndexesBefore.depositIndexE18.eqn(0)
    ? new BN(0)
    : reserveDataBefore.totalDeposit
        .mul(reserveIndexesAfter.depositIndexE18)
        .div(reserveIndexesBefore.depositIndexE18)
        .sub(reserveDataBefore.totalDeposit);
  if (supplyInterest !== new BN(0)) {
    supplyInterest.addn(1);
  }

  const variableBorrowInterest = reserveIndexesBefore.debtIndexE18.eqn(0)
    ? new BN(0)
    : reserveDataBefore.totalDebt.mul(reserveIndexesAfter.debtIndexE18).div(reserveIndexesBefore.debtIndexE18).sub(reserveDataBefore.totalDebt);
  if (variableBorrowInterest !== new BN(0)) {
    variableBorrowInterest.addn(1);
  }

  return { supply: supplyInterest, variableBorrow: variableBorrowInterest };
};

const checkAbacusTokenTransferEvent = (
  abacusTokenTransferEventArg: { args: AnyAbaxContractEvent } | undefined,
  user: string,
  amount: BN | number | string,
  interest: BN | number | string,
  add: boolean,
  messagge: string,
) => {
  const amountTransferred: BN = add ? new BN(amount).add(new BN(interest)) : new BN(amount).sub(new BN(interest));

  if (process.env.DEBUG) {
    if (amountTransferred.isZero()) {
      if (abacusTokenTransferEventArg !== undefined) console.log(messagge + ' | emitted while shouldnt be\n');
    } else {
      if (abacusTokenTransferEventArg === undefined) console.log(messagge + ' | not emitted');
      const abacusTokenTransferEvent = abacusTokenTransferEventArg?.args as any as Transfer;
      if (amountTransferred.isNeg()) {
        if (abacusTokenTransferEvent?.from?.toString() !== user) console.log(messagge + ' | from');
        if (abacusTokenTransferEvent?.to?.toString() !== undefined) console.log(messagge + 'to');
      } else {
        if (abacusTokenTransferEvent?.from?.toString() !== undefined) console.log(messagge + ' | from');
        if (abacusTokenTransferEvent?.to?.toString() !== user) console.log(messagge + 'to');
      }
      if (abacusTokenTransferEvent?.value?.toString() !== amountTransferred.abs().toString()) console.log(messagge + 'value');
    }
  }

  if (amountTransferred.isZero()) {
    expect(abacusTokenTransferEventArg, messagge + ` | emitted while shouldnt be`).to.be.undefined;
    return;
  }

  expect(abacusTokenTransferEventArg, messagge + ' | not emitted').not.to.be.undefined;
  const abacusTokenTransferEvent = abacusTokenTransferEventArg?.args as any as Transfer;
  if (amountTransferred.isNeg()) {
    expect.soft(abacusTokenTransferEvent?.from?.toString(), messagge + ' | from').to.equal(user);
    expect.soft(abacusTokenTransferEvent?.to?.toString(), messagge + 'to').to.equal(undefined);
  } else {
    expect.soft(abacusTokenTransferEvent?.from?.toString(), messagge + ' | from').to.equal(undefined);
    expect.soft(abacusTokenTransferEvent?.to?.toString(), messagge + ' | to').to.equal(user);
  }
  expect.soft(abacusTokenTransferEvent?.value?.toString(), messagge + ' | value').to.equalUpTo1Digit(amountTransferred.abs().toString());
};
