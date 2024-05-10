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
import type * as ArgumentTypes from '../types-arguments/dia_oracle';
import type * as ReturnTypes from '../types-returns/dia_oracle';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import {decodeEvents} from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/dia_oracle.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/dia_oracle.json';
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
	* codeHash
	*
	* @returns { Result<ReturnTypes.Hash, ReturnTypes.LangError> }
	*/
	"codeHash" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.Hash, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "codeHash", [], __options, (result) => { return handleReturnType(result, getTypeDescription(20, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* setCode
	*
	* @param { Array<(number | string | BN)> } codeHash,
	* @returns { void }
	*/
	"setCode" (
		codeHash: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setCode", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [codeHash], __options);
	}

	/**
	* transferOwnership
	*
	* @param { ArgumentTypes.AccountId } newOwner,
	* @returns { void }
	*/
	"transferOwnership" (
		newOwner: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "oracleSetters::transferOwnership", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [newOwner], __options);
	}

	/**
	* setUpdater
	*
	* @param { ArgumentTypes.AccountId } updater,
	* @returns { void }
	*/
	"setUpdater" (
		updater: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "oracleSetters::setUpdater", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [updater], __options);
	}

	/**
	* setPrice
	*
	* @param { string } pair,
	* @param { (string | number | BN) } price,
	* @returns { void }
	*/
	"setPrice" (
		pair: string,
		price: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "oracleSetters::setPrice", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [pair, price], __options);
	}

	/**
	* setPrices
	*
	* @param { Array<[string, (string | number | BN)]> } pairs,
	* @returns { void }
	*/
	"setPrices" (
		pairs: Array<[string, (string | number | BN)]>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "oracleSetters::setPrices", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [pairs], __options);
	}

	/**
	* getUpdater
	*
	* @returns { Result<ReturnTypes.AccountId, ReturnTypes.LangError> }
	*/
	"getUpdater" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountId, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "oracleGetters::getUpdater", [], __options, (result) => { return handleReturnType(result, getTypeDescription(24, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getLatestPrice
	*
	* @param { string } pair,
	* @returns { Result<[BN, BN] | null, ReturnTypes.LangError> }
	*/
	"getLatestPrice" (
		pair: string,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<[BN, BN] | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "oracleGetters::getLatestPrice", [pair], __options, (result) => { return handleReturnType(result, getTypeDescription(25, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getLatestPrices
	*
	* @param { Array<string> } pairs,
	* @returns { Result<Array<[BN, BN] | null>, ReturnTypes.LangError> }
	*/
	"getLatestPrices" (
		pairs: Array<string>,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Array<[BN, BN] | null>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "oracleGetters::getLatestPrices", [pairs], __options, (result) => { return handleReturnType(result, getTypeDescription(28, DATA_TYPE_DESCRIPTIONS)); });
	}

}