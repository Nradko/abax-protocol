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
import type { SignerOptions } from '@polkadot/api/submittable/types';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
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
	* chooseMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	*/
	"chooseMarketRule" (
		marketRuleId: (number | string | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::chooseMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::setAsCollateral", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, useAsCollateral], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::deposit", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::withdraw", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::borrow", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::repay", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, onBehalfOf, amount, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::multiOp", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [actions, onBehalfOf, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolActions::liquidate", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [liquidatedAccount, assetToRepay, assetToTake, amountToRepay, minimumRecievedForOneRepaidTokenE18, data], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolFlash::flashLoan", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [receiver, assets, amounts, receiverParams], contractOptions, signerOptions);
	}

	/**
	* accumulateInterest
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"accumulateInterest" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolMaintain::accumulateInterest", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolMaintain::adjustRateAtTarget", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, guessedIndex], contractOptions, signerOptions);
	}

	/**
	* setPriceFeedProvider
	*
	* @param { ArgumentTypes.AccountId } priceFeedProvider,
	*/
	"setPriceFeedProvider" (
		priceFeedProvider: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setPriceFeedProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [priceFeedProvider], contractOptions, signerOptions);
	}

	/**
	* setFeeReductionProvider
	*
	* @param { ArgumentTypes.AccountId } feeReductionProvider,
	*/
	"setFeeReductionProvider" (
		feeReductionProvider: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setFeeReductionProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [feeReductionProvider], contractOptions, signerOptions);
	}

	/**
	* setFlashLoanFeeE6
	*
	* @param { (string | number | BN) } flashLoanFeeE6,
	*/
	"setFlashLoanFeeE6" (
		flashLoanFeeE6: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setFlashLoanFeeE6", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [flashLoanFeeE6], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::registerAsset", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, aTokenCodeHash, vTokenCodeHash, name, symbol, decimals, assetRules, reserveRestrictions, reserveFees, interestRateModel], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveIsActive", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, active], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveIsFrozen", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, freeze], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setInterestRateModel", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, interestRateModel], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveRestrictions", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, reserveRestrictions], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveFees", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, reserveFees], contractOptions, signerOptions);
	}

	/**
	* addMarketRule
	*
	* @param { Array<ArgumentTypes.AssetRules | null> } marketRule,
	*/
	"addMarketRule" (
		marketRule: Array<ArgumentTypes.AssetRules | null>,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::addMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRule], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::modifyAssetRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId, asset, assetRules], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::takeProtocolIncome", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets, to], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setStablecoinDebtRateE18", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, debtRateE18], contractOptions, signerOptions);
	}

	/**
	* viewFlashLoanFeeE6
	*
	*/
	"viewFlashLoanFeeE6" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewFlashLoanFeeE6", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* viewAssetId
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAssetId" (
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetId", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], contractOptions, signerOptions);
	}

	/**
	* viewRegisteredAssets
	*
	*/
	"viewRegisteredAssets" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewRegisteredAssets", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* viewReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveData" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewUnupdatedReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewUnupdatedReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewUnupdatedReserveIndexes", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewInterestRateModel
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewInterestRateModel", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewReserveRestrictions
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveRestrictions", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewReserveTokens
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveTokens" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveTokens", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewReserveDecimalMultiplier
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveDecimalMultiplier" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveDecimalMultiplier", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveIndexes", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
	}

	/**
	* viewReserveFees
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveFees" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewReserveFees", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewUnupdatedAccountReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAccountReserveData", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, account], contractOptions, signerOptions);
	}

	/**
	* viewAccountConfig
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountConfig" (
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAccountConfig", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], contractOptions, signerOptions);
	}

	/**
	* viewMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	*/
	"viewMarketRule" (
		marketRuleId: (number | string | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewMarketRule", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [marketRuleId], contractOptions, signerOptions);
	}

	/**
	* getAccountFreeCollateralCoefficient
	*
	* @param { ArgumentTypes.AccountId } accountAddress,
	*/
	"getAccountFreeCollateralCoefficient" (
		accountAddress: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::getAccountFreeCollateralCoefficient", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [accountAddress], contractOptions, signerOptions);
	}

	/**
	* viewProtocolIncome
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewProtocolIncome", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [assets], contractOptions, signerOptions);
	}

	/**
	* viewAssetTwIndex
	*
	* @param { ArgumentTypes.AccountId } asset,
	*/
	"viewAssetTwIndex" (
		asset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetTwIndex", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewAssetTwEntries", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, from, to], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolView::viewTwUrFromPeriodLongerThan", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [period, asset, guessedIndex], contractOptions, signerOptions);
	}

	/**
	* viewCounterToAccount
	*
	* @param { (string | number | BN) } counter,
	*/
	"viewCounterToAccount" (
		counter: (string | number | BN),
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewCounterToAccount", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [counter], contractOptions, signerOptions);
	}

	/**
	* viewAccountToCounter
	*
	* @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountToCounter" (
		account: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewAccountToCounter", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [account], contractOptions, signerOptions);
	}

	/**
	* viewNextCounter
	*
	*/
	"viewNextCounter" (
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accountRegistrarView::viewNextCounter", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [], contractOptions, signerOptions);
	}

	/**
	* totalDepositOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::totalDepositOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::accountDepositOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::transferDepositFromTo", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, from, to, amount], contractOptions, signerOptions);
	}

	/**
	* totalDebtOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::totalDebtOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::accountDebtOf", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, account], contractOptions, signerOptions);
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
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolVTokenInterface::transferDebtFromTo", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, from, to, amount], contractOptions, signerOptions);
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

	/**
	* setCodeHash
	*
	* @param { ArgumentTypes.Hash } setCodeHash,
	*/
	"setCodeHash" (
		setCodeHash: ArgumentTypes.Hash,
		contractOptions ? : ContractOptions,
		signerOptions ? : Partial<SignerOptions>
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setCodeHash::setCodeHash", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [setCodeHash], contractOptions, signerOptions);
	}

}