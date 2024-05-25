/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/flash_loan_receiver_mock';
import type * as ReturnTypes from '../types-returns/flash_loan_receiver_mock';
import type BN from 'bn.js';
import { getTypeDescription } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/flash_loan_receiver_mock.json';
import { bnToBn } from '@polkadot/util';

export default class FlashLoanReceiverMockMethods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;
  readonly __callerAddress: string;

  constructor(nativeContract: ContractPromise, nativeApi: ApiPromise, callerAddress: string) {
    this.__nativeContract = nativeContract;
    this.__callerAddress = callerAddress;
    this.__apiPromise = nativeApi;
  }

  /**
   * setFailExecuteOperation
   *
   * @param { boolean } shouldFailExecuteOperation,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setFailExecuteOperation(
    shouldFailExecuteOperation: boolean,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'setFailExecuteOperation',
      [shouldFailExecuteOperation],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(4, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setCustomAmountToApprove
   *
   * @param { (string | number | BN) } customAmountToApprove,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setCustomAmountToApprove(
    customAmountToApprove: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'setCustomAmountToApprove',
      [customAmountToApprove],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(4, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * setSimulateBalanceToCoverFee
   *
   * @param { boolean } simulateBalanceToCoverFee,
   * @returns { Result<null, ReturnTypes.LangError> }
   */
  setSimulateBalanceToCoverFee(
    simulateBalanceToCoverFee: boolean,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<null, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'setSimulateBalanceToCoverFee',
      [simulateBalanceToCoverFee],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(4, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * executeOperation
   *
   * @param { Array<ArgumentTypes.AccountId> } assets,
   * @param { Array<(string | number | BN)> } amounts,
   * @param { Array<(string | number | BN)> } fees,
   * @param { Array<(number | string | BN)> } receiverParams,
   * @returns { Result<Result<null, ReturnTypes.FlashLoanReceiverError>, ReturnTypes.LangError> }
   */
  executeOperation(
    assets: Array<ArgumentTypes.AccountId>,
    amounts: Array<string | number | BN>,
    fees: Array<string | number | BN>,
    receiverParams: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.FlashLoanReceiverError>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'flashLoanReceiver::executeOperation',
      [assets, amounts, fees, receiverParams],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(13, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }
}
