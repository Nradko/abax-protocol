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
import type * as ArgumentTypes from '../types-arguments/lending_pool';
import type * as ReturnTypes from '../types-returns/lending_pool';
import type BN from 'bn.js';
import {getTypeDescription} from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents, decodeEventsLegacy } from "../shared/utils";
import DATA_TYPE_DESCRIPTIONS from '../data/lending_pool.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/lending_pool.json';
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
	* setCode
	*
	* @param { Array<(number | string | BN)> } codeHash,
	* @returns { void }
	*/
	"setCode" (
		codeHash: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "setCode", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [codeHash], __options);
	}

	/**
	* chooseMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	* @returns { void }
	*/
	"chooseMarketRule" (
		marketRuleId: (number | string | BN),
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setAsCollateral" (
		asset: ArgumentTypes.AccountId,
		useAsCollateral: boolean,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"deposit" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"withdraw" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"borrow" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"repay" (
		asset: ArgumentTypes.AccountId,
		onBehalfOf: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"multiOp" (
		actions: Array<ArgumentTypes.Action>,
		onBehalfOf: ArgumentTypes.AccountId,
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"liquidate" (
		liquidatedAccount: ArgumentTypes.AccountId,
		assetToRepay: ArgumentTypes.AccountId,
		assetToTake: ArgumentTypes.AccountId,
		amountToRepay: (string | number | BN),
		minimumRecievedForOneRepaidTokenE18: (string | number | BN),
		data: Array<(number | string | BN)>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"flashLoan" (
		receiver: ArgumentTypes.AccountId,
		assets: Array<ArgumentTypes.AccountId>,
		amounts: Array<(string | number | BN)>,
		receiverParams: Array<(number | string | BN)>,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolFlash::flashLoan", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [receiver, assets, amounts, receiverParams], __options);
	}

	/**
	* accumulateInterest
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { void }
	*/
	"accumulateInterest" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"adjustRateAtTarget" (
		asset: ArgumentTypes.AccountId,
		guessedIndex: (number | string | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolMaintain::adjustRateAtTarget", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, guessedIndex], __options);
	}

	/**
	* setPriceFeedProvider
	*
	* @param { ArgumentTypes.AccountId } priceFeedProvider,
	* @returns { void }
	*/
	"setPriceFeedProvider" (
		priceFeedProvider: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setPriceFeedProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [priceFeedProvider], __options);
	}

	/**
	* setFeeReductionProvider
	*
	* @param { ArgumentTypes.AccountId } feeReductionProvider,
	* @returns { void }
	*/
	"setFeeReductionProvider" (
		feeReductionProvider: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setFeeReductionProvider", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [feeReductionProvider], __options);
	}

	/**
	* setFlashLoanFeeE6
	*
	* @param { (string | number | BN) } flashLoanFeeE6,
	* @returns { void }
	*/
	"setFlashLoanFeeE6" (
		flashLoanFeeE6: (string | number | BN),
		__options: ContractOptions,
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
	* @returns { void }
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
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setReserveIsActive" (
		asset: ArgumentTypes.AccountId,
		active: boolean,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setReserveIsFrozen" (
		asset: ArgumentTypes.AccountId,
		freeze: boolean,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		interestRateModel: ArgumentTypes.InterestRateModelParams,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		reserveRestrictions: ArgumentTypes.ReserveRestrictions,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setReserveFees" (
		asset: ArgumentTypes.AccountId,
		reserveFees: ArgumentTypes.SetReserveFeesArgs,
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setReserveFees", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, reserveFees], __options);
	}

	/**
	* addMarketRule
	*
	* @param { Array<ArgumentTypes.AssetRules | null> } marketRule,
	* @returns { void }
	*/
	"addMarketRule" (
		marketRule: Array<ArgumentTypes.AssetRules | null>,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"modifyAssetRule" (
		marketRuleId: (number | string | BN),
		asset: ArgumentTypes.AccountId,
		assetRules: ArgumentTypes.AssetRules,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"takeProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		to: ArgumentTypes.AccountId,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setStablecoinDebtRateE18" (
		asset: ArgumentTypes.AccountId,
		debtRateE18: (number | string | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolManage::setStablecoinDebtRateE18", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [asset, debtRateE18], __options);
	}

	/**
	* viewFlashLoanFeeE6
	*
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"viewFlashLoanFeeE6" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewFlashLoanFeeE6", [], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAssetId
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN | null, ReturnTypes.LangError> }
	*/
	"viewAssetId" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewAssetId", [account], __options, (result) => { return handleReturnType(result, getTypeDescription(157, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewRegisteredAssets
	*
	* @returns { Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError> }
	*/
	"viewRegisteredAssets" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewRegisteredAssets", [], __options, (result) => { return handleReturnType(result, getTypeDescription(159, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveData | null, ReturnTypes.LangError> }
	*/
	"viewReserveData" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveData | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveData", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(160, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewUnupdatedReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> }
	*/
	"viewUnupdatedReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewUnupdatedReserveIndexes", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(162, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewInterestRateModel
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.InterestRateModel | null, ReturnTypes.LangError> }
	*/
	"viewInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.InterestRateModel | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewInterestRateModel", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(164, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveRestrictions
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveRestrictions | null, ReturnTypes.LangError> }
	*/
	"viewReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveRestrictions | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveRestrictions", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(166, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveTokens
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveAbacusTokens | null, ReturnTypes.LangError> }
	*/
	"viewReserveTokens" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveAbacusTokens | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveTokens", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(168, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveDecimalMultiplier
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<BN | null, ReturnTypes.LangError> }
	*/
	"viewReserveDecimalMultiplier" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveDecimalMultiplier", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(170, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveIndexes
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> }
	*/
	"viewReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveIndexes", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(162, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewReserveFees
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.ReserveFees | null, ReturnTypes.LangError> }
	*/
	"viewReserveFees" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.ReserveFees | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewReserveFees", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(171, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewUnupdatedAccountReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> }
	*/
	"viewUnupdatedAccountReserveData" (
		asset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewUnupdatedAccountReserveData", [asset, account], __options, (result) => { return handleReturnType(result, getTypeDescription(173, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAccountReserveData
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> }
	*/
	"viewAccountReserveData" (
		asset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewAccountReserveData", [asset, account], __options, (result) => { return handleReturnType(result, getTypeDescription(173, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAccountConfig
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<ReturnTypes.AccountConfig, ReturnTypes.LangError> }
	*/
	"viewAccountConfig" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountConfig, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewAccountConfig", [account], __options, (result) => { return handleReturnType(result, getTypeDescription(174, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewMarketRule
	*
	* @param { (number | string | BN) } marketRuleId,
	* @returns { Result<Array<ReturnTypes.AssetRules | null> | null, ReturnTypes.LangError> }
	*/
	"viewMarketRule" (
		marketRuleId: (number | string | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Array<ReturnTypes.AssetRules | null> | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewMarketRule", [marketRuleId], __options, (result) => { return handleReturnType(result, getTypeDescription(175, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getAccountFreeCollateralCoefficient
	*
	* @param { ArgumentTypes.AccountId } accountAddress,
	* @returns { Result<[boolean, BN], ReturnTypes.LangError> }
	*/
	"getAccountFreeCollateralCoefficient" (
		accountAddress: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<[boolean, BN], ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::getAccountFreeCollateralCoefficient", [accountAddress], __options, (result) => { return handleReturnType(result, getTypeDescription(177, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewProtocolIncome
	*
	* @param { Array<ArgumentTypes.AccountId> | null } assets,
	* @returns { Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError> }
	*/
	"viewProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewProtocolIncome", [assets], __options, (result) => { return handleReturnType(result, getTypeDescription(179, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAssetTwIndex
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @returns { Result<ReturnTypes.TwIndex | null, ReturnTypes.LangError> }
	*/
	"viewAssetTwIndex" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.TwIndex | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewAssetTwIndex", [asset], __options, (result) => { return handleReturnType(result, getTypeDescription(180, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAssetTwEntries
	*
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } from,
	* @param { (number | string | BN) } to,
	* @returns { Result<Array<ReturnTypes.TwEntry | null>, ReturnTypes.LangError> }
	*/
	"viewAssetTwEntries" (
		asset: ArgumentTypes.AccountId,
		from: (number | string | BN),
		to: (number | string | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Array<ReturnTypes.TwEntry | null>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewAssetTwEntries", [asset, from, to], __options, (result) => { return handleReturnType(result, getTypeDescription(182, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewTwUrFromPeriodLongerThan
	*
	* @param { (number | string | BN) } period,
	* @param { ArgumentTypes.AccountId } asset,
	* @param { (number | string | BN) } guessedIndex,
	* @returns { Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
	*/
	"viewTwUrFromPeriodLongerThan" (
		period: (number | string | BN),
		asset: ArgumentTypes.AccountId,
		guessedIndex: (number | string | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolView::viewTwUrFromPeriodLongerThan", [period, asset, guessedIndex], __options, (result) => { return handleReturnType(result, getTypeDescription(185, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewCounterToAccount
	*
	* @param { (string | number | BN) } counter,
	* @returns { Result<ReturnTypes.AccountId | null, ReturnTypes.LangError> }
	*/
	"viewCounterToAccount" (
		counter: (string | number | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<ReturnTypes.AccountId | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accountRegistrarView::viewCounterToAccount", [counter], __options, (result) => { return handleReturnType(result, getTypeDescription(187, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewAccountToCounter
	*
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN | null, ReturnTypes.LangError> }
	*/
	"viewAccountToCounter" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN | null, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accountRegistrarView::viewAccountToCounter", [account], __options, (result) => { return handleReturnType(result, getTypeDescription(170, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* viewNextCounter
	*
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"viewNextCounter" (
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accountRegistrarView::viewNextCounter", [], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* totalDepositOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"totalDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolATokenInterface::totalDepositOf", [underlyingAsset], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* accountDepositOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"accountDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolATokenInterface::accountDepositOf", [underlyingAsset, account], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* transferDepositFromTo
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } amount,
	* @returns { void }
	*/
	"transferDepositFromTo" (
		underlyingAsset: ArgumentTypes.AccountId,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "lendingPoolATokenInterface::transferDepositFromTo", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [underlyingAsset, from, to, amount], __options);
	}

	/**
	* totalDebtOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"totalDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolVTokenInterface::totalDebtOf", [underlyingAsset], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* accountDebtOf
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } account,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"accountDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "lendingPoolVTokenInterface::accountDebtOf", [underlyingAsset, account], __options, (result) => { return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* transferDebtFromTo
	*
	* @param { ArgumentTypes.AccountId } underlyingAsset,
	* @param { ArgumentTypes.AccountId } from,
	* @param { ArgumentTypes.AccountId } to,
	* @param { (string | number | BN) } amount,
	* @returns { void }
	*/
	"transferDebtFromTo" (
		underlyingAsset: ArgumentTypes.AccountId,
		from: ArgumentTypes.AccountId,
		to: ArgumentTypes.AccountId,
		amount: (string | number | BN),
		__options: ContractOptions,
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
	* @returns { Result<boolean, ReturnTypes.LangError> }
	*/
	"hasRole" (
		role: (number | string | BN),
		address: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<boolean, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::hasRole", [role, address], __options, (result) => { return handleReturnType(result, getTypeDescription(188, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* getRoleAdmin
	*
	* @param { (number | string | BN) } role,
	* @returns { Result<BN, ReturnTypes.LangError> }
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options: ContractOptions,
	): Promise< QueryReturnType< Result<BN, ReturnTypes.LangError> > >{
		return queryOkJSON( this.__apiPromise, this.__nativeContract, this.__callerAddress, "accessControl::getRoleAdmin", [role], __options, (result) => { return handleReturnType(result, getTypeDescription(189, DATA_TYPE_DESCRIPTIONS)); });
	}

	/**
	* grantRole
	*
	* @param { (number | string | BN) } role,
	* @param { ArgumentTypes.AccountId | null } account,
	* @returns { void }
	*/
	"grantRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"revokeRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"renounceRole" (
		role: (number | string | BN),
		account: ArgumentTypes.AccountId | null,
		__options: ContractOptions,
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
	* @returns { void }
	*/
	"setRoleAdmin" (
		role: (number | string | BN),
		newAdmin: (number | string | BN),
		__options: ContractOptions,
	){
		return txSignAndSend( this.__apiPromise, this.__nativeContract, this.__keyringPair, "accessControl::setRoleAdmin", (events: EventRecord[]) => {
			return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
		}, [role, newAdmin], __options);
	}

}