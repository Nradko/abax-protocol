import type BN from 'bn.js';

export type AccountId = string | number[];

export type Mapping = {};

export type Lazy = {};

export enum LangError {
  couldNotReadInput = 'CouldNotReadInput',
}

export type Hash = string | number[];

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
