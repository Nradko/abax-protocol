/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/balance_viewer';
import type BN from 'bn.js';
import type { ApiPromise } from '@polkadot/api';

export default class Methods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;

  constructor(nativeContract: ContractPromise, apiPromise: ApiPromise) {
    this.__nativeContract = nativeContract;
    this.__apiPromise = apiPromise;
  }
  /**
   * viewAccountBalances
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   */
  viewAccountBalances(assets: Array<ArgumentTypes.AccountId> | null, account: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewAccountBalances', [assets, account], __options);
  }

  /**
   * viewUnupdatedReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   */
  viewUnupdatedReserveDatas(assets: Array<ArgumentTypes.AccountId> | null, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewUnupdatedReserveDatas', [assets], __options);
  }

  /**
   * viewReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   */
  viewReserveDatas(assets: Array<ArgumentTypes.AccountId> | null, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewReserveDatas', [assets], __options);
  }

  /**
   * viewUnupdatedAccountReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   */
  viewUnupdatedAccountReserveDatas(assets: Array<ArgumentTypes.AccountId> | null, account: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewUnupdatedAccountReserveDatas', [assets, account], __options);
  }

  /**
   * viewAccountReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   */
  viewAccountReserveDatas(assets: Array<ArgumentTypes.AccountId> | null, account: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewAccountReserveDatas', [assets, account], __options);
  }

  /**
   * viewCompleteReserveData
   *
   * @param { ArgumentTypes.AccountId } asset,
   */
  viewCompleteReserveData(asset: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewCompleteReserveData', [asset], __options);
  }

  /**
   * viewCompleteReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   */
  viewCompleteReserveDatas(assets: Array<ArgumentTypes.AccountId> | null, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'viewCompleteReserveDatas', [assets], __options);
  }
}
