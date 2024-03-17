import { ReserveAbacusTokens } from 'typechain/types-returns/lending_pool';
import ATokenContract from 'typechain/contracts/a_token';
import VTokenContract from 'typechain/contracts/v_token';
import { KeyringPair } from '@polkadot/keyring/types';
import LendingPoolContract from 'typechain/contracts/lending_pool';
import { getContractObject } from 'wookashwackomytest-contract-helpers';
import { apiProviderWrapper } from 'tests/setup/helpers';

type PSP22Metadata = {
  name: string;
  symbol: string;
  decimals: string;
};

type AbacusTokensMetadata = {
  aToken: {
    address: string;
    metadata: PSP22Metadata;
  };
  vToken: {
    address: string;
    metadata: PSP22Metadata;
  };
};

export async function getAbaxTokenMetadata(
  signer: KeyringPair,
  lendingPool: LendingPoolContract,
  assetAddress: string,
): Promise<AbacusTokensMetadata> {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const reserveTokens: ReserveAbacusTokens = (await lendingPool.query.viewReserveTokens(assetAddress)).value.ok!;
  const AToken = await getContractObject(ATokenContract, reserveTokens.aTokenAddress as string, signer, api);
  const VToken = await getContractObject(VTokenContract, reserveTokens.vTokenAddress as string, signer, api);

  const ATokenData = {
    name: (await AToken.query.tokenName()).value.ok!,
    symbol: (await AToken.query.tokenSymbol()).value.ok!,
    decimals: (await AToken.query.tokenDecimals()).value.ok!.toString(),
  };

  const VTokenData = {
    name: (await VToken.query.tokenName()).value.ok!,
    symbol: (await VToken.query.tokenSymbol()).value.ok!,
    decimals: (await VToken.query.tokenDecimals()).value.ok!.toString(),
  };

  return { aToken: { address: AToken.address, metadata: ATokenData }, vToken: { address: VToken.address, metadata: VTokenData } };
}
