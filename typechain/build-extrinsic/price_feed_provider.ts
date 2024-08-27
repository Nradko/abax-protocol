/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/price_feed_provider';
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
	 * setAccountSymbol
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	 * @param { string } symbol,
	*/
	"setAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		symbol: string,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setAccountSymbol", [asset, symbol], __options);
	}

	/**
	 * getAccountSymbol
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"getAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "getAccountSymbol", [asset], __options);
	}

	/**
	 * getLatestPrices
	 *
	 * @param { Array<ArgumentTypes.AccountId> } assets,
	*/
	"getLatestPrices" (
		assets: Array<ArgumentTypes.AccountId>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "priceFeed::getLatestPrices", [assets], __options);
	}

	/**
	 * hasRole
	 *
	 * @param { (number | string | BN) } role,
	 * @param { ArgumentTypes.AccountId | null } address,
	*/
	"hasRole" (
		role: (number | string | BN),
		address: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::hasRole", [role, address], __options);
	}

	/**
	 * getRoleAdmin
	 *
	 * @param { (number | string | BN) } role,
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::getRoleAdmin", [role], __options);
	}

	/**
	 * grantRole
	 *
	 * @param { (number | string | BN) } role,
	 * @param { ArgumentTypes.AccountId | null } account,
	*/
	"grantRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::grantRole", [role, account], __options);
	}

	/**
	 * revokeRole
	 *
	 * @param { (number | string | BN) } role,
	 * @param { ArgumentTypes.AccountId | null } account,
	*/
	"revokeRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::revokeRole", [role, account], __options);
	}

	/**
	 * renounceRole
	 *
	 * @param { (number | string | BN) } role,
	 * @param { ArgumentTypes.AccountId | null } account,
	*/
	"renounceRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::renounceRole", [role, account], __options);
	}

	/**
	 * setRoleAdmin
	 *
	 * @param { (number | string | BN) } role,
	 * @param { (number | string | BN) } newAdmin,
	*/
	"setRoleAdmin" (
		role: (number | string | BN),
		newAdmin: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::setRoleAdmin", [role, newAdmin], __options);
	}

}