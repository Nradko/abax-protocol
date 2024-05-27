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
import type * as ArgumentTypes from '../types-arguments/stable_token';
import type * as ReturnTypes from '../types-returns/stable_token';
import type BN from 'bn.js';
import { getTypeDescription } from './../shared/utils';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { EventRecord } from '@polkadot/types/interfaces';
import { decodeEvents } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/stable_token.json';
import EVENT_DATA_TYPE_DESCRIPTIONS from '../event-data/stable_token.json';
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
   * totalSupply
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  totalSupply(__options: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22::totalSupply', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * balanceOf
   *
   * @param { ArgumentTypes.AccountId } owner,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  balanceOf(owner: ArgumentTypes.AccountId, __options: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22::balanceOf', [owner], __options, (result) => {
      return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * allowance
   *
   * @param { ArgumentTypes.AccountId } owner,
   * @param { ArgumentTypes.AccountId } spender,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  allowance(
    owner: ArgumentTypes.AccountId,
    spender: ArgumentTypes.AccountId,
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22::allowance', [owner, spender], __options, (result) => {
      return handleReturnType(result, getTypeDescription(49, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * transfer
   *
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } value,
   * @param { Array<(number | string | BN)> } data,
   * @returns { void }
   */
  transfer(to: ArgumentTypes.AccountId, value: string | number | BN, data: Array<number | string | BN>, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22::transfer',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [to, value, data],
      __options,
    );
  }

  /**
   * transferFrom
   *
   * @param { ArgumentTypes.AccountId } from,
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } value,
   * @param { Array<(number | string | BN)> } data,
   * @returns { void }
   */
  transferFrom(
    from: ArgumentTypes.AccountId,
    to: ArgumentTypes.AccountId,
    value: string | number | BN,
    data: Array<number | string | BN>,
    __options: ContractOptions,
  ) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22::transferFrom',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [from, to, value, data],
      __options,
    );
  }

  /**
   * approve
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } value,
   * @returns { void }
   */
  approve(spender: ArgumentTypes.AccountId, value: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22::approve',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [spender, value],
      __options,
    );
  }

  /**
   * increaseAllowance
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } deltaValue,
   * @returns { void }
   */
  increaseAllowance(spender: ArgumentTypes.AccountId, deltaValue: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22::increaseAllowance',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [spender, deltaValue],
      __options,
    );
  }

  /**
   * decreaseAllowance
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } deltaValue,
   * @returns { void }
   */
  decreaseAllowance(spender: ArgumentTypes.AccountId, deltaValue: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22::decreaseAllowance',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [spender, deltaValue],
      __options,
    );
  }

  /**
   * tokenName
   *
   * @returns { Result<string | null, ReturnTypes.LangError> }
   */
  tokenName(__options: ContractOptions): Promise<QueryReturnType<Result<string | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Metadata::tokenName', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(54, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * tokenSymbol
   *
   * @returns { Result<string | null, ReturnTypes.LangError> }
   */
  tokenSymbol(__options: ContractOptions): Promise<QueryReturnType<Result<string | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Metadata::tokenSymbol', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(54, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * tokenDecimals
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  tokenDecimals(__options: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Metadata::tokenDecimals', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(55, DATA_TYPE_DESCRIPTIONS));
    });
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
    __options: ContractOptions,
  ): Promise<QueryReturnType<Result<boolean, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'accessControl::hasRole',
      [role, address],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(56, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * getRoleAdmin
   *
   * @param { (number | string | BN) } role,
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  getRoleAdmin(role: number | string | BN, __options: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'accessControl::getRoleAdmin', [role], __options, (result) => {
      return handleReturnType(result, getTypeDescription(58, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * grantRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { void }
   */
  grantRole(role: number | string | BN, account: ArgumentTypes.AccountId | null, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'accessControl::grantRole',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [role, account],
      __options,
    );
  }

  /**
   * revokeRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { void }
   */
  revokeRole(role: number | string | BN, account: ArgumentTypes.AccountId | null, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'accessControl::revokeRole',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [role, account],
      __options,
    );
  }

  /**
   * renounceRole
   *
   * @param { (number | string | BN) } role,
   * @param { ArgumentTypes.AccountId | null } account,
   * @returns { void }
   */
  renounceRole(role: number | string | BN, account: ArgumentTypes.AccountId | null, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'accessControl::renounceRole',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [role, account],
      __options,
    );
  }

  /**
   * setRoleAdmin
   *
   * @param { (number | string | BN) } role,
   * @param { (number | string | BN) } newAdmin,
   * @returns { void }
   */
  setRoleAdmin(role: number | string | BN, newAdmin: number | string | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'accessControl::setRoleAdmin',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [role, newAdmin],
      __options,
    );
  }

  /**
   * mint
   *
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } amount,
   * @returns { void }
   */
  mint(to: ArgumentTypes.AccountId, amount: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22Mintable::mint',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [to, amount],
      __options,
    );
  }

  /**
   * burn
   *
   * @param { ArgumentTypes.AccountId } from,
   * @param { (string | number | BN) } amount,
   * @returns { void }
   */
  burn(from: ArgumentTypes.AccountId, amount: string | number | BN, __options: ContractOptions) {
    return txSignAndSend(
      this.__apiPromise,
      this.__nativeContract,
      this.__keyringPair,
      'psp22Burnable::burn',
      (events: EventRecord[]) => {
        return decodeEvents(events, this.__nativeContract, EVENT_DATA_TYPE_DESCRIPTIONS);
      },
      [from, amount],
      __options,
    );
  }
}
