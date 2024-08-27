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
	* hasRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } address,
	*/
	"hasRole" (
		role: (number | string | BN),
		address: ArgumentTypes.AccountId | null,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::hasRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, address], contractOptions, signerOptions);
	}

	/**
	* getRoleAdmin
	*
	* @param { (number | string | BN) } role,
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::getRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::grantRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::revokeRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::renounceRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::setRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, newAdmin], contractOptions, signerOptions);
	}

}