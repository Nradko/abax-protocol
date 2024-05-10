/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/flash_loan_receiver_mock';
import type BN from 'bn.js';
import type { ApiPromise } from '@polkadot/api';



export default class Methods {
	readonly __nativeContract : ContractPromise;
	readonly __apiPromise: ApiPromise;

	constructor(
		nativeContract : ContractPromise,
		apiPromise: ApiPromise,
	) {
		this.__nativeContract = nativeContract;
		this.__apiPromise = apiPromise;
	}
	/**
	 * setFailExecuteOperation
	 *
	 * @param { boolean } shouldFailExecuteOperation,
	*/
	"setFailExecuteOperation" (
		shouldFailExecuteOperation: boolean,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setFailExecuteOperation", [shouldFailExecuteOperation], __options);
	}

	/**
	 * setCustomAmountToApprove
	 *
	 * @param { (string | number | BN) } customAmountToApprove,
	*/
	"setCustomAmountToApprove" (
		customAmountToApprove: (string | number | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setCustomAmountToApprove", [customAmountToApprove], __options);
	}

	/**
	 * setSimulateBalanceToCoverFee
	 *
	 * @param { boolean } simulateBalanceToCoverFee,
	*/
	"setSimulateBalanceToCoverFee" (
		simulateBalanceToCoverFee: boolean,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setSimulateBalanceToCoverFee", [simulateBalanceToCoverFee], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "flashLoanReceiver::executeOperation", [assets, amounts, fees, receiverParams], __options);
	}

}