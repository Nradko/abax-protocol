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
import type * as ArgumentTypes from '../types-arguments/v_token';
import type * as ReturnTypes from '../types-returns/v_token';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import {decodeEvents} from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/v_token.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/v_token.json';
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
	* emitTransferEvents
	*
	* @param { Array<ArgumentTypes.TransferEventData> } transferEventData,
	* @returns { void }
	*/
	"emitTransferEvents" (
		transferEventData: Array<ArgumentTypes.TransferEventData>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "abacusToken::emitTransferEvents", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [transferEventData], __options);
	}

	/**
	* emitTransferEventAndDecreaseAllowance
	*
	* @param { ArgumentTypes.TransferEventData } transferEventData,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } decreaseAllowanceBy,
	* @returns { void }
	*/
	"emitTransferEventAndDecreaseAllowance" (
		transferEventData: ArgumentTypes.TransferEventData,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		decreaseAllowanceBy: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "abacusToken::emitTransferEventAndDecreaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [transferEventData, from, to, decreaseAllowanceBy], __options);
	}

	/**
	* getLendingPool
	*
	* @returns { Result<ReturnTypes.AccountId, ReturnTypes.LangError> }
	*/
	"getLendingPool" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountId, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "abacusToken::getLendingPool", [], __options, (result) => { return handleReturnType(result, getTypeDescription(48, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* totalSupply
	*
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"totalSupply" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22::totalSupply", [], __options, (result) => { return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* balanceOf
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"balanceOf" (
		owner: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22::balanceOf", [owner], __options, (result) => { return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* allowance
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @param { ArgumentTypes.AccountId } spender,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"allowance" (
		owner: ArgumentTypes.AccountId,
		spender: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22::allowance", [owner, spender], __options, (result) => { return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* transfer
	*
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } value,
	* @param { Array<(number | string | BN)> } data,
	* @returns { void }
	*/
	"transfer" (
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::transfer", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [to, value, data], __options);
	}

	/**
	* transferFrom
	*
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } value,
	* @param { Array<(number | string | BN)> } data,
	* @returns { void }
	*/
	"transferFrom" (
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::transferFrom", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [from, to, value, data], __options);
	}

	/**
	* approve
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } value,
	* @returns { void }
	*/
	"approve" (
		spender: ArgumentTypes.AccountId,
		value: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::approve", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, value], __options);
	}

	/**
	* increaseAllowance
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } deltaValue,
	* @returns { void }
	*/
	"increaseAllowance" (
		spender: ArgumentTypes.AccountId,
		deltaValue: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::increaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, deltaValue], __options);
	}

	/**
	* decreaseAllowance
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } deltaValue,
	* @returns { void }
	*/
	"decreaseAllowance" (
		spender: ArgumentTypes.AccountId,
		deltaValue: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::decreaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, deltaValue], __options);
	}

	/**
	* tokenName
	*
	* @returns { Result<string | null, ReturnTypes.LangError> }
	*/
	"tokenName" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<string | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22Metadata::tokenName", [], __options, (result) => { return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* tokenSymbol
	*
	* @returns { Result<string | null, ReturnTypes.LangError> }
	*/
	"tokenSymbol" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<string | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22Metadata::tokenSymbol", [], __options, (result) => { return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* tokenDecimals
	*
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"tokenDecimals" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "psp22Metadata::tokenDecimals", [], __options, (result) => { return handleReturnType(result, getTypeDescription(52, DATA_TYPE_DESCRIPTIONS)); });
	}

}