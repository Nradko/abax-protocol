import BN from "bn.js";
import type * as ReturnTypes from '../types-returns/a_token';

export interface Deposit {
	asset: ReturnTypes.AccountId;
	caller: ReturnTypes.AccountId;
	onBehalfOf: ReturnTypes.AccountId;
	amount: BN;
}

export interface Withdraw {
	asset: ReturnTypes.AccountId;
	caller: ReturnTypes.AccountId;
	onBehalfOf: ReturnTypes.AccountId;
	amount: BN;
}

export interface MarketRuleChosen {
	caller: ReturnTypes.AccountId;
	marketRuleId: BN;
}

export interface CollateralSet {
	caller: ReturnTypes.AccountId;
	asset: ReturnTypes.AccountId;
	set: boolean;
}

export interface Borrow {
	asset: ReturnTypes.AccountId;
	caller: ReturnTypes.AccountId;
	onBehalfOf: ReturnTypes.AccountId;
	amount: BN;
}

export interface Repay {
	asset: ReturnTypes.AccountId;
	caller: ReturnTypes.AccountId;
	onBehalfOf: ReturnTypes.AccountId;
	amount: BN;
}

export interface FlashLoan {
	receiver: ReturnTypes.AccountId;
	caller: ReturnTypes.AccountId;
	asset: ReturnTypes.AccountId;
	amount: BN;
	fee: BN;
}

export interface Liquidation {
	liquidator: ReturnTypes.AccountId;
	liquidatedAccount: ReturnTypes.AccountId;
	assetToRepay: ReturnTypes.AccountId;
	assetToTake: ReturnTypes.AccountId;
	amountRepaid: BN;
	amountTaken: BN;
}

export interface InterestsAccumulated {
	asset: ReturnTypes.AccountId;
}

export interface AssetRegistered {
	asset: ReturnTypes.AccountId;
	decimals: BN;
	name: string;
	symbol: string;
	aTokenCodeHash: Array<BN>;
	vTokenCodeHash: Array<BN>;
	aTokenAddress: ReturnTypes.AccountId;
	vTokenAddress: ReturnTypes.AccountId;
}

export interface PriceFeedProviderChanged {
	priceFeedProvider: ReturnTypes.AccountId;
}

export interface FeeReductionChanged {
	feeReductionProvider: ReturnTypes.AccountId;
}

export interface FlashLoanFeeChanged {
	flashLoanFeeE6: BN;
}

export interface ReserveActivated {
	asset: ReturnTypes.AccountId;
	active: boolean;
}

export interface ReserveFrozen {
	asset: ReturnTypes.AccountId;
	frozen: boolean;
}

export interface ReserveInterestRateModelChanged {
	asset: ReturnTypes.AccountId;
	interestRateModel: Array<BN>;
}

export interface ReserveRestrictionsChanged {
	asset: ReturnTypes.AccountId;
	reserveRestrictions: ReturnTypes.ReserveRestrictions;
}

export interface ReserveFeesChanged {
	asset: ReturnTypes.AccountId;
	reserveFees: ReturnTypes.SetReserveFeesArgs;
}

export interface AssetRulesChanged {
	marketRuleId: BN;
	asset: ReturnTypes.AccountId;
	collateralCoefficientE6: BN | null;
	borrowCoefficientE6: BN | null;
	penaltyE6: BN | null;
}

export interface IncomeTaken {
	asset: ReturnTypes.AccountId;
}

export interface StablecoinDebtRateChanged {
	asset: ReturnTypes.AccountId;
	debtRateE18: BN;
}

export interface Paused {
	account: ReturnTypes.AccountId;
}

export interface Unpaused {
	account: ReturnTypes.AccountId;
}

export interface RoleAdminChanged {
	role: BN;
	previous: BN;
	new: BN;
}

export interface RoleGranted {
	role: BN;
	grantee: ReturnTypes.AccountId | null;
	grantor: ReturnTypes.AccountId | null;
}

export interface RoleRevoked {
	role: BN;
	account: ReturnTypes.AccountId | null;
	sender: ReturnTypes.AccountId;
}

export interface OwnershipTransferred {
	new: ReturnTypes.AccountId | null;
}

export interface Transfer {
	from: ReturnTypes.AccountId | null;
	to: ReturnTypes.AccountId | null;
	value: BN;
}

export interface Approval {
	owner: ReturnTypes.AccountId;
	spender: ReturnTypes.AccountId;
	value: BN;
}

