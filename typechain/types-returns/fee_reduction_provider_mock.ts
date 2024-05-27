import type BN from 'bn.js';

export type Mapping = {};

export type AccountId = string | number[];

export enum LangError {
  couldNotReadInput = 'CouldNotReadInput',
}

export type ReserveRestrictions = {
  maximalTotalDeposit: BN | null;
  maximalTotalDebt: BN | null;
  minimalCollateral: BN;
  minimalDebt: BN;
};

export type SetReserveFeesArgs = {
  debtFeeE6: BN;
  depositFeeE6: BN;
};
