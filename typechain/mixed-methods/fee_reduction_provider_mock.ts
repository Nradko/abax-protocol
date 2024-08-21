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
import type * as ArgumentTypes from '../types-arguments/fee_reduction_provider_mock';
import type * as ReturnTypes from '../types-returns/fee_reduction_provider_mock';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/fee_reduction_provider_mock.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/fee_reduction_provider_mock.json';
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
	* setFeeReduction
	*
	* @param { ArgumentTypes.AccountId | null } accountId,
	* @param { [(number | string | BN), (number | string | BN)] } feeReductions,
	* @returns { void }
	*/
	"setFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReductions: [(number | string | BN), (number | string | BN)],
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setFlashLoanFeeReduction" (
		accountId: ArgumentTypes.AccountId | null,
		feeReduction: (number | string | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setFlashLoanFeeReduction", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [accountId, feeReduction], __options);
	}

	/**
	* getFeeReductions
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<[BN, BN], ReturnTypes.LangError> }
	*/
	"getFeeReductions" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<[BN, BN], ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "feeReduction::getFeeReductions", [account], __options, (result) => { return handleReturnType(result, getTypeDescription(17, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getFlashLoanFeeReduction
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"getFlashLoanFeeReduction" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "feeReduction::getFlashLoanFeeReduction", [account], __options, (result) => { return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS)); });
	}

}