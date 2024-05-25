/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/dia_oracle';
import type * as ReturnTypes from '../types-returns/dia_oracle';
import type BN from 'bn.js';
import { getTypeDescription } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/dia_oracle.json';
import { bnToBn } from '@polkadot/util';

export default class DiaOracleMethods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;
  readonly __callerAddress: string;

  constructor(nativeContract: ContractPromise, nativeApi: ApiPromise, callerAddress: string) {
    this.__nativeContract = nativeContract;
    this.__callerAddress = callerAddress;
    this.__apiPromise = nativeApi;
  }

  /**
   * codeHash
   *
   * @returns { Result<ReturnTypes.Hash, ReturnTypes.LangError> }
   */
  codeHash(__options?: ContractOptions): Promise<QueryReturnType<Result<ReturnTypes.Hash, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'codeHash', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(20, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * setCode
   *
   * @param { Array<(number | string | BN)> } codeHash,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setCode(codeHash: Array<number | string | BN>, __options?: ContractOptions): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'setCode', [codeHash], __options, (result) => {
      return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * transferOwnership
   *
   * @param { ArgumentTypes.AccountId } newOwner,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  transferOwnership(newOwner: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'oracleSetters::transferOwnership',
      [newOwner],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setUpdater
   *
   * @param { ArgumentTypes.AccountId } updater,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setUpdater(updater: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'oracleSetters::setUpdater',
      [updater],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setPrice
   *
   * @param { string } pair,
   * @param { (string | number | BN) } price,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setPrice(pair: string, price: string | number | BN, __options?: ContractOptions): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'oracleSetters::setPrice',
      [pair, price],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setPrices
   *
   * @param { Array<[string, (string | number | BN)]> } pairs,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setPrices(
    pairs: Array<[string, string | number | BN]>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'oracleSetters::setPrices', [pairs], __options, (result) => {
      return handleReturnType(result, getTypeDescription(18, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * getUpdater
   *
   * @returns { Result<ReturnTypes.AccountId, ReturnTypes.LangError> }
   */
  getUpdater(__options?: ContractOptions): Promise<QueryReturnType<Result<ReturnTypes.AccountId, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'oracleGetters::getUpdater', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(24, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * getLatestPrice
   *
   * @param { string } pair,
   * @returns { Result<[BN, BN] | null, ReturnTypes.LangError> }
   */
  getLatestPrice(pair: string, __options?: ContractOptions): Promise<QueryReturnType<Result<[BN, BN] | null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'oracleGetters::getLatestPrice',
      [pair],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(25, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * getLatestPrices
   *
   * @param { Array<string> } pairs,
   * @returns { Result<Array<[BN, BN] | null>, ReturnTypes.LangError> }
   */
  getLatestPrices(
    pairs: Array<string>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Array<[BN, BN] | null>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'oracleGetters::getLatestPrices',
      [pairs],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(28, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }
}
