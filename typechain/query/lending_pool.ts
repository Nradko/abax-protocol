/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/lending_pool';
import type * as ReturnTypes from '../types-returns/lending_pool';
import type BN from 'bn.js';
import { getTypeDescription } from './../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/lending_pool.json';
import { bnToBn } from '@polkadot/util';

export default class LendingPoolMethods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;
  readonly __callerAddress: string;

  constructor(nativeContract: ContractPromise, nativeApi: ApiPromise, callerAddress: string) {
    this.__nativeContract = nativeContract;
    this.__callerAddress = callerAddress;
    this.__apiPromise = nativeApi;
  }

  /**
   * setCode
   *
   * @param { Array<(number | string | BN)> } codeHash,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setCode(
    codeHash: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'setCode', [codeHash], __options, (result) => {
      return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * chooseMarketRule
   *
   * @param { (number | string | BN) } marketRuleId,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  chooseMarketRule(
    marketRuleId: number | string | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::chooseMarketRule',
      [marketRuleId],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setAsCollateral
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { boolean } useAsCollateral,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setAsCollateral(
    asset: ArgumentTypes.AccountId,
    useAsCollateral: boolean,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::setAsCollateral',
      [asset, useAsCollateral],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * deposit
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } onBehalfOf,
   * @param { (string | number | BN) } amount,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  deposit(
    asset: ArgumentTypes.AccountId,
    onBehalfOf: ArgumentTypes.AccountId,
    amount: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::deposit',
      [asset, onBehalfOf, amount, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * withdraw
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } onBehalfOf,
   * @param { (string | number | BN) } amount,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  withdraw(
    asset: ArgumentTypes.AccountId,
    onBehalfOf: ArgumentTypes.AccountId,
    amount: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::withdraw',
      [asset, onBehalfOf, amount, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(124, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * borrow
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } onBehalfOf,
   * @param { (string | number | BN) } amount,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  borrow(
    asset: ArgumentTypes.AccountId,
    onBehalfOf: ArgumentTypes.AccountId,
    amount: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::borrow',
      [asset, onBehalfOf, amount, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * repay
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } onBehalfOf,
   * @param { (string | number | BN) } amount,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  repay(
    asset: ArgumentTypes.AccountId,
    onBehalfOf: ArgumentTypes.AccountId,
    amount: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<BN, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::repay',
      [asset, onBehalfOf, amount, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(124, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * multiOp
   *
   * @param { Array<ArgumentTypes.Action> } actions,
   * @param { ArgumentTypes.AccountId } onBehalfOf,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  multiOp(
    actions: Array<ArgumentTypes.Action>,
    onBehalfOf: ArgumentTypes.AccountId,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::multiOp',
      [actions, onBehalfOf, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
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
   * @returns { Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  liquidate(
    liquidatedAccount: ArgumentTypes.AccountId,
    assetToRepay: ArgumentTypes.AccountId,
    assetToTake: ArgumentTypes.AccountId,
    amountToRepay: string | number | BN,
    minimumRecievedForOneRepaidTokenE18: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolActions::liquidate',
      [liquidatedAccount, assetToRepay, assetToTake, amountToRepay, minimumRecievedForOneRepaidTokenE18, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(130, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * flashLoan
   *
   * @param { ArgumentTypes.AccountId } receiver,
   * @param { Array<ArgumentTypes.AccountId> } assets,
   * @param { Array<(string | number | BN)> } amounts,
   * @param { Array<(number | string | BN)> } receiverParams,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  flashLoan(
    receiver: ArgumentTypes.AccountId,
    assets: Array<ArgumentTypes.AccountId>,
    amounts: Array<string | number | BN>,
    receiverParams: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolFlash::flashLoan',
      [receiver, assets, amounts, receiverParams],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * accumulateInterest
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  accumulateInterest(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolMaintain::accumulateInterest',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setPriceFeedProvider
   *
   * @param { ArgumentTypes.AccountId } priceFeedProvider,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setPriceFeedProvider(
    priceFeedProvider: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setPriceFeedProvider',
      [priceFeedProvider],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setFeeReductionProvider
   *
   * @param { ArgumentTypes.AccountId } feeReductionProvider,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setFeeReductionProvider(
    feeReductionProvider: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setFeeReductionProvider',
      [feeReductionProvider],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setFlashLoanFeeE6
   *
   * @param { (string | number | BN) } flashLoanFeeE6,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setFlashLoanFeeE6(
    flashLoanFeeE6: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setFlashLoanFeeE6',
      [flashLoanFeeE6],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
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
   * @param { Array<(number | string | BN)> | null } interestRateModel,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  registerAsset(
    asset: ArgumentTypes.AccountId,
    aTokenCodeHash: Array<number | string | BN>,
    vTokenCodeHash: Array<number | string | BN>,
    name: string,
    symbol: string,
    decimals: number | string | BN,
    assetRules: ArgumentTypes.AssetRules,
    reserveRestrictions: ArgumentTypes.ReserveRestrictions,
    reserveFees: ArgumentTypes.SetReserveFeesArgs,
    interestRateModel: Array<number | string | BN> | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::registerAsset',
      [asset, aTokenCodeHash, vTokenCodeHash, name, symbol, decimals, assetRules, reserveRestrictions, reserveFees, interestRateModel],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setReserveIsActive
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { boolean } active,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setReserveIsActive(
    asset: ArgumentTypes.AccountId,
    active: boolean,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setReserveIsActive',
      [asset, active],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setReserveIsFrozen
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { boolean } freeze,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setReserveIsFrozen(
    asset: ArgumentTypes.AccountId,
    freeze: boolean,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setReserveIsFrozen',
      [asset, freeze],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setInterestRateModel
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { Array<(number | string | BN)> } interestRateModel,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setInterestRateModel(
    asset: ArgumentTypes.AccountId,
    interestRateModel: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setInterestRateModel',
      [asset, interestRateModel],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setReserveRestrictions
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.ReserveRestrictions } reserveRestrictions,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setReserveRestrictions(
    asset: ArgumentTypes.AccountId,
    reserveRestrictions: ArgumentTypes.ReserveRestrictions,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setReserveRestrictions',
      [asset, reserveRestrictions],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setReserveFees
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.SetReserveFeesArgs } reserveFees,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setReserveFees(
    asset: ArgumentTypes.AccountId,
    reserveFees: ArgumentTypes.SetReserveFeesArgs,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setReserveFees',
      [asset, reserveFees],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * addMarketRule
   *
   * @param { Array<ArgumentTypes.AssetRules | null> } marketRule,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  addMarketRule(
    marketRule: Array<ArgumentTypes.AssetRules | null>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::addMarketRule',
      [marketRule],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * modifyAssetRule
   *
   * @param { (number | string | BN) } marketRuleId,
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AssetRules } assetRules,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  modifyAssetRule(
    marketRuleId: number | string | BN,
    asset: ArgumentTypes.AccountId,
    assetRules: ArgumentTypes.AssetRules,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::modifyAssetRule',
      [marketRuleId, asset, assetRules],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * takeProtocolIncome
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } to,
   * @returns { Result<Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  takeProtocolIncome(
    assets: Array<ArgumentTypes.AccountId> | null,
    to: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::takeProtocolIncome',
      [assets, to],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(138, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setStablecoinDebtRateE18
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { (number | string | BN) } debtRateE18,
   * @returns { Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  setStablecoinDebtRateE18(
    asset: ArgumentTypes.AccountId,
    debtRateE18: number | string | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolManage::setStablecoinDebtRateE18',
      [asset, debtRateE18],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(111, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewFlashLoanFeeE6
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  viewFlashLoanFeeE6(__options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewFlashLoanFeeE6',
      [],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewAssetId
   *
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<BN | null, ReturnTypes.LangError> }
   */
  viewAssetId(account: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<BN | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewAssetId',
      [account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(143, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewRegisteredAssets
   *
   * @returns { Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError> }
   */
  viewRegisteredAssets(__options?: ContractOptions): Promise<QueryReturnType<Result<Array<ReturnTypes.AccountId>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewRegisteredAssets',
      [],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(145, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveData
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveData | null, ReturnTypes.LangError> }
   */
  viewReserveData(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveData | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveData',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(146, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewUnupdatedReserveIndexes
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> }
   */
  viewUnupdatedReserveIndexes(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewUnupdatedReserveIndexes',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(148, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewInterestRateModel
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<Array<BN> | null, ReturnTypes.LangError> }
   */
  viewInterestRateModel(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<BN> | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewInterestRateModel',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(150, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveRestrictions
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveRestrictions | null, ReturnTypes.LangError> }
   */
  viewReserveRestrictions(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveRestrictions | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveRestrictions',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(151, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveTokens
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveAbacusTokens | null, ReturnTypes.LangError> }
   */
  viewReserveTokens(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveAbacusTokens | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveTokens',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(153, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveDecimalMultiplier
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<BN | null, ReturnTypes.LangError> }
   */
  viewReserveDecimalMultiplier(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<BN | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveDecimalMultiplier',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(155, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveIndexes
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError> }
   */
  viewReserveIndexes(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveIndexes | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveIndexes',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(148, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewReserveFees
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.ReserveFees | null, ReturnTypes.LangError> }
   */
  viewReserveFees(
    asset: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.ReserveFees | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewReserveFees',
      [asset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(156, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewUnupdatedAccountReserveData
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> }
   */
  viewUnupdatedAccountReserveData(
    asset: ArgumentTypes.AccountId,
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewUnupdatedAccountReserveData',
      [asset, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(158, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewAccountReserveData
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError> }
   */
  viewAccountReserveData(
    asset: ArgumentTypes.AccountId,
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.AccountReserveData, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewAccountReserveData',
      [asset, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(158, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewAccountConfig
   *
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<ReturnTypes.AccountConfig, ReturnTypes.LangError> }
   */
  viewAccountConfig(
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.AccountConfig, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewAccountConfig',
      [account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(159, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewMarketRule
   *
   * @param { (number | string | BN) } marketRuleId,
   * @returns { Result<Array<ReturnTypes.AssetRules | null> | null, ReturnTypes.LangError> }
   */
  viewMarketRule(
    marketRuleId: number | string | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<ReturnTypes.AssetRules | null> | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewMarketRule',
      [marketRuleId],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(160, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * getAccountFreeCollateralCoefficient
   *
   * @param { ArgumentTypes.AccountId } accountAddress,
   * @returns { Result<[boolean, BN], ReturnTypes.LangError> }
   */
  getAccountFreeCollateralCoefficient(
    accountAddress: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<[boolean, BN], ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::getAccountFreeCollateralCoefficient',
      [accountAddress],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(162, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewProtocolIncome
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @returns { Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError> }
   */
  viewProtocolIncome(
    assets: Array<ArgumentTypes.AccountId> | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolView::viewProtocolIncome',
      [assets],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(164, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewCounterToAccount
   *
   * @param { (string | number | BN) } counter,
   * @returns { Result<ReturnTypes.AccountId | null, ReturnTypes.LangError> }
   */
  viewCounterToAccount(
    counter: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.AccountId | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accountRegistrarView::viewCounterToAccount',
      [counter],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(165, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewAccountToCounter
   *
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<BN | null, ReturnTypes.LangError> }
   */
  viewAccountToCounter(
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<BN | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accountRegistrarView::viewAccountToCounter',
      [account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(155, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewNextCounter
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  viewNextCounter(__options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accountRegistrarView::viewNextCounter',
      [],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * totalDepositOf
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  totalDepositOf(underlyingAsset: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolATokenInterface::totalDepositOf',
      [underlyingAsset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * accountDepositOf
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  accountDepositOf(
    underlyingAsset: ArgumentTypes.AccountId,
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolATokenInterface::accountDepositOf',
      [underlyingAsset, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * transferDepositFromTo
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @param { ArgumentTypes.AccountId } from,
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } amount,
   * @returns { Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  transferDepositFromTo(
    underlyingAsset: ArgumentTypes.AccountId,
    from: ArgumentTypes.AccountId,
    to: ArgumentTypes.AccountId,
    amount: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolATokenInterface::transferDepositFromTo',
      [underlyingAsset, from, to, amount],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(130, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * totalDebtOf
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  totalDebtOf(underlyingAsset: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolVTokenInterface::totalDebtOf',
      [underlyingAsset],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * accountDebtOf
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  accountDebtOf(
    underlyingAsset: ArgumentTypes.AccountId,
    account: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolVTokenInterface::accountDebtOf',
      [underlyingAsset, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(142, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * transferDebtFromTo
   *
   * @param { ArgumentTypes.AccountId } underlyingAsset,
   * @param { ArgumentTypes.AccountId } from,
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } amount,
   * @returns { Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError> }
   */
  transferDebtFromTo(
    underlyingAsset: ArgumentTypes.AccountId,
    from: ArgumentTypes.AccountId,
    to: ArgumentTypes.AccountId,
    amount: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<[BN, BN], ReturnTypes.LendingPoolError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'lendingPoolVTokenInterface::transferDebtFromTo',
      [underlyingAsset, from, to, amount],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(130, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * hasRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } address,
   * @returns { Result<boolean, ReturnTypes.LangError> }
   */
  hasRole(
    role: number | string | BN,
    address: ArgumentTypes.AccountId | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<boolean, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::hasRole',
      [role, address],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(166, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * getRoleAdmin
   *
   * @param { (number | string | BN) } role,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  getRoleAdmin(role: number | string | BN, __options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'accessControl::getRoleAdmin', [role], __options, (result) => {
      return handleReturnType(result, getTypeDescription(167, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * grantRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
   */
  grantRole(
    role: number | string | BN,
    account: ArgumentTypes.AccountId | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::grantRole',
      [role, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(168, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * revokeRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
   */
  revokeRole(
    role: number | string | BN,
    account: ArgumentTypes.AccountId | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::revokeRole',
      [role, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(168, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * renounceRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
   */
  renounceRole(
    role: number | string | BN,
    account: ArgumentTypes.AccountId | null,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::renounceRole',
      [role, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(168, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setRoleAdmin
   *
   * @param { (number | string | BN) } role,
   * @param { (number | string | BN) } newAdmin,
   * @returns { Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError> }
   */
  setRoleAdmin(
    role: number | string | BN,
    newAdmin: number | string | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.AccessControlError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::setRoleAdmin',
      [role, newAdmin],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(168, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }
}
