/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/fee_reduction_provider_mock';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import {decodeEvents} from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/fee_reduction_provider_mock.json';


export default class FeeReductionProviderMockMethods {
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
	* setFeeReduction
	*
	* @param { ArgumentTypes.AccountId | null } accountId,
	* @param { [(number | string | BN), (number | string | BN)] } feeReductions,
	*/
	"setFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReductions: [(number | string | BN), (number | string | BN)],
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setFeeReduction", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [accountId, feeReductions], __options);
	}

	/**
	* setFlashLoanFeeReduction
	*
	* @param { ArgumentTypes.AccountId | null } accountId,
	* @param { (number | string | BN) } feeReduction,
	*/
	"setFlashLoanFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReduction: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setFlashLoanFeeReduction", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [accountId, feeReduction], __options);
	}

	/**
	* getFeeReductions
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"getFeeReductions" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "feeReduction::getFeeReductions", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], __options);
	}

	/**
	* getFlashLoanFeeReduction
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"getFlashLoanFeeReduction" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "feeReduction::getFlashLoanFeeReduction", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], __options);
	}

}