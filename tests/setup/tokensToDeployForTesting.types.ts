import BN from 'bn.js';
import { AssetRules, SetReserveFeesArgs, ReserveRestrictions, InterestRateModelParams } from 'typechain/types-arguments/lending_pool';

export type TokenMetadata = {
  name: string;
  symbol: string;
  decimals: number;
};

export type InterestRateModel = [
  number | string,
  number | string,
  number | string,
  number | string,
  number | string,
  number | string,
  number | string,
];

export interface TestToken {
  metadata: TokenMetadata;
  defaultRule: AssetRules;
  restrictions: ReserveRestrictions;
  fees: SetReserveFeesArgs;
}

export interface TestExternalToken extends TestToken {
  interestRateModelParams: InterestRateModelParams;
}

export interface TestInternalStableToken extends TestToken {
  debtRate?: string | BN;
}

export type TokensToDeployForTesting = {
  reserveTokens: Array<TestExternalToken>;
  stableTokens: Array<TestInternalStableToken>;
};
