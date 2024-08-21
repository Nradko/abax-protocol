/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/price_feed_provider';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import type { SignerOptions } from '@polkadot/api/submittable/types';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/price_feed_provider.json';


export default class PriceFeedProviderMethods {
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
	* setAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { string } symbol,
	*/
	"setAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		symbol: string,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setAccountSymbol", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, symbol], contractOptions, signerOptions);
	}

	/**
	* getAccountSymbol
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"getAccountSymbol" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "getAccountSymbol", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* getLatestPrices
	*
	* @param { Array<ArgumentTypes.AccountId> } assets,
	*/
	"getLatestPrices" (
		assets: Array<ArgumentTypes.AccountId>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "priceFeed::getLatestPrices", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], contractOptions, signerOptions);
	}

	/**
	* owner
	*
	*/
	"owner" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "ownable::owner", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* renounceOwnership
	*
	*/
	"renounceOwnership" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "ownable::renounceOwnership", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* transferOwnership
	*
	* @param { ArgumentTypes.AccountId } newOwner,
	*/
	"transferOwnership" (
		newOwner: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "ownable::transferOwnership", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [newOwner], contractOptions, signerOptions);
	}

}