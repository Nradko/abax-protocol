import type BN from 'bn.js';

export type Lazy = {
	
}

export type Mapping = {
	
}

export type AccountId = string | number[]

export type PSP22Data = {
	totalSupply: Lazy,
	balances: Mapping,
	allowances: Mapping
}

export type AbacusTokenStorage = {
	lendingPool: AccountId,
	underlyingAsset: AccountId,
	allowances: Mapping
}

export type PSP22MetadataData = {
	name: Lazy,
	symbol: Lazy,
	decimals: Lazy
}

export enum LangError {
	couldNotReadInput = 'CouldNotReadInput'
}

export type Hash = string | number[]

export type TransferEventData = {
	from: AccountId | null,
	to: AccountId | null,
	amount: BN
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

