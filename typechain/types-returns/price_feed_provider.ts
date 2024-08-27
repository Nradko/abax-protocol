import type BN from 'bn.js';

export type Mapping = {
	
}

export type AccountId = string | number[]

export type Lazy = {
	
}

export type AccessControlData = {
	adminRoles: Mapping,
	members: Mapping
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export enum AccessControlError {
	invalidCaller = 'InvalidCaller',
	missingRole = 'MissingRole',
	roleRedundant = 'RoleRedundant'
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

