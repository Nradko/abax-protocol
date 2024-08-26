/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/lending_pool';
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
	 * chooseMarketRule
	 *
	 * @param { (number | string | BN) } marketRuleId,
	*/
	"chooseMarketRule" (
		marketRuleId: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::chooseMarketRule", [marketRuleId], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::setAsCollateral", [asset, useAsCollateral], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::deposit", [asset, onBehalfOf, amount, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::withdraw", [asset, onBehalfOf, amount, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::borrow", [asset, onBehalfOf, amount, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::repay", [asset, onBehalfOf, amount, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::multiOp", [actions, onBehalfOf, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolActions::liquidate", [liquidatedAccount, assetToRepay, assetToTake, amountToRepay, minimumRecievedForOneRepaidTokenE18, data], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolFlash::flashLoan", [receiver, assets, amounts, receiverParams], __options);
	}

	/**
	 * accumulateInterest
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"accumulateInterest" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolMaintain::accumulateInterest", [asset], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolMaintain::adjustRateAtTarget", [asset, guessedIndex], __options);
	}

	/**
	 * setPriceFeedProvider
	 *
	 * @param { ArgumentTypes.AccountId } priceFeedProvider,
	*/
	"setPriceFeedProvider" (
		priceFeedProvider: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setPriceFeedProvider", [priceFeedProvider], __options);
	}

	/**
	 * setFeeReductionProvider
	 *
	 * @param { ArgumentTypes.AccountId } feeReductionProvider,
	*/
	"setFeeReductionProvider" (
		feeReductionProvider: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setFeeReductionProvider", [feeReductionProvider], __options);
	}

	/**
	 * setFlashLoanFeeE6
	 *
	 * @param { (string | number | BN) } flashLoanFeeE6,
	*/
	"setFlashLoanFeeE6" (
		flashLoanFeeE6: (string | number | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setFlashLoanFeeE6", [flashLoanFeeE6], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::registerAsset", [asset, aTokenCodeHash, vTokenCodeHash, name, symbol, decimals, assetRules, reserveRestrictions, reserveFees, interestRateModel], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setReserveIsActive", [asset, active], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setReserveIsFrozen", [asset, freeze], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setInterestRateModel", [asset, interestRateModel], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setReserveRestrictions", [asset, reserveRestrictions], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setReserveFees", [asset, reserveFees], __options);
	}

	/**
	 * addMarketRule
	 *
	 * @param { Array<ArgumentTypes.AssetRules | null> } marketRule,
	*/
	"addMarketRule" (
		marketRule: Array<ArgumentTypes.AssetRules | null>,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::addMarketRule", [marketRule], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::modifyAssetRule", [marketRuleId, asset, assetRules], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::takeProtocolIncome", [assets, to], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolManage::setStablecoinDebtRateE18", [asset, debtRateE18], __options);
	}

	/**
	 * viewFlashLoanFeeE6
	 *
	*/
	"viewFlashLoanFeeE6" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewFlashLoanFeeE6", [], __options);
	}

	/**
	 * viewAssetId
	 *
	 * @param { ArgumentTypes.AccountId } account,
	*/
	"viewAssetId" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewAssetId", [account], __options);
	}

	/**
	 * viewRegisteredAssets
	 *
	*/
	"viewRegisteredAssets" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewRegisteredAssets", [], __options);
	}

	/**
	 * viewReserveData
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveData" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveData", [asset], __options);
	}

	/**
	 * viewUnupdatedReserveIndexes
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewUnupdatedReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewUnupdatedReserveIndexes", [asset], __options);
	}

	/**
	 * viewInterestRateModel
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewInterestRateModel" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewInterestRateModel", [asset], __options);
	}

	/**
	 * viewReserveRestrictions
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveRestrictions" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveRestrictions", [asset], __options);
	}

	/**
	 * viewReserveTokens
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveTokens" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveTokens", [asset], __options);
	}

	/**
	 * viewReserveDecimalMultiplier
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveDecimalMultiplier" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveDecimalMultiplier", [asset], __options);
	}

	/**
	 * viewReserveIndexes
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveIndexes" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveIndexes", [asset], __options);
	}

	/**
	 * viewReserveFees
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewReserveFees" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewReserveFees", [asset], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewUnupdatedAccountReserveData", [asset, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewAccountReserveData", [asset, account], __options);
	}

	/**
	 * viewAccountConfig
	 *
	 * @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountConfig" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewAccountConfig", [account], __options);
	}

	/**
	 * viewMarketRule
	 *
	 * @param { (number | string | BN) } marketRuleId,
	*/
	"viewMarketRule" (
		marketRuleId: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewMarketRule", [marketRuleId], __options);
	}

	/**
	 * getAccountFreeCollateralCoefficient
	 *
	 * @param { ArgumentTypes.AccountId } accountAddress,
	*/
	"getAccountFreeCollateralCoefficient" (
		accountAddress: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::getAccountFreeCollateralCoefficient", [accountAddress], __options);
	}

	/**
	 * viewProtocolIncome
	 *
	 * @param { Array<ArgumentTypes.AccountId> | null } assets,
	*/
	"viewProtocolIncome" (
		assets: Array<ArgumentTypes.AccountId> | null,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewProtocolIncome", [assets], __options);
	}

	/**
	 * viewAssetTwIndex
	 *
	 * @param { ArgumentTypes.AccountId } asset,
	*/
	"viewAssetTwIndex" (
		asset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewAssetTwIndex", [asset], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewAssetTwEntries", [asset, from, to], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolView::viewTwUrFromPeriodLongerThan", [period, asset, guessedIndex], __options);
	}

	/**
	 * viewCounterToAccount
	 *
	 * @param { (string | number | BN) } counter,
	*/
	"viewCounterToAccount" (
		counter: (string | number | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accountRegistrarView::viewCounterToAccount", [counter], __options);
	}

	/**
	 * viewAccountToCounter
	 *
	 * @param { ArgumentTypes.AccountId } account,
	*/
	"viewAccountToCounter" (
		account: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accountRegistrarView::viewAccountToCounter", [account], __options);
	}

	/**
	 * viewNextCounter
	 *
	*/
	"viewNextCounter" (
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accountRegistrarView::viewNextCounter", [], __options);
	}

	/**
	 * totalDepositOf
	 *
	 * @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDepositOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolATokenInterface::totalDepositOf", [underlyingAsset], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolATokenInterface::accountDepositOf", [underlyingAsset, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolATokenInterface::transferDepositFromTo", [underlyingAsset, from, to, amount], __options);
	}

	/**
	 * totalDebtOf
	 *
	 * @param { ArgumentTypes.AccountId } underlyingAsset,
	*/
	"totalDebtOf" (
		underlyingAsset: ArgumentTypes.AccountId,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolVTokenInterface::totalDebtOf", [underlyingAsset], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolVTokenInterface::accountDebtOf", [underlyingAsset, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "lendingPoolVTokenInterface::transferDebtFromTo", [underlyingAsset, from, to, amount], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::hasRole", [role, address], __options);
	}

	/**
	 * getRoleAdmin
	 *
	 * @param { (number | string | BN) } role,
	*/
	"getRoleAdmin" (
		role: (number | string | BN),
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::getRoleAdmin", [role], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::grantRole", [role, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::revokeRole", [role, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::renounceRole", [role, account], __options);
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
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "accessControl::setRoleAdmin", [role, newAdmin], __options);
	}

	/**
	 * setCodeHash
	 *
	 * @param { ArgumentTypes.Hash } setCodeHash,
	*/
	"setCodeHash" (
		setCodeHash: ArgumentTypes.Hash,
		__options: ContractOptions,
	){
		return buildSubmittableExtrinsic( this.__apiPromise, this.__nativeContract, "setCodeHash::setCodeHash", [setCodeHash], __options);
	}

}