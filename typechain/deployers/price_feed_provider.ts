import { CodePromise } from '@polkadot/api-contract';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import { genValidContractOptionsWithValue, _signAndSend, SignAndSendSuccessResponse } from '@c-forge/typechain-types';
import type { ContractOptions } from '@polkadot/api-contract/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type * as ArgumentTypes from '../types-arguments/price_feed_provider';
import PriceFeedProvider from '../contracts/price_feed_provider';
import { getContractObjectWrapper } from '../shared/utils';
import type BN from 'bn.js';
import FsAPI from 'fs';
import PathAPI from 'path';

const fileName = 'price_feed_provider';

export default class PriceFeedProviderDeployer {
  readonly nativeAPI: ApiPromise;
  readonly signer: KeyringPair;

  constructor(nativeAPI: ApiPromise, signer: KeyringPair) {
    this.nativeAPI = nativeAPI;
    this.signer = signer;
  }

  private getWasm() {
    try {
      return FsAPI.readFileSync(PathAPI.resolve(__dirname, `../artifacts/${fileName}.wasm`));
    } catch (_) {
      console.warn(`No wasm file found for ${fileName}`);
    }
    const contractFileParsed = JSON.parse(FsAPI.readFileSync(PathAPI.resolve(__dirname, `../artifacts/${fileName}.contract`)).toString());
    return contractFileParsed.source.wasm;
  }

  /**
   * new
   *
   * @param { ArgumentTypes.AccountId } oracle,
   */
  async new(oracle: ArgumentTypes.AccountId, __options?: ContractOptions) {
    const abi = JSON.parse(FsAPI.readFileSync(PathAPI.resolve(__dirname, `../artifacts/${fileName}.json`)).toString());

    const wasm = this.getWasm();
    const codePromise = new CodePromise(this.nativeAPI, abi, wasm);
    const gasLimit = (await genValidContractOptionsWithValue(this.nativeAPI, __options)).gasLimit as WeightV2 as any;

    const storageDepositLimit = __options?.storageDepositLimit;
    const tx = codePromise.tx['new']!({ gasLimit, storageDepositLimit, value: __options?.value }, oracle);
    let response;

    try {
      response = await _signAndSend(this.nativeAPI.registry, tx, this.signer, (event: any) => event);
    } catch (error) {
      console.log(error);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const address = (response as SignAndSendSuccessResponse)!.result!.contract.address.toString();

    const contractObj = getContractObjectWrapper(this.nativeAPI, PriceFeedProvider, address, this.signer);
    return {
      result: response as SignAndSendSuccessResponse,
      contract: contractObj,
    };
  }
}
