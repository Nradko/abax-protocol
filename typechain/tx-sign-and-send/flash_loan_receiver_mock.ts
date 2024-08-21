/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/flash_loan_receiver_mock';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import type { SignerOptions } from '@polkadot/api/submittable/types';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/flash_loan_receiver_mock.json';


export default class FlashLoanReceiverMockMethods {
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
	* setFailExecuteOperation
	*
	* @param { boolean } shouldFailExecuteOperation,
	*/
	"setFailExecuteOperation" (
		shouldFailExecuteOperation: boolean,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setFailExecuteOperation", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [shouldFailExecuteOperation], contractOptions, signerOptions);
	}

	/**
	* setCustomAmountToApprove
	*
	* @param { (string | number | BN) } customAmountToApprove,
	*/
	"setCustomAmountToApprove" (
		customAmountToApprove: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setCustomAmountToApprove", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [customAmountToApprove], contractOptions, signerOptions);
	}

	/**
	* setSimulateBalanceToCoverFee
	*
	* @param { boolean } simulateBalanceToCoverFee,
	*/
	"setSimulateBalanceToCoverFee" (
		simulateBalanceToCoverFee: boolean,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setSimulateBalanceToCoverFee", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [simulateBalanceToCoverFee], contractOptions, signerOptions);
	}

	/**
	* executeOperation
	*
	* @param { Array<ArgumentTypes.AccountId> } assets,
	* @param { Array<(string | number | BN)> } amounts,
	* @param { Array<(string | number | BN)> } fees,
	* @param { Array<(number | string | BN)> } receiverParams,
	*/
	"executeOperation" (
		assets: Array<ArgumentTypes.AccountId>,
		amounts: Array<(string | number | BN)>,
		fees: Array<(string | number | BN)>,
		receiverParams: Array<(number | string | BN)>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "flashLoanReceiver::executeOperation", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, amounts, fees, receiverParams], contractOptions, signerOptions);
	}

}