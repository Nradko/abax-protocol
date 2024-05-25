/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/fee_reduction_provider_mock';
import type BN from 'bn.js';
import type { ApiPromise } from '@polkadot/api';



export default class Methods {
	readonly __nativeContract : ContractPromise;
	readonly __apiPromise: ApiPromise;

	constructor(
		nativeContract : ContractPromise,
		apiPromise: ApiPromise,
	) {
		this.__nativeContract = nativeContract;
		this.__apiPromise = apiPromise;
	}
	/**
	 * setFeeReduction
	 *
	 * @param { ArgumentTypes.AccountId | null } accountId,
	 * @param { [(number | string | BN), (number | string | BN)] } feeReductions,
	*/
	"setFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReductions: [(number | string | BN), (number | string | BN)],
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setFeeReduction", [accountId, feeReductions], __options);
	}

	/**
	 * setFlashLoanFeeReduction
	 *
	 * @param { ArgumentTypes.AccountId | null } accountId,
	 * @param { (number | string | BN) } feeReduction,
	*/
	"setFlashLoanFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReduction: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setFlashLoanFeeReduction", [accountId, feeReduction], __options);
	}

	/**
	 * getFeeReductions
	 *
	 * @param { ArgumentTypes.AccountId } account,
	*/
	"getFeeReductions" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "feeReduction::getFeeReductions", [account], __options);
	}

	/**
	 * getFlashLoanFeeReduction
	 *
	 * @param { ArgumentTypes.AccountId } account,
	*/
	"getFlashLoanFeeReduction" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "feeReduction::getFlashLoanFeeReduction", [account], __options);
	}

}