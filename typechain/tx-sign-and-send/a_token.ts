/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/a_token';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import type { SignerOptions } from '@polkadot/api/submittable/types';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/a_token.json';


export default class ATokenMethods {
	readonly __nativeContract : ContractPromise;
	readonly __keyringPair : KeyringPair;
	readonly __apiPromise: ApiPromise;

	constructor(
		apiPromise: ApiPromise,
		nativeContract : ContractPromise,
		keyringPair : KeyringPair,
	) {
		this.__apiPromise = apiPromise;
		this.__nativeContract = nativeContract;
		this.__keyringPair = keyringPair;
	}

	/**
	* ownCodeHash
	*
	*/
	"ownCodeHash" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "ownCodeHash", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* emitTransferEvents
	*
	* @param { Array<ArgumentTypes.TransferEventData> } transferEventData,
	*/
	"emitTransferEvents" (
		transferEventData: Array<ArgumentTypes.TransferEventData>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "abacusToken::emitTransferEvents", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [transferEventData], contractOptions, signerOptions);
	}

	/**
	* emitTransferEventAndDecreaseAllowance
	*
	* @param { ArgumentTypes.TransferEventData } transferEventData,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } decreaseAllowanceBy,
	*/
	"emitTransferEventAndDecreaseAllowance" (
		transferEventData: ArgumentTypes.TransferEventData,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		decreaseAllowanceBy: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "abacusToken::emitTransferEventAndDecreaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [transferEventData, from, to, decreaseAllowanceBy], contractOptions, signerOptions);
	}

	/**
	* getLendingPool
	*
	*/
	"getLendingPool" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "abacusToken::getLendingPool", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* totalSupply
	*
	*/
	"totalSupply" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::totalSupply", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* balanceOf
	*
	* @param { ArgumentTypes.AccountId } owner,
	*/
	"balanceOf" (
		owner: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::balanceOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [owner], contractOptions, signerOptions);
	}

	/**
	* allowance
	*
	* @param { ArgumentTypes.AccountId } owner,
	* @param { ArgumentTypes.AccountId } spender,
	*/
	"allowance" (
		owner: ArgumentTypes.AccountId,
		spender: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::allowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [owner, spender], contractOptions, signerOptions);
	}

	/**
	* transfer
	*
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } value,
	* @param { Array<(number | string | BN)> } data,
	*/
	"transfer" (
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		data: Array<(number | string | BN)>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::transfer", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [to, value, data], contractOptions, signerOptions);
	}

	/**
	* transferFrom
	*
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } value,
	* @param { Array<(number | string | BN)> } data,
	*/
	"transferFrom" (
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		value: (string | number | BN),
		data: Array<(number | string | BN)>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::transferFrom", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [from, to, value, data], contractOptions, signerOptions);
	}

	/**
	* approve
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } value,
	*/
	"approve" (
		spender: ArgumentTypes.AccountId,
		value: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::approve", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, value], contractOptions, signerOptions);
	}

	/**
	* increaseAllowance
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } deltaValue,
	*/
	"increaseAllowance" (
		spender: ArgumentTypes.AccountId,
		deltaValue: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::increaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, deltaValue], contractOptions, signerOptions);
	}

	/**
	* decreaseAllowance
	*
	* @param { ArgumentTypes.AccountId } spender,
	* @param { (string | number | BN) } deltaValue,
	*/
	"decreaseAllowance" (
		spender: ArgumentTypes.AccountId,
		deltaValue: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22::decreaseAllowance", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [spender, deltaValue], contractOptions, signerOptions);
	}

	/**
	* tokenName
	*
	*/
	"tokenName" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22Metadata::tokenName", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* tokenSymbol
	*
	*/
	"tokenSymbol" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22Metadata::tokenSymbol", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* tokenDecimals
	*
	*/
	"tokenDecimals" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "psp22Metadata::tokenDecimals", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

}