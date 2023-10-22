import { E8, parseAmountToBN } from '@abaxfinance/utils';
import BN from 'bn.js';

export const oneEther = new BN(Math.pow(10, 18).toString());

const mutliplyBy = (b: BN, amount: string | number) => {
  const { amountParsed, amountParsedDecimals } = parseAmountToBN(amount.toString());
  return b.mul(amountParsed).div(new BN(Math.pow(10, amountParsedDecimals).toString()));
};
export const MOCK_CHAINLINK_AGGREGATORS_PRICES = {
  // Update to USD-based price feeds
  DAI: '1000000000000000000',
  USDC: '1000000000000000000',
  WETH: '270000000000000000000',
  LINK: '100000000000000000000',
};

export interface ReserveTokenDeploymentData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  feeD6: number;
  collateralCoefficient: null | number;
  borrowCoefficient: null | number;
  maximalTotalDeposit: null | BN | string;
  maximalTotalDebt: null | BN | string;
  minimalCollateral: number | BN;
  minimalDebt: number | BN;
  penalty: number;
}
