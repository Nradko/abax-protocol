import { ApiPromise } from '@polkadot/api';
import { CodePromise, ContractPromise } from '@polkadot/api-contract';
import { CodeSubmittableResult } from '@polkadot/api-contract/base';
import { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import fs, { readFileSync } from 'fs-extra';
import path from 'path';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import ATokenContract from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import PSP22Ownable from 'typechain/contracts/psp22_ownable';
import StableToken from 'typechain/contracts/stable_token';
import TestReservesMinter from 'typechain/contracts/test_reserves_minter';
import VTokenContract from 'typechain/contracts/v_token';
import BalanceViewer from 'typechain/contracts/balance_viewer';
import DiaOracleContract from 'typechain/contracts/dia_oracle';
import PriceFeedProviderContract from 'typechain/contracts/price_feed_provider';

import FlashLoanReceiverMockConstructor from 'typechain/constructors/flash_loan_receiver_mock';
import PSP22EmitableConstructor from 'typechain/constructors/psp22_emitable';
import PSP22OwnableConstructor from 'typechain/constructors/psp22_ownable';
import StableTokenConstructor from 'typechain/constructors/stable_token';
import TestReservesMinterConstructor from 'typechain/constructors/test_reserves_minter';
import BalanceViewerConstructor from 'typechain/constructors/balance_viewer';
import LendingPoolConstructor from 'typechain/constructors/lending_pool';
import ATokenConstructor from 'typechain/constructors/a_token';
import VTokenConstructor from 'typechain/constructors/v_token';
import DIAOracleConstructor from 'typechain/constructors/dia_oracle';
import PriceFeedProviderConstructor from 'typechain/constructors/price_feed_provider';

import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './helpers';
import { MOCK_CHAINLINK_AGGREGATORS_PRICES, ReserveTokenDeploymentData } from './testEnvConsts';
import { toE6 } from '@abaxfinance/utils';
import { AbiMessage } from '@polkadot/api-contract/types';
import { SignAndSendSuccessResponse, _genValidGasLimitAndValue, _signAndSend } from 'wookashwackomytest-typechain-types';
import { saveContractInfoToFileAsJson } from './nodePersistence';
import { InterestRateModel, TokensToDeployForTesting } from './tokensToDeployForTesting.types';
import { TOKENS_TO_DEPLOY_FOR_TESTING } from './tokensToDeployForTesting';
import { BURNER, MINTER, ROLES } from 'tests/consts';
import { ReserveFees } from 'typechain/types-arguments/balance_viewer';
import { AssetRules, ReserveRestrictions } from 'typechain/types-arguments/lending_pool';
import { getContractObject } from '@abaxfinance/contract-helpers';
import { getLineSeparator } from 'scripts/compile/common';

const getCodePromise = (api: ApiPromise, contractName: string): CodePromise => {
  const abi = JSON.parse(readFileSync(`./artifacts/${contractName}.json`).toString());
  const wasm = readFileSync(`./artifacts/${contractName}.wasm`);

  return new CodePromise(api, abi, wasm);
};

export const setupContract = async (signer: KeyringPair, contractName: string, constructorName: string, ...constructorArgs: any[]) => {
  // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.\
  // eslint-disable-next-line no-magic-numbers
  const MAX_CALL_WEIGHT = new BN(5_000_000_000).isubn(1);
  // eslint-disable-next-line no-magic-numbers
  const PROOFSIZE = new BN(3_000_000);

  const api = await apiProviderWrapper.getAndWaitForReady();
  const codePromise = getCodePromise(api, contractName);
  const gasLimit = api?.registry.createType('WeightV2', {
    refTime: MAX_CALL_WEIGHT,
    proofSize: PROOFSIZE,
  }) as WeightV2;

  // const milion = 1000000n;
  // const gasLimit = milion * milion;
  // const gasLimit = 3000n * 1000000n;
  // const gasLimitFromNetwork = api.consts.system.blockWeights
  //   ? (api.consts.system.blockWeights as unknown as { maxBlock: WeightV1 }).maxBlock
  //   : (api.consts.system.maximumBlockWeight as unknown as WeightV1);
  // // a limit to how much Balance to be used to pay for the storage created by the instantiation
  // if null is passed, unlimited balance can be used

  // const storageDepositLimit = null;

  // used to derive contract address,
  // use null to prevent duplicate contracts
  // const salt = new Uint8Array();

  const deployedContract = await new Promise<ContractPromise>((resolve, reject) => {
    let unsub: () => void;
    const tx = codePromise.tx[constructorName](
      {
        storageDepositLimit: null,
        // gasLimit: new BN(gasLimitFromNetwork.toString()).divn(2),
        gasLimit,
        salt: undefined,
        value: undefined,
      },
      ...constructorArgs,
    );
    tx.signAndSend(signer, (result: CodeSubmittableResult<'promise'>) => {
      const { status, dispatchError, contract } = result;
      if (status.isInBlock) {
        if (dispatchError || !contract) {
          reject(dispatchError?.toString());
        } else {
          resolve(contract);
        }

        unsub();
      }
    })
      .then((_unsub) => {
        unsub = _unsub;
      })
      .catch(reject);
  });

  return { signer, deployedContract };
};

export const deployWithLog = async <T>(
  signer: KeyringPair,
  constructor: new (address: string, contractSigner: KeyringPair, nativeAPI: ApiPromise) => T,
  contractName: string,
  ...deployArgs
) => {
  const ret = await setupContract(signer, contractName, 'new', ...deployArgs);
  if (process.env.DEBUG) console.log(`Deployed ${contractName}: ${ret.deployedContract.address.toString()}`);
  return getContractObjectWrapper<T>(constructor, ret.deployedContract.address.toString(), ret.signer);
};

export const deployLendingPool = async (owner: KeyringPair) => {
  const deployRet = await new LendingPoolConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObjectWrapper(LendingPool, deployRet.address, owner);
};
export const deployDiaOracle = async (owner: KeyringPair) => {
  const deployRet = await new DIAOracleConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObjectWrapper(DiaOracleContract, deployRet.address, owner);
};

export const deployPriceFeedProvider = async (owner: KeyringPair, oracle: string) => {
  const deployRet = await new PriceFeedProviderConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(oracle);
  return getContractObjectWrapper(PriceFeedProviderContract, deployRet.address, owner);
};

export const deployAToken = async (
  owner: KeyringPair,
  name: string,
  symbol: string,
  decimal: number,
  lendingPoolAddress: string,
  underlyingAssetAddress: string,
) => {
  const deployRet = await new ATokenConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    symbol,
    decimal,
    lendingPoolAddress,
    underlyingAssetAddress,
  );
  return getContractObjectWrapper(ATokenContract, deployRet.address, owner);
};

