/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ApiPromise } from '@polkadot/api';
import type { ContractOptionsWithRequiredValue, Result } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { QueryReturnType } from '@c-forge/typechain-types';
import { queryJSON, queryOkJSON, handleReturnType } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/stable_token';
import type * as ReturnTypes from '../types-returns/stable_token';
import type BN from 'bn.js';
import { getTypeDescription } from '../shared/utils';
import DATA_TYPE_DESCRIPTIONS from '../data/stable_token.json';
import { bnToBn } from '@polkadot/util';

export default class StableTokenMethods {
  readonly __nativeContract: ContractPromise;
  readonly __apiPromise: ApiPromise;
  readonly __callerAddress: string;

  constructor(nativeContract: ContractPromise, nativeApi: ApiPromise, callerAddress: string) {
    this.__nativeContract = nativeContract;
    this.__callerAddress = callerAddress;
    this.__apiPromise = nativeApi;
  }

  /**
   * totalSupply
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  totalSupply(__options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
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
  balanceOf(owner: ArgumentTypes.AccountId, __options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
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
    __options?: ContractOptions,
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
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  transfer(
    to: ArgumentTypes.AccountId,
    value: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22::transfer', [to, value, data], __options, (result) => {
      return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * transferFrom
   *
   * @param { ArgumentTypes.AccountId } from,
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } value,
   * @param { Array<(number | string | BN)> } data,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  transferFrom(
    from: ArgumentTypes.AccountId,
    to: ArgumentTypes.AccountId,
    value: string | number | BN,
    data: Array<number | string | BN>,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'psp22::transferFrom',
      [from, to, value, data],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * approve
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } value,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  approve(
    spender: ArgumentTypes.AccountId,
    value: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22::approve', [spender, value], __options, (result) => {
      return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * increaseAllowance
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } deltaValue,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  increaseAllowance(
    spender: ArgumentTypes.AccountId,
    deltaValue: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'psp22::increaseAllowance',
      [spender, deltaValue],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * decreaseAllowance
   *
   * @param { ArgumentTypes.AccountId } spender,
   * @param { (string | number | BN) } deltaValue,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  decreaseAllowance(
    spender: ArgumentTypes.AccountId,
    deltaValue: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(
      this.__apiPromise,
      this.__nativeContract,
      this.__callerAddress,
      'psp22::decreaseAllowance',
      [spender, deltaValue],
      __options,
      (result) => {
        return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * tokenName
   *
   * @returns { Result<string | null, ReturnTypes.LangError> }
   */
  tokenName(__options?: ContractOptions): Promise<QueryReturnType<Result<string | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Metadata::tokenName', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(54, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * tokenSymbol
   *
   * @returns { Result<string | null, ReturnTypes.LangError> }
   */
  tokenSymbol(__options?: ContractOptions): Promise<QueryReturnType<Result<string | null, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Metadata::tokenSymbol', [], __options, (result) => {
      return handleReturnType(result, getTypeDescription(54, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * tokenDecimals
   *
   * @returns { Result<BN, ReturnTypes.LangError> }
   */
  tokenDecimals(__options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
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
  getRoleAdmin(role: number | string | BN, __options?: ContractOptions): Promise<QueryReturnType<Result<BN, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'accessControl::getRoleAdmin', [role], __options, (result) => {
      return handleReturnType(result, getTypeDescription(58, DATA_TYPE_DESCRIPTIONS));
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
        return handleReturnType(result, getTypeDescription(59, DATA_TYPE_DESCRIPTIONS));
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
        return handleReturnType(result, getTypeDescription(59, DATA_TYPE_DESCRIPTIONS));
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
        return handleReturnType(result, getTypeDescription(59, DATA_TYPE_DESCRIPTIONS));
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
        return handleReturnType(result, getTypeDescription(59, DATA_TYPE_DESCRIPTIONS));
      },
    );
  }

  /**
   * mint
   *
   * @param { ArgumentTypes.AccountId } to,
   * @param { (string | number | BN) } amount,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  mint(
    to: ArgumentTypes.AccountId,
    amount: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Mintable::mint', [to, amount], __options, (result) => {
      return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
    });
  }

  /**
   * burn
   *
   * @param { ArgumentTypes.AccountId } from,
   * @param { (string | number | BN) } amount,
   * @returns { Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError> }
   */
  burn(
    from: ArgumentTypes.AccountId,
    amount: string | number | BN,
    __options?: ContractOptions,
  ): Promise<QueryReturnType<Result<Result<null, ReturnTypes.PSP22Error>, ReturnTypes.LangError>>> {
    return queryOkJSON(this.__apiPromise, this.__nativeContract, this.__callerAddress, 'psp22Burnable::burn', [from, amount], __options, (result) => {
      return handleReturnType(result, getTypeDescription(51, DATA_TYPE_DESCRIPTIONS));
    });
  }
}
