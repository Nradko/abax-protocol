/* This file is auto-generated */
// @ts-nocheck

import type { ContractPromise } from '@polkadot/api-contract';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { ContractOptionsWithRequiredValue } from '@c-forge/typechain-types';
import { buildSubmittableExtrinsic } from '@c-forge/typechain-types';
import type * as ArgumentTypes from '../types-arguments/test_reserves_minter';
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
   * mint
   *
   * @param { Array<[ArgumentTypes.AccountId, (string | number | BN)]> } addresesWithAmounts,
   * @param { ArgumentTypes.AccountId } to,
   */
  mint(addresesWithAmounts: Array<[ArgumentTypes.AccountId, string | number | BN]>, to: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'mint', [addresesWithAmounts, to], __options);
  }

  /**
   * owner
   *
   */
  owner(__options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'ownable::owner', [], __options);
  }

  /**
   * renounceOwnership
   *
   */
  renounceOwnership(__options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'ownable::renounceOwnership', [], __options);
  }

  /**
   * transferOwnership
   *
   * @param { ArgumentTypes.AccountId } newOwner,
   */
  transferOwnership(newOwner: ArgumentTypes.AccountId, __options: ContractOptions) {
    return buildSubmittableExtrinsic(this.__apiPromise, this.__nativeContract, 'ownable::transferOwnership', [newOwner], __options);
  }
}
