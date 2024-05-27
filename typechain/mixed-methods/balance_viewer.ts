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
import type * as ArgumentTypes from '../types-arguments/balance_viewer';
import type * as ReturnTypes from '../types-returns/balance_viewer';
import type BN from 'bn.js';
import { getTypeDescription } from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/balance_viewer.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/balance_viewer.json';
import { bnToBn } from '@polkadot/util';

export default class Methods {
  readonly __nativeContract: ContractPromise;
  readonly __keyringPair: KeyringPair;
  readonly __callerAddress: string;
  readonly __apiPromise: ApiPromise;

  constructor(apiPromise: ApiPromise, nativeContract: ContractPromise, keyringPair: KeyringPair) {
    this.__apiPromise = apiPromise;
    this.__nativeContract = nativeContract;
    this.__keyringPair = keyringPair;
    this.__callerAddress = keyringPair.address;
  }

  /**
   * viewAccountBalances
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError> }
   */
  viewAccountBalances(
    assets: Array<ArgumentTypes.AccountId> | null,
    account: ArgumentTypes.AccountId,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, BN]>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'viewAccountBalances',
      [assets, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(9, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewUnupdatedReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @returns { Result<Array<[ReturnTypes.AccountId, ReturnTypes.ReserveData | null]>, ReturnTypes.LangError> }
   */
  viewUnupdatedReserveDatas(
    assets: Array<ArgumentTypes.AccountId> | null,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, ReturnTypes.ReserveData | null]>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'viewUnupdatedReserveDatas', [assets], __options, (result) => {
      return handleReturnType(result, getTypeDescription(13, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * viewReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @returns { Result<Array<[ReturnTypes.AccountId, ReturnTypes.ReserveData | null]>, ReturnTypes.LangError> }
   */
  viewReserveDatas(
    assets: Array<ArgumentTypes.AccountId> | null,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, ReturnTypes.ReserveData | null]>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'viewReserveDatas', [assets], __options, (result) => {
      return handleReturnType(result, getTypeDescription(13, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * viewUnupdatedAccountReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<Array<[ReturnTypes.AccountId, ReturnTypes.AccountReserveData]>, ReturnTypes.LangError> }
   */
  viewUnupdatedAccountReserveDatas(
    assets: Array<ArgumentTypes.AccountId> | null,
    account: ArgumentTypes.AccountId,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, ReturnTypes.AccountReserveData]>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'viewUnupdatedAccountReserveDatas',
      [assets, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(20, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewAccountReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @param { ArgumentTypes.AccountId } account,
   * @returns { Result<Array<[ReturnTypes.AccountId, ReturnTypes.AccountReserveData]>, ReturnTypes.LangError> }
   */
  viewAccountReserveDatas(
    assets: Array<ArgumentTypes.AccountId> | null,
    account: ArgumentTypes.AccountId,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, ReturnTypes.AccountReserveData]>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'viewAccountReserveDatas',
      [assets, account],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(20, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * viewCompleteReserveData
   *
   * @param { ArgumentTypes.AccountId } asset,
   * @returns { Result<ReturnTypes.CompleteReserveData, ReturnTypes.LangError> }
   */
  viewCompleteReserveData(
    asset: ArgumentTypes.AccountId,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<ReturnTypes.CompleteReserveData, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'viewCompleteReserveData', [asset], __options, (result) => {
      return handleReturnType(result, getTypeDescription(24, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * viewCompleteReserveDatas
   *
   * @param { Array<ArgumentTypes.AccountId> | null } assets,
   * @returns { Result<Array<[ReturnTypes.AccountId, ReturnTypes.CompleteReserveData]>, ReturnTypes.LangError> }
   */
  viewCompleteReserveDatas(
    assets: Array<ArgumentTypes.AccountId> | null,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[ReturnTypes.AccountId, ReturnTypes.CompleteReserveData]>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'viewCompleteReserveDatas', [assets], __options, (result) => {
      return handleReturnType(result, getTypeDescription(38, DATA_TYPE_DESCRIPTIONS));
    });
  }
}
