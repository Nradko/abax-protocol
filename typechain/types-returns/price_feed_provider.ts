import type BN from 'bn.js';

export type AccountId = string | number[]

export type Lazy = {
	
}

export type Mapping = {
	
}

export type OwnableData = {
	owner: Lazy
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export enum OwnableError {
	callerIsNotOwner = 'CallerIsNotOwner',
	actionRedundant = 'ActionRedundant'
}

export enum PriceFeedError {
	noSuchAsset = 'NoSuchAsset',
	noPriceFeed = 'NoPriceFeed'
}

export type InterestRateModelParams = {
	targetUrE6: BN,
	minRateAtTargetE18: BN,
	maxRateAtTargetE18: BN,
	rateAtMaxUrE18: BN,
	minimalTimeBetweenAdjustments: BN
}

export type ReserveRestrictions = {
	maximalTotalDeposit: BN | null,
	maximalTotalDebt: BN | null,
	minimalCollateral: BN,
	minimalDebt: BN
}

export type SetReserveFeesArgs = {
	debtFeeE6: BN,
	depositFeeE6: BN
}