export const deployVToken = async (
  owner: KeyringPair,
  name: string,
  symbol: string,
  decimal: number,
  lendingPoolAddress: string,
  underlyingAssetAddress: string,
) => {
  const deployRet = await new VTokenConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    symbol,
    decimal,
    lendingPoolAddress,
    underlyingAssetAddress,
  );
  return getContractObjectWrapper(VTokenContract, deployRet.address, owner);
};

export const deployEmitableToken = async (owner: KeyringPair, name: string, decimals: number = 6) => {
  const deployRet = await new PSP22EmitableConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    `Reserve ${name} token `,
    decimals,
  );
  return getContractObjectWrapper(PSP22Emitable, deployRet.address, owner);
};
export const deployOwnableToken = async (owner: KeyringPair, name: string, decimals: number = 6, tokenOwnerAddress: string) => {
  const deployRet = await new PSP22OwnableConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    `Reserve ${name} token `,
    decimals,
    tokenOwnerAddress,
  );
  return getContractObjectWrapper(PSP22Ownable, deployRet.address, owner);
};
export const deployStableToken = async (owner: KeyringPair, name: string, decimals: number = 6) => {
  const deployRet = await new StableTokenConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    `Reserve ${name} token `,
    decimals,
  );
  return getContractObjectWrapper(StableToken, deployRet.address, owner);
};

export const deployTestReservesMinter = async (owner: KeyringPair) => {
  const deployRet = await new TestReservesMinterConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObjectWrapper(TestReservesMinter, deployRet.address, owner);
};

export const deployFlashLoanReceiverMock = async (owner: KeyringPair) => {
  const deployRet = await new FlashLoanReceiverMockConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObjectWrapper(FlashLoanReceiverMock, deployRet.address, owner);
};
export const deployBalanceViewer = async (owner: KeyringPair, lendingPoolAddress: string) => {
  const deployRet = await new BalanceViewerConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(lendingPoolAddress);
  return getContractObjectWrapper(BalanceViewer, deployRet.address, owner);
};

const getContractObjectWrapper = async <T>(
  constructor: new (address: string, signer: KeyringPair, api: ApiPromise) => T,
  contractAddress: string,
  signerPair: KeyringPair,
) => getContractObject(constructor, contractAddress, signerPair, await apiProviderWrapper.getAndWaitForReady());

