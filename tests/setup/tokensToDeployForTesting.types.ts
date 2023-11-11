import BN from 'bn.js';

export type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
};

export type TokenLendingParameters = {
  incomeForSuppliersPartE6: number | string;
  interestRateModelE24: [number | string, number | string, number | string, number | string, number | string, number | string, number | string];
};

export type TokenDefaultAssetRule = {
  collateralCoefficientE6: null | number | string;
  borrowCoefficientE6: null | number | string;
  penaltyE6: number | string;
};

export type TokenLendingRestrictions = {
  maximalSupply: null | string;
  maximalDebt: null | string;
  minimalCollateral: string;
  minimalDebt: string;
};

export type TestReserveToken = {
  metadata: TokenMetadata;
  parameters: TokenLendingParameters;
  defaultRule: TokenDefaultAssetRule;
  restrictions: TokenLendingRestrictions;
};

export type TestStablecoin = {
  metadata: TokenMetadata;
  defaultRule: TokenDefaultAssetRule;
  restrictions: TokenLendingRestrictions;
  debtRate?: string | BN;
};

export type TokensToDeployForTesting = {
  reserveTokens: Array<TestReserveToken>;
  stableTokens: Array<TestStablecoin>;
};
