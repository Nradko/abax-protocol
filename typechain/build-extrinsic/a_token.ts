/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/a_token';
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
	 * ownCodeHash
	 *
	*/
	"ownCodeHash" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "ownCodeHash", [], __options);
	}

	/**
	 * emitTransferEvents
	 *
	 * @param { Array<ArgumentTypes.TransferEventData> } transferEventData,
	*/
	"emitTransferEvents" (
		transferEventData: Array<ArgumentTypes.TransferEventData>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "abacusToken::emitTransferEvents", [transferEventData], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "abacusToken::emitTransferEventAndDecreaseAllowance", [transferEventData, from, to, decreaseAllowanceBy], __options);
	}

	/**
	 * getLendingPool
	 *
	*/
	"getLendingPool" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "abacusToken::getLendingPool", [], __options);
	}

	/**
	 * totalSupply
	 *
	*/
	"totalSupply" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::totalSupply", [], __options);
	}

	/**
	 * balanceOf
	 *
	 * @param { ArgumentTypes.AccountId } owner,
	*/
	"balanceOf" (
		owner: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::balanceOf", [owner], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::allowance", [owner, spender], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::transfer", [to, value, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::transferFrom", [from, to, value, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::approve", [spender, value], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::increaseAllowance", [spender, deltaValue], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22::decreaseAllowance", [spender, deltaValue], __options);
	}

	/**
	 * tokenName
	 *
	*/
	"tokenName" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22Metadata::tokenName", [], __options);
	}

	/**
	 * tokenSymbol
	 *
	*/
	"tokenSymbol" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22Metadata::tokenSymbol", [], __options);
	}

	/**
	 * tokenDecimals
	 *
	*/
	"tokenDecimals" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "psp22Metadata::tokenDecimals", [], __options);
	}

}