/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/price_feed_provider';
import type * as ReturnTypes from '../types-returns/price_feed_provider';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/price_feed_provider.json';
import { bnToBn } from '@polkadot/util';


export default class PriceFeedProviderMethods {
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
	* setAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { string } symbol,
	* @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
	*/
	"setAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		symbol: string,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "setAccountSymbol", [asset, symbol], __options , (result) => { return handleReturnType(result, getTypeDescription(27, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<string | null, ReturnTypes.LangError> }
	*/
	"getAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<string | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "getAccountSymbol", [asset], __options , (result) => { return handleReturnType(result, getTypeDescription(30, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getLatestPrices
	*
	* @param { Array<ArgumentTypes.AccountId> } assets,
	* @returns { Result<Result<Array<BN>, ReturnTypes.PriceFeedError>, ReturnTypes.LangError> }
	*/
	"getLatestPrices" (
		assets: Array<ArgumentTypes.AccountId>,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<Array<BN>, ReturnTypes.PriceFeedError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "priceFeed::getLatestPrices", [assets], __options , (result) => { return handleReturnType(result, getTypeDescription(33, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* hasRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } address,
	* @returns { Result<boolean, ReturnTypes.LangError> }
	*/
	"hasRole" (
		role: (number | string | BN),
		address: ArgumentTypes.AccountId | null,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<boolean, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::hasRole", [role, address], __options , (result) => { return handleReturnType(result, getTypeDescription(38, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getRoleAdmin
	*
	* @param { (number | string | BN) } role,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::getRoleAdmin", [role], __options , (result) => { return handleReturnType(result, getTypeDescription(40, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* grantRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
	*/
	"grantRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::grantRole", [role, account], __options , (result) => { return handleReturnType(result, getTypeDescription(27, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* revokeRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
	*/
	"revokeRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::revokeRole", [role, account], __options , (result) => { return handleReturnType(result, getTypeDescription(27, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* renounceRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
	*/
	"renounceRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::renounceRole", [role, account], __options , (result) => { return handleReturnType(result, getTypeDescription(27, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* setRoleAdmin
	*
	* @param { (number | string | BN) } role,
	* @param { (number | string | BN) } newAdmin,
	* @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
	*/
	"setRoleAdmin" (
		role: (number | string | BN),
		newAdmin: (number | string | BN),
		__options ? : ContractOptions,
	): Promise< QueryReturnType< Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::setRoleAdmin", [role, newAdmin], __options , (result) => { return handleReturnType(result, getTypeDescription(27, DATA_TYPE_DESCRIPTIONS)); });
	}

}