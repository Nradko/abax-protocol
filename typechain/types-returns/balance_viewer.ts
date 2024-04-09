import type BN from 'bn.js';

export type AccountId = string | number[];

export enum LangError {
  couldNotReadInput = 'CouldNotReadInput',
}

export type ReserveData = {
  activated: boolean;
  frozen: boolean;
  totalDeposit: BN;
  currentDepositRateE18: BN;
  totalDebt: BN;
  currentDebtRateE18: BN;
};

export type AccountReserveData = {
  deposit: BN;
  debt: BN;
  appliedDepositIndexE18: BN;
  appliedDebtIndexE18: BN;
};

export type CompleteReserveData = {
  data: ReserveData | null;
  indexes: ReserveIndexes | null;
  interestRateModel: Array<BN> | null;
  fees: ReserveFees | null;
  restriction: ReserveRestrictions | null;
  decimalMultiplier: BN | null;
  tokens: ReserveAbacusTokens | null;
};

export type ReserveIndexes = {
  depositIndexE18: BN;
  debtIndexE18: BN;
  updateTimestamp: BN;
};

export type ReserveFees = {
  depositFeeE6: BN;
  debtFeeE6: BN;
  earnedFee: BN;
};

export type ReserveRestrictions = {
  maximalTotalDeposit: BN | null;
  maximalTotalDebt: BN | null;
  minimalCollateral: BN;
  minimalDebt: BN;
};

export type ReserveAbacusTokens = {
  aTokenAddress: AccountId;
  vTokenAddress: AccountId;
};

export type SetReserveFeesArgs = {
  debtFeeE6: BN;
  depositFeeE6: BN;
};