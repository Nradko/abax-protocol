import type BN from 'bn.js';

export type AccountId = string | number[]

export type Mapping = {
	
}

export type Lazy = {
	
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type Hash = string | number[]

export type InterestRateModelParams = {
	targetUrE6: (number | string | BN),
	minRateAtTargetE18: (number | string | BN),
	maxRateAtTargetE18: (number | string | BN),
	rateAtMaxUrE18: (number | string | BN),
	minimalTimeBetweenAdjustments: (number | string | BN)
}

export type ReserveRestrictions = {
	maximalTotalDeposit: (string | number | BN) | null,
	maximalTotalDebt: (string | number | BN) | null,
	minimalCollateral: (string | number | BN),
	minimalDebt: (string | number | BN)
}

export type SetReserveFeesArgs = {
	debtFeeE6: (number | string | BN),
	depositFeeE6: (number | string | BN)
}

