import type BN from 'bn.js';

export type Mapping = {
	
}

export type AccountId = string | number[]

export type Lazy = {
	
}

export type AssetRules = {
	collateralCoefficientE6: (string | number | BN) | null,
	borrowCoefficientE6: (string | number | BN) | null,
	penaltyE6: (string | number | BN) | null
}

export type ReserveAbacusTokens = {
	aTokenAddress: AccountId,
	vTokenAddress: AccountId
}

export type ReserveRestrictions = {
	maximalTotalDeposit: (string | number | BN) | null,
	maximalTotalDebt: (string | number | BN) | null,
	minimalCollateral: (string | number | BN),
	minimalDebt: (string | number | BN)
}

export type ReserveIndexes = {
	depositIndexE18: (string | number | BN),
	debtIndexE18: (string | number | BN),
	updateTimestamp: (number | string | BN)
}

export type ReserveFees = {
	depositFeeE6: (number | string | BN),
	debtFeeE6: (number | string | BN),
	earnedFee: (string | number | BN)
}

export type ReserveData = {
	activated: boolean,
	frozen: boolean,
	totalDeposit: (string | number | BN),
	currentDepositRateE18: (number | string | BN),
	totalDebt: (string | number | BN),
	currentDebtRateE18: (number | string | BN)
}

export type AccountReserveData = {
	deposit: (string | number | BN),
	debt: (string | number | BN),
	appliedDepositIndexE18: (string | number | BN),
	appliedDebtIndexE18: (string | number | BN)
}

export type AccountConfig = {
	deposits: (string | number | BN),
	collaterals: (string | number | BN),
	borrows: (string | number | BN),
	marketRuleId: (number | string | BN)
}

export type AccessControlData = {
	adminRoles: Mapping,
	members: Mapping
}

export type LendingPoolStorage = {
	priceFeedProvider: Lazy,
	feeReductionProvider: Lazy,
	nextAssetId: Lazy,
	assetToId: Mapping,
	idToAsset: Mapping,
	nextRuleId: Lazy,
	marketRules: Mapping,
	reserveAbacusTokens: Mapping,
	reserveRestrictions: Mapping,
	reserveIndexesAndFees: Mapping,
	reserveDecimalMultiplier: Mapping,
	reserveDatas: Mapping,
	interestRateModel: Mapping,
	accountReserveDatas: Mapping,
	accountConfigs: Mapping,
	flashLoanFeeE6: Lazy
}

