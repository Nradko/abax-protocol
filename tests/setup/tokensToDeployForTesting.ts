import { InterestRateModelParams } from 'typechain/types-arguments/lending_pool';
import { TokensToDeployForTesting } from './tokensToDeployForTesting.types';
import { BN } from 'bn.js';

export const ONE_PERCENT_APR = 3_170_979;

export const ONE_SEC = new BN(1000);
export const ONE_MIN = ONE_SEC.muln(60);
export const ONE_HOUR = ONE_MIN.muln(60);
export const ONE_DAY = ONE_HOUR.muln(24);
export const ONE_YEAR = ONE_DAY.muln(365);

/* eslint-disable */
export const DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING: InterestRateModelParams = {
  targetUrE6: 900_000,
  minRateAtTargetE18: 2 * ONE_PERCENT_APR,
  maxRateAtTargetE18: 10 * ONE_PERCENT_APR,

  rateAtMaxUrE18: 100 * ONE_PERCENT_APR,
  minimalTimeBetweenAdjustments: ONE_HOUR,
};

export const E6: number = 1_000_000;

export const TOKENS_TO_DEPLOY_FOR_TESTING: TokensToDeployForTesting = {
  reserveTokens: [
    {
      metadata: {
        name: 'DAI',
        symbol: 'DAI',
        decimals: 6,
      },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,

      defaultRule: {
        collateralCoefficientE6: 0.97 * E6,
        borrowCoefficientE6: 1.03 * E6,
        penaltyE6: 0.015 * E6,
      },
      restrictions: {
        maximalTotalDeposit: null,
        maximalTotalDebt: null,
        minimalCollateral: '2000000',
        minimalDebt: '1000000',
      },
    },
    {
      metadata: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: {
        collateralCoefficientE6: 0.98 * E6,
        borrowCoefficientE6: 1.02 * E6,
        penaltyE6: 0.01 * E6,
      },
      restrictions: {
        maximalTotalDeposit: null,
        maximalTotalDebt: null,
        minimalCollateral: '2000',
        minimalDebt: '1000',
      },
    },
    {
      metadata: {
        name: 'WETH',
        symbol: 'WETH',
        decimals: 18,
      },
      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: {
        collateralCoefficientE6: 0.8 * E6,
        borrowCoefficientE6: 1.2 * E6,
        penaltyE6: 0.1 * E6,
      },
      restrictions: {
        maximalTotalDeposit: null,
        maximalTotalDebt: null,
        minimalCollateral: '2000',
        minimalDebt: '1000',
      },
    },
    {
      metadata: {
        name: 'LINK',
        symbol: 'LINK',
        decimals: 18,
      },
      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: {
        collateralCoefficientE6: 0.7 * E6,
        borrowCoefficientE6: 1.3 * E6,
        penaltyE6: 0.15 * E6,
      },
      restrictions: {
        maximalTotalDeposit: '1000000000000000000000000000',
        maximalTotalDebt: '1000000000000000000000000000',
        minimalCollateral: '2000',
        minimalDebt: '1000',
      },
    },
  ],
  stableTokens: [
    {
      metadata: {
        name: 'USDax',
        symbol: 'USDax',
        decimals: 6,
      },
      defaultRule: {
        collateralCoefficientE6: null,
        borrowCoefficientE6: 1.1 * E6,
        penaltyE6: 0.05 * E6,
      },
      restrictions: {
        maximalTotalDeposit: '0',
        maximalTotalDebt: '1000000000000',
        minimalCollateral: '2000',
        minimalDebt: '1000000',
      },
      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      debtRate: '350000',
    },
  ],
};
