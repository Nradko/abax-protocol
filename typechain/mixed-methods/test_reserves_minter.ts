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
import type * as ArgumentTypes from '../types-arguments/test_reserves_minter';
import type * as ReturnTypes from '../types-returns/test_reserves_minter';
import type BN from 'bn.js';
import { getTypeDescription } from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/test_reserves_minter.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/test_reserves_minter.json';
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
   * mint
   *
   * @param { Array<[ArgumentTypes.AccountId, (string | number | BN)]> } addresesWithAmounts,
   * @param { ArgumentTypes.AccountId } to,
   * @returns { void }
   */
  mint(addresesWithAmounts: Array<[ArgumentTypes.AccountId, string | number | BN]>, to: ArgumentTypes.AccountId, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'mint',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [addresesWithAmounts, to],
      __options,
    );
  }

  /**
   * owner
   *
   * @returns { Result<ReturnTypes.AccountId | null, ReturnTypes.LangError> }
   */
  owner(__options: ContractOptions): Promise<QueryReturnType<Result<ReturnTypes.AccountId | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'ownable::owner', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(28, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * renounceOwnership
   *
   * @returns { void }
   */
  renounceOwnership(__options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'ownable::renounceOwnership',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [],
      __options,
    );
  }

  /**
   * transferOwnership
   *
   * @param { ArgumentTypes.AccountId } newOwner,
   * @returns { void }
   */
  transferOwnership(newOwner: ArgumentTypes.AccountId, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'ownable::transferOwnership',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [newOwner],
      __options,
    );
  }
}
