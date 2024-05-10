/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/fee_reduction_provider_mock';
import type * as ReturnTypes from '../types-returns/fee_reduction_provider_mock';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/fee_reduction_provider_mock.json';
import { bnToBn } from '@polkadot/util';


export default class FeeReductionProviderMockMethods {
	readonly __nativeContract : ContractPromise;
	readonly __apiPromise: ApiPromise;
	readonly __callerAddress : string;

	constructor(
		nativeContract : ContractPromise,
		nativeApi : ApiPromise,
		callerAddress : string,
	) {
		this.__nativeContract = nativeContract;
		this.__callerAddress = callerAddress;
		this.__apiPromise = nativeApi;
	}

	/**
	* setFeeReduction
	*
	* @param { ArgumentTypes.AccountId | null } accountId,
	* @param { [(number | string | BN), (number | string | BN)] } feeReductions,
	* @returns { Result<null, ReturnTypes.LangError> }
	*/
	"setFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReductions: [(number | string | BN), (number | string | BN)],
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "setFeeReduction", [accountId, feeReductions], __options , (result) => { return handleReturnType(result, getTypeDescription(15, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* setFlashLoanFeeReduction
	*
	* @param { ArgumentTypes.AccountId | null } accountId,
	* @param { (number | string | BN) } feeReduction,
	* @returns { Result<null, ReturnTypes.LangError> }
	*/
	"setFlashLoanFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReduction: (number | string | BN),
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "setFlashLoanFeeReduction", [accountId, feeReduction], __options , (result) => { return handleReturnType(result, getTypeDescription(15, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getFeeReductions
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<[BN, BN], ReturnTypes.LangError> }
	*/
	"getFeeReductions" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<[BN, BN], ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "feeReduction::getFeeReductions", [account], __options , (result) => { return handleReturnType(result, getTypeDescription(17, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getFlashLoanFeeReduction
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"getFlashLoanFeeReduction" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "feeReduction::getFlashLoanFeeReduction", [account], __options , (result) => { return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS)); });
	}

}