export async function deployCoreContracts(
  owner: KeyringPair,
  oracle: string,
): Promise<{
  priceFeedProvider: PriceFeedProviderContract;
  lendingPool: LendingPool;
  aTokenCodeHash: string;
  vTokenCodeHash: string;
}> {
  if (process.env.DEBUG) {
    console.log(getLineSeparator());
    console.log('Deploying contracts');
    console.log(getLineSeparator());
    console.log(`Deployer: ${owner.address}`);
  }
  const priceFeedProvider = await deployPriceFeedProvider(owner, oracle);

  const aTokenContract = await deployAToken(owner, 'Abacus Deposit Token', 'AToken', 0, owner.address, owner.address);
  const vTokenContract = await deployVToken(owner, 'Abacus Debt Token', 'VToken', 0, owner.address, owner.address);

  const api = await apiProviderWrapper.getAndWaitForReady();
  const { codeHash: aTokenCodeHashHex } = (await api.query.contracts.contractInfoOf(aTokenContract.address)).toHuman() as { codeHash: string };
  const { codeHash: vTokenCodeHashHex } = (await api.query.contracts.contractInfoOf(vTokenContract.address)).toHuman() as { codeHash: string };
  const aTokenCodeHash = aTokenCodeHashHex; //hexToBytes(aTokenCodeHashHex);
  const vTokenCodeHash = vTokenCodeHashHex; //hexToBytes(vTokenCodeHashHex);

  const lendingPool = await deployLendingPool(owner);
  return { priceFeedProvider, lendingPool, aTokenCodeHash, vTokenCodeHash };
}

export interface ProductionDeploymentParams {
  owner: KeyringPair;

  reserveDatas: ReserveTokenDeploymentData[];
}

export type DeploymentConfig = {
  testTokensToDeploy: TokensToDeployForTesting;
  priceOverridesE18: Record<string, string>;
  owner: KeyringPair;
  users: KeyringPair[];
};
export const DEFAULT_TEST_DEPLOYMENT_CONFIG: DeploymentConfig = {
  testTokensToDeploy: TOKENS_TO_DEPLOY_FOR_TESTING,
  priceOverridesE18: MOCK_CHAINLINK_AGGREGATORS_PRICES,
  owner: getSigners()[0],
  users: getSignersWithoutOwner(getSigners(), 0),
};

