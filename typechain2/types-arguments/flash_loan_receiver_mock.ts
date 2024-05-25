import type BN from 'bn.js';

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type AccountId = string | number[]

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

export enum MathError {
	underflow = 'Underflow',
	overflow = 'Overflow',
	divByZero = 'DivByZero'
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

