/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/test_reserves_minter';
import type * as ReturnTypes from '../types-returns/test_reserves_minter';
import type BN from 'bn.js';
import { getTypeDescription } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/test_reserves_minter.json';
import { bnToBn } from '@polkadot/util';

export default class TestReservesMinterMethods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;
  readonly __callerAddress: string;

  constructor(nativeContract: ContractPromise, nativeApi: ApiPromise, callerAddress: string) {
    this.__nativeContract = nativeContract;
    this.__callerAddress = callerAddress;
    this.__apiPromise = nativeApi;
  }

  /**
   * mint
   *
   * @param { Array<[ArgumentTypes.AccountId, (string | number | BN)]> } addresesWithAmounts,
   * @param { ArgumentTypes.AccountId } to,
   * @returns { Result<Result<null, ReturnTypes.TestReservesMinterError>, ReturnTypes.LangError> }
   */
  mint(
    addresesWithAmounts: Array<[ArgumentTypes.AccountId, string | number | BN]>,
    to: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.TestReservesMinterError>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'mint', [addresesWithAmounts, to], __options, (result) => {
      return handleReturnType(result, getTypeDescription(22, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * owner
   *
   * @returns { Result<ReturnTypes.AccountId | null, ReturnTypes.LangError> }
   */
  owner(__options?: ContractOptions): Promise<QueryReturnType<Result<ReturnTypes.AccountId | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'ownable::owner', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(28, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * renounceOwnership
   *
   * @returns { Result<Result<null, ReturnTypes.OwnableError>, ReturnTypes.LangError> }
   */
  renounceOwnership(__options?: ContractOptions): Promise<QueryReturnType<Result<Result<null, ReturnTypes.OwnableError>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'ownable::renounceOwnership', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(29, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * transferOwnership
   *
   * @param { ArgumentTypes.AccountId } newOwner,
   * @returns { Result<Result<null, ReturnTypes.OwnableError>, ReturnTypes.LangError> }
   */
  transferOwnership(
    newOwner: ArgumentTypes.AccountId,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.OwnableError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'ownable::transferOwnership',
      [newOwner],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(29, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }
}
