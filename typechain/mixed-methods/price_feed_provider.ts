/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryOkJSON, queryJSON, handleReturnType } from '@c-forge/typechain-types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/price_feed_provider';
import type * as ReturnTypes from '../types-returns/price_feed_provider';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/price_feed_provider.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/price_feed_provider.json';
import { bnToBn } from '@polkadot/util';


export default class Methods {
	readonly __nativeContract : ContractPromise;
	readonly __keyringPair : KeyringPair;
	readonly __callerAddress : string;
	readonly __apiPromise: ApiPromise;

	constructor(
		apiPromise : ApiPromise,
		nativeContract : ContractPromise,
		keyringPair : KeyringPair,
	) {
		this.__apiPromise = apiPromise;
		this.__nativeContract = nativeContract;
		this.__keyringPair = keyringPair;
		this.__callerAddress = keyringPair.address;
	}

	/**
	* setAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { string } symbol,
	* @returns { void }
	*/
	"setAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		symbol: string,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setAccountSymbol", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, symbol], __options);
	}

	/**
	* getAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { void }
	*/
	"getAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "getAccountSymbol", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* getLatestPrices
	*
	* @param { Array<ArgumentTypes.AccountId> } assets,
	* @returns { Result<Result<Array<BN>, ReturnTypes.PriceFeedError>, ReturnTypes.LangError> }
	*/
	"getLatestPrices" (
		assets: Array<ArgumentTypes.AccountId>,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Result<Array<BN>, ReturnTypes.PriceFeedError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "priceFeed::getLatestPrices", [assets], __options, (result) => { return handleReturnType(result, getTypeDescription(33, DATA_TYPE_DESCRIPTIONS)); });
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
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<boolean, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::hasRole", [role, address], __options, (result) => { return handleReturnType(result, getTypeDescription(38, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getRoleAdmin
	*
	* @param { (number | string | BN) } role,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::getRoleAdmin", [role], __options, (result) => { return handleReturnType(result, getTypeDescription(40, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* grantRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { void }
	*/
	"grantRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::grantRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
	}

	/**
	* revokeRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { void }
	*/
	"revokeRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::revokeRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
	}

	/**
	* renounceRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { void }
	*/
	"renounceRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::renounceRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
	}

	/**
	* setRoleAdmin
	*
	* @param { (number | string | BN) } role,
	* @param { (number | string | BN) } newAdmin,
	* @returns { void }
	*/
	"setRoleAdmin" (
		role: (number | string | BN),
		newAdmin: (number | string | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::setRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, newAdmin], __options);
	}

}