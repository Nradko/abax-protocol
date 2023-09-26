import { E8, parseAmountToBN } from '@abaxfinance/utils';
import BN from 'bn.js';

export const oneEther = new BN(Math.pow(10, 18).toString());

const mutliplyBy = (b: BN, amount: string | number) => {
  const { amountParsed, amountParsedDecimals } = parseAmountToBN(amount.toString());
  return b.mul(amountParsed).div(new BN(Math.pow(10, amountParsedDecimals).toString()));
};
export const MOCK_CHAINLINK_AGGREGATORS_PRICES = {
  // Update to USD-based price feeds
  DAI: E8,
  USDC: E8,
  WETH: 270 * E8,
  LINK: 100 * E8,
};

export interface ReserveTokenDeploymentData {
  name: string;
  address: string;
  decimals: number;
  feeD6: number;
  collateralCoefficient: null | number;
  borrowCoefficient: null | number;
  maximalTotalSupply: null | BN | string;
  maximalTotalDebt: null | BN | string;
  minimalCollateral: number | BN;
  minimalDebt: number | BN;
  penalty: number;
  stableBaseRate: number | null;
}
