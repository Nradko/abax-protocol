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
	maximalTotalDeposit: BN | null,
	maximalTotalDebt: BN | null,
	minimalCollateral: BN,
	minimalDebt: BN
}

export type SetReserveFeesArgs = {
	debtFeeE6: BN,
	depositFeeE6: BN
}

