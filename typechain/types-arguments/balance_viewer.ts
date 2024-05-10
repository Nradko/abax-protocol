import type BN from 'bn.js';

export type AccountId = string | number[]

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
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

export type CompleteReserveData = {
	data: ReserveData | null,
	indexes: ReserveIndexes | null,
	interestRateModel: InterestRateModel | null,
	fees: ReserveFees | null,
	restriction: ReserveRestrictions | null,
	decimalMultiplier: (string | number | BN) | null,
	tokens: ReserveAbacusTokens | null
}

export type ReserveIndexes = {
	depositIndexE18: (string | number | BN),
	debtIndexE18: (string | number | BN),
	updateTimestamp: (number | string | BN)
}

export type InterestRateModel = {
	targetUrE6: (number | string | BN),
	minRateAtTargetE18: (number | string | BN),
	maxRateAtTargetE18: (number | string | BN),
	rateAtTargetUrE18: (number | string | BN),
	rateAtMaxUrE18: (number | string | BN),
	minimalTimeBetweenAdjustments: (number | string | BN),
	lastAdjustmentTimestamp: (number | string | BN)
}

export type ReserveFees = {
	depositFeeE6: (number | string | BN),
	debtFeeE6: (number | string | BN),
	earnedFee: (string | number | BN)
}

export type ReserveRestrictions = {
	maximalTotalDeposit: (string | number | BN) | null,
	maximalTotalDebt: (string | number | BN) | null,
	minimalCollateral: (string | number | BN),
	minimalDebt: (string | number | BN)
}

export type ReserveAbacusTokens = {
	aTokenAddress: AccountId,
	vTokenAddress: AccountId
}

export type InterestRateModelParams = {
	targetUrE6: (number | string | BN),
	minRateAtTargetE18: (number | string | BN),
	maxRateAtTargetE18: (number | string | BN),
	rateAtMaxUrE18: (number | string | BN),
	minimalTimeBetweenAdjustments: (number | string | BN)
}

export type SetReserveFeesArgs = {
	debtFeeE6: (number | string | BN),
	depositFeeE6: (number | string | BN)
}

