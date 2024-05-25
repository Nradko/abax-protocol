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
import type * as ArgumentTypes from '../types-arguments/flash_loan_receiver_mock';
import type * as ReturnTypes from '../types-returns/flash_loan_receiver_mock';
import type BN from 'bn.js';
import { getTypeDescription } from '../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/flash_loan_receiver_mock.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/flash_loan_receiver_mock.json';
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
   * setFailExecuteOperation
   *
   * @param { boolean } shouldFailExecuteOperation,
   * @returns { void }
   */
  setFailExecuteOperation(shouldFailExecuteOperation: boolean, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'setFailExecuteOperation',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [shouldFailExecuteOperation],
      __options,
    );
  }

  /**
   * setCustomAmountToApprove
   *
   * @param { (string | number | BN) } customAmountToApprove,
   * @returns { void }
   */
  setCustomAmountToApprove(customAmountToApprove: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'setCustomAmountToApprove',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [customAmountToApprove],
      __options,
    );
  }

  /**
   * setSimulateBalanceToCoverFee
   *
   * @param { boolean } simulateBalanceToCoverFee,
   * @returns { void }
   */
  setSimulateBalanceToCoverFee(simulateBalanceToCoverFee: boolean, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'setSimulateBalanceToCoverFee',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [simulateBalanceToCoverFee],
      __options,
    );
  }

  /**
   * executeOperation
   *
   * @param { Array<ArgumentTypes.AccountId> } assets,
   * @param { Array<(string | number | BN)> } amounts,
   * @param { Array<(string | number | BN)> } fees,
   * @param { Array<(number | string | BN)> } receiverParams,
   * @returns { void }
   */
  executeOperation(
    assets: Array<ArgumentTypes.AccountId>,
    amounts: Array<string | number | BN>,
    fees: Array<string | number | BN>,
    receiverParams: Array<number | string | BN>,
    __options: ContractOptions,
  ) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'flashLoanReceiver::executeOperation',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [assets, amounts, fees, receiverParams],
      __options,
    );
  }
}
