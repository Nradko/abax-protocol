/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/balance_viewer';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import type { SignerOptions } from '@polkadot/api/submittable/types';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/balance_viewer.json';


export default class BalanceViewerMethods {
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
	* viewAccountBalances
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountBalances" (
		assets: Array<ArgumentTypes.AccountId> | null,
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewAccountBalances", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, account], contractOptions, signerOptions);
	}

	/**
	* viewUnupdatedReserveDatas
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewUnupdatedReserveDatas" (
		assets: Array<ArgumentTypes.AccountId> | null,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewUnupdatedReserveDatas", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], contractOptions, signerOptions);
	}

	/**
	* viewReserveDatas
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewReserveDatas" (
		assets: Array<ArgumentTypes.AccountId> | null,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewReserveDatas", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], contractOptions, signerOptions);
	}

	/**
	* viewUnupdatedAccountReserveDatas
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewUnupdatedAccountReserveDatas" (
		assets: Array<ArgumentTypes.AccountId> | null,
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewUnupdatedAccountReserveDatas", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, account], contractOptions, signerOptions);
	}

	/**
	* viewAccountReserveDatas
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountReserveDatas" (
		assets: Array<ArgumentTypes.AccountId> | null,
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewAccountReserveDatas", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, account], contractOptions, signerOptions);
	}

	/**
	* viewCompleteReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewCompleteReserveData" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewCompleteReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewCompleteReserveDatas
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewCompleteReserveDatas" (
		assets: Array<ArgumentTypes.AccountId> | null,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "viewCompleteReserveDatas", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], contractOptions, signerOptions);
	}

}