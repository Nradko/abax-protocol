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

export interface TestReservesMinterError {
	ownableError ? : OwnableError,
	psp22Error ? : PSP22Error,
	alreadyMinted ? : null
}

export class TestReservesMinterErrorBuilder {
	static OwnableError(value: OwnableError): TestReservesMinterError {
		return {
			ownableError: value,
		};
	}
	static PSP22Error(value: PSP22Error): TestReservesMinterError {
		return {
			psp22Error: value,
		};
	}
	static AlreadyMinted(): TestReservesMinterError {
		return {
			alreadyMinted: null,
		};
	}
}

export enum OwnableError {
	callerIsNotOwner = 'CallerIsNotOwner'
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

