import type BN from 'bn.js';

export type AccountId = string | number[];

export type Lazy = {};

export type Mapping = {};

export type OwnableData = {
  owner: Lazy;
};

export enum LangError {
  couldNotReadInput = 'CouldNotReadInput',
}

export enum OwnableError {
  callerIsNotOwner = 'CallerIsNotOwner',
  actionRedundant = 'ActionRedundant',
}

export enum PriceFeedError {
  noSuchAsset = 'NoSuchAsset',
  noPriceFeed = 'NoPriceFeed',
}

export type ReserveRestrictions = {
  maximalTotalDeposit: (string | number | BN) | null;
  maximalTotalDebt: (string | number | BN) | null;
  minimalCollateral: string | number | BN;
  minimalDebt: string | number | BN;
};

export type SetReserveFeesArgs = {
  debtFeeE6: number | string | BN;
  depositFeeE6: number | string | BN;
};
