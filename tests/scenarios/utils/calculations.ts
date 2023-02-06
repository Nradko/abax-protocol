import { ReturnNumber } from '@727-ventures/typechain-types';
import BN from 'bn.js';
import { ReserveData, UserReserveData } from 'typechain/types-returns/lending_pool';

export const BNToReturnNumber = (value: BN) => new ReturnNumber(value.toString());
const addBNToReturnNumber = (rn: ReturnNumber, addValue: BN) => BNToReturnNumber(ReturnNumber.ToBN(rn.toString()).add(addValue));

export const calcExpectedReserveDataAfterDeposit = (amountDeposited: BN, reserveDataBeforeAction: ReserveData, txTimestamp: BN): ReserveData => {
  const expectedReserveData: ReserveData = <ReserveData>{ ...reserveDataBeforeAction };

  expectedReserveData.totalSupplied = addBNToReturnNumber(reserveDataBeforeAction.totalSupplied, amountDeposited);
  return expectedReserveData;
};

export const calcExpectedUserDataAfterDeposit = (
  amountDeposited: BN,
  reserveDataBeforeAction: ReserveData,
  reserveDataAfterAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): UserReserveData => {
  const expectedUserData = <UserReserveData>{ ...userDataBeforeAction };
  return expectedUserData;
};

export const calcExpectedReserveDataAfterBorrowVariable = (
  amountBorrowed: BN,
  reserveDataBeforeAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): ReserveData => {
  const expectedReserveData = <ReserveData>{ ...reserveDataBeforeAction };
  return expectedReserveData;
};

export const calcExpectedUserDataAfterBorrowVariable = (
  amountBorrowed: BN,
  reserveDataBeforeAction: ReserveData,
  expectedDataAfterAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): UserReserveData => {
  const expectedUserData = <UserReserveData>{ ...userDataBeforeAction };
  return expectedUserData;
};

export const calcExpectedReserveDataAfterRepayVariable = (
  amountRepaid: BN | null,
  reserveDataBeforeAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): ReserveData => {
  const expectedReserveData: ReserveData = <ReserveData>{ ...reserveDataBeforeAction };
  return expectedReserveData;
};

export const calcExpectedUserDataAfterRepayVariable = (
  totalRepaid: BN | null,
  reserveDataBeforeAction: ReserveData,
  expectedDataAfterAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  user: string,
  onBehalfOf: string,
  txTimestamp: BN,
  currentTimestamp: BN,
): UserReserveData => {
  const expectedUserData = <UserReserveData>{ ...userDataBeforeAction };
  return expectedUserData;
};

export const calcExpectedReserveDataAfterRepayStable = (
  amountRepaid: BN | null,
  reserveDataBeforeAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): ReserveData => {
  const expectedReserveData: ReserveData = <ReserveData>{ ...reserveDataBeforeAction };
  return expectedReserveData;
};

export const calcExpectedUserDataAfterRepayStable = (
  totalRepaid: BN | null,
  reserveDataBeforeAction: ReserveData,
  expectedDataAfterAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  user: string,
  onBehalfOf: string,
  txTimestamp: BN,
  currentTimestamp: BN,
): UserReserveData => {
  const expectedUserData = <UserReserveData>{ ...userDataBeforeAction };
  return expectedUserData;
};

export const calcExpectedReserveDataAfterRedeem = (
  amountWithdrawn: BN | null,
  reserveDataBeforeAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
): ReserveData => {
  const expectedReserveData: ReserveData = <ReserveData>{ ...reserveDataBeforeAction };

  return expectedReserveData;
};

export const calcExpectedUserDataAfterRedeem = (
  amountWithdrawn: BN | null,
  reserveDataBeforeAction: ReserveData,
  reserveDataAfterAction: ReserveData,
  userDataBeforeAction: UserReserveData,
  txTimestamp: BN,
  currentTimestamp: BN,
): UserReserveData => {
  const expectedUserData = <UserReserveData>{ ...userDataBeforeAction };
  return expectedUserData;
};