export const deployAndConfigureSystem = async (
  deploymentConfigOverrides: Partial<DeploymentConfig> = DEFAULT_TEST_DEPLOYMENT_CONFIG,
  saveConfigToFilePath?: string,
): Promise<TestEnv> => {
  const config: DeploymentConfig = {
    ...DEFAULT_TEST_DEPLOYMENT_CONFIG,
    ...deploymentConfigOverrides,
    priceOverridesE18: {
      ...MOCK_CHAINLINK_AGGREGATORS_PRICES,
      ...deploymentConfigOverrides.priceOverridesE18,
    },
  };

  const { owner, users, testTokensToDeploy, priceOverridesE18: prices } = config;

  const oracle = await deployDiaOracle(owner);

  const contracts = await deployCoreContracts(owner, oracle.address);

  await contracts.lendingPool.withSigner(owner).tx.grantRole(ROLES['ASSET_LISTING_ADMIN'], owner.address);
  await contracts.lendingPool.withSigner(owner).tx.grantRole(ROLES['PARAMETERS_ADMIN'], owner.address);
  await contracts.lendingPool.withSigner(owner).tx.grantRole(ROLES['STABLECOIN_RATE_ADMIN'], owner.address);
  await contracts.lendingPool.withSigner(owner).tx.grantRole(ROLES['EMERGENCY_ADMIN'], owner.address);

  await contracts.lendingPool.withSigner(owner).tx.setPriceFeedProvider(contracts.priceFeedProvider.address);

  await contracts.lendingPool.withSigner(owner).query.addMarketRule([]);
  await contracts.lendingPool.withSigner(owner).tx.addMarketRule([]);

  const reservesWithLendingTokens = {} as TestEnv['reserves'];
  for (const reserveData of testTokensToDeploy.reserveTokens) {
    const reserve = await deployEmitableToken(owner, reserveData.metadata.name, reserveData.metadata.decimals);
    if (process.env.DEBUG) console.log(`${reserveData.metadata.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      owner,
      contracts.lendingPool,
      reserve.address,
      contracts.aTokenCodeHash,
      contracts.vTokenCodeHash,
      reserveData.metadata.name,
      reserveData.metadata.symbol,
      reserveData.metadata.decimals,
      reserveData.defaultRule,
      reserveData.restrictions,
      reserveData.fees,
      reserveData.interestRateModelE18,
    );
    await contracts.priceFeedProvider.tx.setAccountSymbol(reserve.address, reserveData.metadata.name + '/USD');
    await oracle.tx.setPrice(reserveData.metadata.name + '/USD', prices[reserveData.metadata.name]);
    reservesWithLendingTokens[reserveData.metadata.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.metadata.decimals,
    };
  }

  const stablesWithLendingTokens = {} as TestEnv['stables'];
  for (const stableData of testTokensToDeploy.stableTokens) {
    const reserve = await deployStableToken(owner, stableData.metadata.name, stableData.metadata.decimals);
    await reserve.withSigner(owner).tx.grantRole(MINTER, contracts.lendingPool.address);
    await reserve.withSigner(owner).tx.grantRole(BURNER, contracts.lendingPool.address);

    if (process.env.DEBUG) console.log(`${stableData.metadata.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      owner,
      contracts.lendingPool,
      reserve.address,
      contracts.aTokenCodeHash,
      contracts.vTokenCodeHash,
      stableData.metadata.name,
      stableData.metadata.symbol,
      stableData.metadata.decimals,
      stableData.defaultRule,
      stableData.restrictions,
      stableData.fees,
      null,
    );
    await contracts.priceFeedProvider.tx.setAccountSymbol(reserve.address, stableData.metadata.name + '/USD');
    await oracle.tx.setPrice(stableData.metadata.name + '/USD', prices[stableData.metadata.name]);
    if (stableData.debtRate) {
      await contracts.lendingPool.withSigner(owner).tx.setStablecoinDebtRateE18(reserve.address, stableData.debtRate);
    }

    stablesWithLendingTokens[stableData.metadata.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: stableData.metadata.decimals,
    };
  }

  if (process.env.DEBUG) console.log('Asset rules added');
  const balanceViewer = await deployBalanceViewer(owner, contracts.lendingPool.address);
  const testEnv = {
    priceFeedProvider: contracts.priceFeedProvider,
    oracle: oracle,
    users: users,
    owner,
    lendingPool: contracts.lendingPool,
    reserves: reservesWithLendingTokens,
    stables: stablesWithLendingTokens,
    aTokenCodeHash: contracts.aTokenCodeHash,
    vTokenCodeHash: contracts.vTokenCodeHash,
    balanceViewer,
  };

  if (saveConfigToFilePath) {
    await saveConfigToFile(testEnv, saveConfigToFilePath);
  }
  return testEnv;
};

async function saveConfigToFile(testEnv: TestEnv, writePath: string) {
  await saveContractInfoToFileAsJson(
    [
      {
        name: testEnv.lendingPool.name,
        address: testEnv.lendingPool.address,
      },
      {
        name: testEnv.priceFeedProvider.name,
        address: testEnv.priceFeedProvider.address,
      },
      {
        name: testEnv.oracle.name,
        address: testEnv.oracle.address,
      },
      ...Object.entries(testEnv.reserves).flatMap(([reserveName, r]) =>
        [r.underlying, r.aToken, r.vToken].map((c) => ({
          name: c.name,
          address: c.address,
          reserveName,
        })),
      ),
      ...Object.entries(testEnv.stables).flatMap(([stableName, r]) =>
        [r.underlying, r.aToken, r.vToken].map((c) => ({
          name: c.name,
          address: c.address,
          stableName,
        })),
      ),
      {
        name: testEnv.balanceViewer.name,
        address: testEnv.balanceViewer.address,
      },
      {
        name: 'aTokenCodeHash',
        codeHash: testEnv.aTokenCodeHash,
      },
      {
        name: 'vTokenCodeHash',
        codeHash: testEnv.aTokenCodeHash,
      },
    ],
    writePath,
  );
}

export async function registerNewAsset(
  owner: KeyringPair,
  lendingPool: LendingPool,
  assetAddress: string,
  aTokenCodeHash: string,
  vTokenCodeHash: string,
  name: string,
  symbol: string,
  decimals: number,
  assetRules: AssetRules,
  restrictions: ReserveRestrictions,
  fees: ReserveFees,
  interestRateModel: InterestRateModel | null,
): Promise<{ aToken: ATokenContract; vToken: VTokenContract }> {
  const registerAssetArgs: Parameters<typeof lendingPool.query.registerAsset> = [
    assetAddress,
    aTokenCodeHash as any,
    vTokenCodeHash as any,
    name,
    symbol,
    decimals,
    assetRules,
    restrictions,
    fees,
    interestRateModel,
  ];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  try {
    const res = await lendingPool.query.registerAsset(...registerAssetArgs);
  } catch (err) {
    console.log(err);
  }
  await lendingPool.withSigner(owner).tx.registerAsset(...registerAssetArgs);

  const tokenAdresses = (await lendingPool.query.viewReserveTokens(assetAddress)).value.ok!;
  const aToken = await getContractObjectWrapper(ATokenContract, tokenAdresses.aTokenAddress.toString(), owner);
  const vToken = await getContractObjectWrapper(VTokenContract, tokenAdresses.vTokenAddress.toString(), owner);
  return { aToken, vToken };
}
