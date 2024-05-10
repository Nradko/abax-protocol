/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/dia_oracle';
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
	 * codeHash
	 *
	*/
	"codeHash" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "codeHash", [], __options);
	}

	/**
	 * setCode
	 *
	 * @param { Array<(number | string | BN)> } codeHash,
	*/
	"setCode" (
		codeHash: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setCode", [codeHash], __options);
	}

	/**
	 * transferOwnership
	 *
	 * @param { ArgumentTypes.AccountId } newOwner,
	*/
	"transferOwnership" (
		newOwner: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleSetters::transferOwnership", [newOwner], __options);
	}

	/**
	 * setUpdater
	 *
	 * @param { ArgumentTypes.AccountId } updater,
	*/
	"setUpdater" (
		updater: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleSetters::setUpdater", [updater], __options);
	}

	/**
	 * setPrice
	 *
	 * @param { string } pair,
	 * @param { (string | number | BN) } price,
	*/
	"setPrice" (
		pair: string,
		price: (string | number | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleSetters::setPrice", [pair, price], __options);
	}

	/**
	 * setPrices
	 *
	 * @param { Array<[string, (string | number | BN)]> } pairs,
	*/
	"setPrices" (
		pairs: Array<[string, (string | number | BN)]>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleSetters::setPrices", [pairs], __options);
	}

	/**
	 * getUpdater
	 *
	*/
	"getUpdater" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleGetters::getUpdater", [], __options);
	}

	/**
	 * getLatestPrice
	 *
	 * @param { string } pair,
	*/
	"getLatestPrice" (
		pair: string,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleGetters::getLatestPrice", [pair], __options);
	}

	/**
	 * getLatestPrices
	 *
	 * @param { Array<string> } pairs,
	*/
	"getLatestPrices" (
		pairs: Array<string>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "oracleGetters::getLatestPrices", [pairs], __options);
	}

}