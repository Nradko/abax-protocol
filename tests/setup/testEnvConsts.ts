import BN from 'bn.js';
import { E6, parseAmountToBN } from 'tests/scenarios/utils/misc';

export const oneEther = new BN(Math.pow(10, 18).toString());

const mutliplyBy = (b: BN, amount: string | number) => {
  const { amountParsed, amountParsedDecimals } = parseAmountToBN(amount.toString());
  return b.mul(amountParsed).div(new BN(Math.pow(10, amountParsedDecimals).toString()));
};
export const MOCK_CHAINLINK_AGGREGATORS_PRICES = {
  // Update to USD-based price feeds
  DAI: E6,
  USDC: E6,
  WETH: 270 * E6,
  LINK: 100 * E6,
};

export interface ReserveTokenDeploymentData {
  name: string;
  address: string;
  decimals: number;
  feeD6: number;
  collateralCoefficient: null | number;
  borrowCoefficient: null | number;
  penalty: number;
  flashLoanFeeE6: number;
  stableBaseRate: number;
}