export type AccountRegistrar = {
	counterToAccount: Mapping,
	accountToCounter: Mapping,
	nextCounter: (string | number | BN)
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export interface LendingPoolError {
	psp22Error ? : PSP22Error,
	accessControlError ? : AccessControlError,
	mathError ? : MathError,
	assetRulesError ? : AssetRulesError,
	reserveDataError ? : ReserveDataError,
	reserveRestrictionsError ? : ReserveRestrictionsError,
	priceFeedError ? : PriceFeedError,
	flashLoanReceiverError ? : FlashLoanReceiverError,
	amountNotGreaterThanZero ? : null,
	alreadyRegistered ? : null,
	assetNotRegistered ? : null,
	assetIsProtocolStablecoin ? : null,
	assetIsNotProtocolStablecoin ? : null,
	ruleBorrowDisable ? : null,
	ruleCollateralDisable ? : null,
	insufficientCollateral ? : null,
	insufficientDebt ? : null,
	collaterized ? : null,
	insufficientDeposit ? : null,
	minimumRecieved ? : null,
	nothingToRepay ? : null,
	nothingToCompensateWith ? : null,
	takingNotACollateral ? : null,
	flashLoanAmountsAssetsInconsistentLengths ? : null,
	marketRuleInvalidId ? : null,
	depositFeeTooHigh ? : null
}

export class LendingPoolErrorBuilder {
	static PSP22Error(value: PSP22Error): LendingPoolError {
		return {
			psp22Error: value,
		};
	}
	static AccessControlError(value: AccessControlError): LendingPoolError {
		return {
			accessControlError: value,
		};
	}
	static MathError(value: MathError): LendingPoolError {
		return {
			mathError: value,
		};
	}
	static AssetRulesError(value: AssetRulesError): LendingPoolError {
		return {
			assetRulesError: value,
		};
	}
	static ReserveDataError(value: ReserveDataError): LendingPoolError {
		return {
			reserveDataError: value,
		};
	}
	static ReserveRestrictionsError(value: ReserveRestrictionsError): LendingPoolError {
		return {
			reserveRestrictionsError: value,
		};
	}
	static PriceFeedError(value: PriceFeedError): LendingPoolError {
		return {
			priceFeedError: value,
		};
	}
	static FlashLoanReceiverError(value: FlashLoanReceiverError): LendingPoolError {
		return {
			flashLoanReceiverError: value,
		};
	}
	static AmountNotGreaterThanZero(): LendingPoolError {
		return {
			amountNotGreaterThanZero: null,
		};
	}
	static AlreadyRegistered(): LendingPoolError {
		return {
			alreadyRegistered: null,
		};
	}
	static AssetNotRegistered(): LendingPoolError {
		return {
			assetNotRegistered: null,
		};
	}
	static AssetIsProtocolStablecoin(): LendingPoolError {
		return {
			assetIsProtocolStablecoin: null,
		};
	}
	static AssetIsNotProtocolStablecoin(): LendingPoolError {
		return {
			assetIsNotProtocolStablecoin: null,
		};
	}
	static RuleBorrowDisable(): LendingPoolError {
		return {
			ruleBorrowDisable: null,
		};
	}
	static RuleCollateralDisable(): LendingPoolError {
		return {
			ruleCollateralDisable: null,
		};
	}
	static InsufficientCollateral(): LendingPoolError {
		return {
			insufficientCollateral: null,
		};
	}
	static InsufficientDebt(): LendingPoolError {
		return {
			insufficientDebt: null,
		};
	}
	static Collaterized(): LendingPoolError {
		return {
			collaterized: null,
		};
	}
	static InsufficientDeposit(): LendingPoolError {
		return {
			insufficientDeposit: null,
		};
	}
	static MinimumRecieved(): LendingPoolError {
		return {
			minimumRecieved: null,
		};
	}
	static NothingToRepay(): LendingPoolError {
		return {
			nothingToRepay: null,
		};
	}
	static NothingToCompensateWith(): LendingPoolError {
		return {
			nothingToCompensateWith: null,
		};
	}
	static TakingNotACollateral(): LendingPoolError {
		return {
			takingNotACollateral: null,
		};
	}
	static FlashLoanAmountsAssetsInconsistentLengths(): LendingPoolError {
		return {
			flashLoanAmountsAssetsInconsistentLengths: null,
		};
	}
	static MarketRuleInvalidId(): LendingPoolError {
		return {
			marketRuleInvalidId: null,
		};
	}
	static DepositFeeTooHigh(): LendingPoolError {
		return {
			depositFeeTooHigh: null,
		};
	}
}

export interface PSP22Error {
	custom ? : string,
	insufficientBalance ? : null,
	insufficientAllowance ? : null,
	zeroRecipientAddress ? : null,
	zeroSenderAddress ? : null,
	safeTransferCheckFailed ? : string,
	permitInvalidSignature ? : null,
	permitExpired ? : null
}

export class PSP22ErrorBuilder {
	static Custom(value: string): PSP22Error {
		return {
			custom: value,
		};
	}
	static InsufficientBalance(): PSP22Error {
		return {
			insufficientBalance: null,
		};
	}
	static InsufficientAllowance(): PSP22Error {
		return {
			insufficientAllowance: null,
		};
	}
	static ZeroRecipientAddress(): PSP22Error {
		return {
			zeroRecipientAddress: null,
		};
	}
	static ZeroSenderAddress(): PSP22Error {
		return {
			zeroSenderAddress: null,
		};
	}
	static SafeTransferCheckFailed(value: string): PSP22Error {
		return {
			safeTransferCheckFailed: value,
		};
	}
	static PermitInvalidSignature(): PSP22Error {
		return {
			permitInvalidSignature: null,
		};
	}
	static PermitExpired(): PSP22Error {
		return {
			permitExpired: null,
		};
	}
}

export enum AccessControlError {
	invalidCaller = 'InvalidCaller',
	missingRole = 'MissingRole',
	roleRedundant = 'RoleRedundant'
}

export enum MathError {
	underflow = 'Underflow',
	overflow = 'Overflow',
	divByZero = 'DivByZero'
}

export enum AssetRulesError {
	invalidAssetRule = 'InvalidAssetRule'
}

export enum ReserveDataError {
	alreadySet = 'AlreadySet',
	inactive = 'Inactive',
	frozen = 'Frozen'
}

export enum ReserveRestrictionsError {
	maxDebtReached = 'MaxDebtReached',
	maxDepositReached = 'MaxDepositReached',
	minimalDebt = 'MinimalDebt',
	minimalCollateral = 'MinimalCollateral'
}

export enum PriceFeedError {
	noSuchAsset = 'NoSuchAsset',
	noPriceFeed = 'NoPriceFeed'
}

export interface FlashLoanReceiverError {
	mathErorr ? : MathError,
	custom ? : string
}

export class FlashLoanReceiverErrorBuilder {
	static MathErorr(value: MathError): FlashLoanReceiverError {
		return {
			mathErorr: value,
		};
	}
	static Custom(value: string): FlashLoanReceiverError {
		return {
			custom: value,
		};
	}
}

export type Action = {
	op: Operation,
	args: OperationArgs
}

export enum Operation {
	deposit = 'Deposit',
	withdraw = 'Withdraw',
	borrow = 'Borrow',
	repay = 'Repay'
}

export type OperationArgs = {
	asset: AccountId,
	amount: (string | number | BN)
}

export type SetReserveFeesArgs = {
	debtFeeE6: (number | string | BN),
	depositFeeE6: (number | string | BN)
}

