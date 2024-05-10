/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import { txSignAndSend } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/lending_pool';
import type BN from 'bn.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import {decodeEvents} from "../shared/utils";
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/lending_pool.json';


export default class LendingPoolMethods {
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
	* setCode
	*
	* @param { Array<(number | string | BN)> } codeHash,
	*/
	"setCode" (
		codeHash: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setCode", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [codeHash], __options);
	}

	/**
	* chooseMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	*/
	"chooseMarketRule" (
		marketRuleId: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::chooseMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId], __options);
	}

	/**
	* setAsCollateral
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { boolean } useAsCollateral,
	*/
	"setAsCollateral" (
		asset: ArgumentTypes.AccountId,
		useAsCollateral: boolean,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::setAsCollateral", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, useAsCollateral], __options);
	}

	/**
	* deposit
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } onBehalfOf,
	* @param { (string | number | BN) } amount,
	* @param { Array<(number | string | BN)> } data,
	*/
	"deposit" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::deposit", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], __options);
	}

	/**
	* withdraw
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } onBehalfOf,
	* @param { (string | number | BN) } amount,
	* @param { Array<(number | string | BN)> } data,
	*/
	"withdraw" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::withdraw", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], __options);
	}

	/**
	* borrow
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } onBehalfOf,
	* @param { (string | number | BN) } amount,
	* @param { Array<(number | string | BN)> } data,
	*/
	"borrow" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::borrow", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], __options);
	}

	/**
	* repay
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } onBehalfOf,
	* @param { (string | number | BN) } amount,
	* @param { Array<(number | string | BN)> } data,
	*/
	"repay" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::repay", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], __options);
	}

	/**
	* multiOp
	*
	* @param { Array<ArgumentTypes.Action> } actions,
	* @param { ArgumentTypes.AccountId } onBehalfOf,
	* @param { Array<(number | string | BN)> } data,
	*/
	"multiOp" (
		actions: Array<ArgumentTypes.Action>,
		onBehalfOf: ArgumentTypes.AccountId,
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::multiOp", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [actions, onBehalfOf, data], __options);
	}

	/**
	* liquidate
	*
	* @param { ArgumentTypes.AccountId } liquidatedAccount,
	* @param { ArgumentTypes.AccountId } assetToRepay,
	* @param { ArgumentTypes.AccountId } assetToTake,
	* @param { (string | number | BN) } amountToRepay,
	* @param { (string | number | BN) } minimumRecievedForOneRepaidTokenE18,
	* @param { Array<(number | string | BN)> } data,
	*/
	"liquidate" (
		liquidatedAccount: ArgumentTypes.AccountId,
		assetToRepay: ArgumentTypes.AccountId,
		assetToTake: ArgumentTypes.AccountId,
		amountToRepay: (string | number | BN),
		minimumRecievedForOneRepaidTokenE18: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::liquidate", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [liquidatedAccount, assetToRepay, assetToTake, amountToRepay, minimumRecievedForOneRepaidTokenE18, data], __options);
	}

	/**
	* flashLoan
	*
	* @param { ArgumentTypes.AccountId } receiver,
	* @param { Array<ArgumentTypes.AccountId> } assets,
	* @param { Array<(string | number | BN)> } amounts,
	* @param { Array<(number | string | BN)> } receiverParams,
	*/
	"flashLoan" (
		receiver: ArgumentTypes.AccountId,
		assets: Array<ArgumentTypes.AccountId>,
		amounts: Array<(string | number | BN)>,
		receiverParams: Array<(number | string | BN)>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolFlash::flashLoan", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [receiver, assets, amounts, receiverParams], __options);
	}

	/**
	* accumulateInterest
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"accumulateInterest" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolMaintain::accumulateInterest", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* adjustRateAtTarget
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } guessedIndex,
	*/
	"adjustRateAtTarget" (
		asset: ArgumentTypes.AccountId,
		guessedIndex: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolMaintain::adjustRateAtTarget", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, guessedIndex], __options);
	}

	/**
	* setPriceFeedProvider
	*
	* @param { ArgumentTypes.AccountId } priceFeedProvider,
	*/
	"setPriceFeedProvider" (
		priceFeedProvider: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setPriceFeedProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [priceFeedProvider], __options);
	}

	/**
	* setFeeReductionProvider
	*
	* @param { ArgumentTypes.AccountId } feeReductionProvider,
	*/
	"setFeeReductionProvider" (
		feeReductionProvider: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setFeeReductionProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [feeReductionProvider], __options);
	}

	/**
	* setFlashLoanFeeE6
	*
	* @param { (string | number | BN) } flashLoanFeeE6,
	*/
	"setFlashLoanFeeE6" (
		flashLoanFeeE6: (string | number | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setFlashLoanFeeE6", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [flashLoanFeeE6], __options);
	}

	/**
	* registerAsset
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { Array<(number | string | BN)> } aTokenCodeHash,
	* @param { Array<(number | string | BN)> } vTokenCodeHash,
	* @param { string } name,
	* @param { string } symbol,
	* @param { (number | string | BN) } decimals,
	* @param { ArgumentTypes.AssetRules } assetRules,
	* @param { ArgumentTypes.ReserveRestrictions } reserveRestrictions,
	* @param { ArgumentTypes.SetReserveFeesArgs } reserveFees,
	* @param { ArgumentTypes.InterestRateModelParams | null } interestRateModel,
	*/
	"registerAsset" (
		asset: ArgumentTypes.AccountId,
		aTokenCodeHash: Array<(number | string | BN)>,
		vTokenCodeHash: Array<(number | string | BN)>,
		name: string,
		symbol: string,
		decimals: (number | string | BN),
		assetRules: ArgumentTypes.AssetRules,
		reserveRestrictions: ArgumentTypes.ReserveRestrictions,
		reserveFees: ArgumentTypes.SetReserveFeesArgs,
		interestRateModel: ArgumentTypes.InterestRateModelParams | null,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::registerAsset", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, aTokenCodeHash, vTokenCodeHash, name, symbol, decimals, assetRules, reserveRestrictions, reserveFees, interestRateModel], __options);
	}

	/**
	* setReserveIsActive
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { boolean } active,
	*/
	"setReserveIsActive" (
		asset: ArgumentTypes.AccountId,
		active: boolean,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveIsActive", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, active], __options);
	}

	/**
	* setReserveIsFrozen
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { boolean } freeze,
	*/
	"setReserveIsFrozen" (
		asset: ArgumentTypes.AccountId,
		freeze: boolean,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveIsFrozen", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, freeze], __options);
	}

	/**
	* setInterestRateModel
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.InterestRateModelParams } interestRateModel,
	*/
	"setInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		interestRateModel: ArgumentTypes.InterestRateModelParams,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setInterestRateModel", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, interestRateModel], __options);
	}

	/**
	* setReserveRestrictions
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.ReserveRestrictions } reserveRestrictions,
	*/
	"setReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		reserveRestrictions: ArgumentTypes.ReserveRestrictions,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveRestrictions", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, reserveRestrictions], __options);
	}

	/**
	* setReserveFees
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.SetReserveFeesArgs } reserveFees,
	*/
	"setReserveFees" (
		asset: ArgumentTypes.AccountId,
		reserveFees: ArgumentTypes.SetReserveFeesArgs,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveFees", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, reserveFees], __options);
	}

	/**
	* addMarketRule
	*
	* @param { Array<ArgumentTypes.AssetRules | null> } marketRule,
	*/
	"addMarketRule" (
		marketRule: Array<ArgumentTypes.AssetRules | null>,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::addMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRule], __options);
	}

	/**
	* modifyAssetRule
	*
	* @param { (number | string | BN) } marketRuleId,
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AssetRules } assetRules,
	*/
	"modifyAssetRule" (
		marketRuleId: (number | string | BN),
		asset: ArgumentTypes.AccountId,
		assetRules: ArgumentTypes.AssetRules,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::modifyAssetRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId, asset, assetRules], __options);
	}

	/**
	* takeProtocolIncome
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	* @param { ArgumentTypes.AccountId } to,
	*/
	"takeProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		to: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::takeProtocolIncome", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, to], __options);
	}

	/**
	* setStablecoinDebtRateE18
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } debtRateE18,
	*/
	"setStablecoinDebtRateE18" (
		asset: ArgumentTypes.AccountId,
		debtRateE18: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setStablecoinDebtRateE18", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, debtRateE18], __options);
	}

	/**
	* viewFlashLoanFeeE6
	*
	*/
	"viewFlashLoanFeeE6" (
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewFlashLoanFeeE6", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], __options);
	}

	/**
	* viewAssetId
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAssetId" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetId", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], __options);
	}

	/**
	* viewRegisteredAssets
	*
	*/
	"viewRegisteredAssets" (
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewRegisteredAssets", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], __options);
	}

	/**
	* viewReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveData" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewUnupdatedReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewUnupdatedReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewUnupdatedReserveIndexes", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewInterestRateModel
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewInterestRateModel", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewReserveRestrictions
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveRestrictions", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewReserveTokens
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveTokens" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveTokens", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewReserveDecimalMultiplier
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveDecimalMultiplier" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveDecimalMultiplier", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveIndexes", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewReserveFees
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveFees" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveFees", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewUnupdatedAccountReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewUnupdatedAccountReserveData" (
		asset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewUnupdatedAccountReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, account], __options);
	}

	/**
	* viewAccountReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountReserveData" (
		asset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAccountReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, account], __options);
	}

	/**
	* viewAccountConfig
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountConfig" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAccountConfig", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], __options);
	}

	/**
	* viewMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	*/
	"viewMarketRule" (
		marketRuleId: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId], __options);
	}

	/**
	* getAccountFreeCollateralCoefficient
	*
	* @param { ArgumentTypes.AccountId } accountAddress,
	*/
	"getAccountFreeCollateralCoefficient" (
		accountAddress: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::getAccountFreeCollateralCoefficient", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [accountAddress], __options);
	}

	/**
	* viewProtocolIncome
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewProtocolIncome", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], __options);
	}

	/**
	* viewAssetTwIndex
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewAssetTwIndex" (
		asset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetTwIndex", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], __options);
	}

	/**
	* viewAssetTwEntries
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } from,
	* @param { (number | string | BN) } to,
	*/
	"viewAssetTwEntries" (
		asset: ArgumentTypes.AccountId,
		from: (number | string | BN),
		to: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetTwEntries", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, from, to], __options);
	}

	/**
	* viewTwUrFromPeriodLongerThan
	*
	* @param { (number | string | BN) } period,
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } guessedIndex,
	*/
	"viewTwUrFromPeriodLongerThan" (
		period: (number | string | BN),
		asset: ArgumentTypes.AccountId,
		guessedIndex: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewTwUrFromPeriodLongerThan", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [period, asset, guessedIndex], __options);
	}

	/**
	* viewCounterToAccount
	*
	* @param { (string | number | BN) } counter,
	*/
	"viewCounterToAccount" (
		counter: (string | number | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewCounterToAccount", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [counter], __options);
	}

	/**
	* viewAccountToCounter
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountToCounter" (
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewAccountToCounter", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], __options);
	}

	/**
	* viewNextCounter
	*
	*/
	"viewNextCounter" (
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewNextCounter", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], __options);
	}

	/**
	* totalDepositOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::totalDepositOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset], __options);
	}

	/**
	* accountDepositOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"accountDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::accountDepositOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, account], __options);
	}

	/**
	* transferDepositFromTo
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } amount,
	*/
	"transferDepositFromTo" (
		underlyingAsset: ArgumentTypes.AccountId,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::transferDepositFromTo", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, from, to, amount], __options);
	}

	/**
	* totalDebtOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::totalDebtOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset], __options);
	}

	/**
	* accountDebtOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } account,
	*/
	"accountDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::accountDebtOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, account], __options);
	}

	/**
	* transferDebtFromTo
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } amount,
	*/
	"transferDebtFromTo" (
		underlyingAsset: ArgumentTypes.AccountId,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::transferDebtFromTo", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, from, to, amount], __options);
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
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::hasRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, address], __options);
	}

	/**
	* getRoleAdmin
	*
	* @param { (number | string | BN) } role,
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::getRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role], __options);
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
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::grantRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
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
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::revokeRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
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
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::renounceRole", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, account], __options);
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
		__options ? : ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::setRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, newAdmin], __options);
	}

}