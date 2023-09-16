import { ApiPromise } from '@polkadot/api';
import { CodePromise, ContractPromise } from '@polkadot/api-contract';
import { CodeSubmittableResult } from '@polkadot/api-contract/base';
import { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import fs, { readFileSync } from 'fs-extra';
import path from 'path';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import { FacetCut } from 'typechain/types-arguments/diamond';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import ATokenContract from 'typechain/contracts/a_token';
import BlockTimestampProvider from 'typechain/contracts/block_timestamp_provider';
import DiamondContract from 'typechain/contracts/diamond';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import PSP22Ownable from 'typechain/contracts/psp22_ownable';
import TestReservesMinter from 'typechain/contracts/test_reserves_minter';
import VTokenContract from 'typechain/contracts/v_token';
import BalanceViewer from 'typechain/contracts/balance_viewer';
// import TestPSP22FacetV1 from 'typechain/contracts/test_psp22_facet_v1';

import FlashLoanReceiverMockConstructor from 'typechain/constructors/flash_loan_receiver_mock';
import ATokenContractConstructor from 'typechain/constructors/a_token';
import BlockTimestampProviderConstructor from 'typechain/constructors/block_timestamp_provider';
import DiamondContractConstructor from 'typechain/constructors/diamond';
import LendingPoolConstructor from 'typechain/constructors/lending_pool';
// import TestPSP22FacetV1Constructor from 'typechain/constructors/test_psp22_facet_v1';
import PSP22EmitableConstructor from 'typechain/constructors/psp22_emitable';
import PSP22OwnableConstructor from 'typechain/constructors/psp22_ownable';
import TestReservesMinterConstructor from 'typechain/constructors/test_reserves_minter';
import VTokenContractConstructor from 'typechain/constructors/v_token';
import BalanceViewerConstructor from 'typechain/constructors/balance_viewer';

import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './helpers';
import { saveContractInfoToFileAsJson } from './nodePersistence';
import { MOCK_CHAINLINK_AGGREGATORS_PRICES, ReserveTokenDeploymentData } from './testEnvConsts';
import { toE6 } from '@abaxfinance/utils';
import { getLineSeparator } from 'tests/scenarios/utils/misc';
import { AbiMessage } from '@polkadot/api-contract/types';
import { SignAndSendSuccessResponse, _genValidGasLimitAndValue, _signAndSend } from '@727-ventures/typechain-types';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING } from './defaultInterestRateModel';

const getCodePromise = (api: ApiPromise, contractName: string): CodePromise => {
  const abi = JSON.parse(readFileSync(`./artifacts/${contractName}.json`).toString());
  const wasm = readFileSync(`./artifacts/${contractName}.wasm`);

  return new CodePromise(api, abi, wasm);
};

// export const deployBlockTimestampProvider = async (owner: KeyringPair, shouldReturnMockValue = false) => {
//   const blockTimestampProviderRet = await new BlockTimestampProviderConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(false, owner.address);
//   const blockTimestampProvider = await getContractObject(BlockTimestampProvider, blockTimestampProviderRet.address, owner);
//   return blockTimestampProvider;
// };
export const setupContract = async (signer: KeyringPair, contractName: string, constructorName: string, ...constructorArgs: any[]) => {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const codePromise = getCodePromise(api, contractName);
  // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.
  const MAX_CALL_WEIGHT = new BN(5_000_000_000).isubn(1);
  const PROOFSIZE = new BN(3_000_000);
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

  const storageDepositLimit = null;

  // used to derive contract address,
  // use null to prevent duplicate contracts
  const salt = new Uint8Array();

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

const deployWithLog = async <T>(
  signer: KeyringPair,
  constructor: new (address: string, contractSigner: KeyringPair, nativeAPI: ApiPromise) => T,
  contractName: string,
  ...deployArgs
) => {
  const ret = await setupContract(signer, contractName, 'new', ...deployArgs);
  if (process.env.DEBUG) console.log(`Deployed ${contractName}: ${ret.deployedContract.address.toString()}`);
  return getContractObject<T>(constructor, ret.deployedContract.address.toString(), ret.signer);
};

export const deployLendingPool = async (owner: KeyringPair) => await deployWithLog(owner, LendingPool, 'lending_pool');
//TODO currently deployment using typechain fails
// export const deployLendingPool = async (owner: KeyringPair) => {
//   const deployRet = await new LendingPoolConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
//   return getContractObject(LendingPool, deployRet.address, owner);
// };

export const deployBlockTimestampProvider = async (owner: KeyringPair, shouldReturnMockValue = false, speedMultiplier = 1) => {
  const deployRet = await new BlockTimestampProviderConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    shouldReturnMockValue,
    owner.address,
    speedMultiplier,
  );
  return getContractObject(BlockTimestampProvider, deployRet.address, owner);
};

export const deployAToken = async (
  owner: KeyringPair,
  symbol: string,
  decimal: number,
  lendingPoolAddress: string,
  underlyingAssetAddress: string,
) => {
  const deployRet = await new ATokenContractConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    'AToken',
    symbol,
    decimal,
    lendingPoolAddress,
    underlyingAssetAddress,
  );
  return getContractObject(ATokenContract, deployRet.address, owner);
};

export const deployVToken = async (
  owner: KeyringPair,
  symbol: string,
  decimal: number,
  lendingPoolAddress: string,
  underlyingAssetAddress: string,
) => {
  const deployRet = await new VTokenContractConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    'VToken',
    symbol,
    decimal,
    lendingPoolAddress,
    underlyingAssetAddress,
  );
  return getContractObject(VTokenContract, deployRet.address, owner);
};

export const deployEmitableToken = async (owner: KeyringPair, name: string, decimals: number = 6) => {
  const deployRet = await new PSP22EmitableConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    `Reserve ${name} token `,
    decimals,
  );
  return getContractObject(PSP22Emitable, deployRet.address, owner);
};

export const deployOwnableToken = async (owner: KeyringPair, name: string, decimals: number = 6, tokenOwnerAddress: string) => {
  const deployRet = await new PSP22OwnableConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(
    name,
    `Reserve ${name} token `,
    decimals,
    tokenOwnerAddress,
  );
  return getContractObject(PSP22Ownable, deployRet.address, owner);
};

export const deployTestReservesMinter = async (owner: KeyringPair) => {
  const deployRet = await new TestReservesMinterConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObject(TestReservesMinter, deployRet.address, owner);
};

export const deployFlashLoanReceiverMock = async (owner: KeyringPair) => {
  const deployRet = await new FlashLoanReceiverMockConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new();
  return getContractObject(FlashLoanReceiverMock, deployRet.address, owner);
};

export const deployBalanceViewer = async (owner: KeyringPair, lendingPoolAddress: string) => {
  const deployRet = await new BalanceViewerConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(lendingPoolAddress);
  return getContractObject(BalanceViewer, deployRet.address, owner);
};

export const deployDiamond = async (owner: KeyringPair) => {
  const deployRet = await new DiamondContractConstructor(await apiProviderWrapper.getAndWaitForReady(), owner).new(owner.address);
  return getContractObject(DiamondContract, deployRet.address, owner);
};

const getSelectorsFromMessages = (messages: AbiMessage[]) => messages.map((message) => message.selector.toU8a() as unknown as number[]);

const getSelectorByName = (messages: AbiMessage[], name: string) =>
  messages.filter((message) => message.identifier === name)[0].selector.toU8a() as unknown as number[];
// async function setupPSP22Facet(signer: KeyringPair) {
//   const api = await ApiPromise.create();

//   const signers = getSigners();
//   const alice = signers[0];
//   const bob = signers[1];

//   const contractFactory = new TestPSP22FacetV1Constructor(api, signer);
//   const contractAddress = (await contractFactory.new()).address;
//   const contract = new TestPSP22FacetV1(contractAddress, signer, api);

//   return {
//     api,
//     signer,
//     alice,
//     bob,
//     contract,
//     query: contract.query,
//     tx: contract.tx,
//     abi: contract.abi,
//     close: async () => {
//       await api.disconnect();
//     },
//   };
// }
export const setupDiamondContract = async <T>(
  constructor: new (address: string, signer: KeyringPair, nativeAPI: ApiPromise) => T,
  defaultSigner: KeyringPair,
  owner: KeyringPair,
  facetWithInitializeMethod: string,
  facets: string[],
) => {
  const api = await apiProviderWrapper.getAndWaitForReady();

  const initFacetCodePromise = getCodePromise(api, facetWithInitializeMethod);
  const gasLimit = (await _genValidGasLimitAndValue(api)).gasLimit as WeightV2;
  const tx = initFacetCodePromise.tx['new']!({ gasLimit });
  const response = await _signAndSend(api.registry, tx, owner, (event: any) => event);
  //@ts-ignore
  const initFacetAddress = (response as SignAndSendSuccessResponse)!.result!.contract.address.toString();

  const initFacetWasmHash = initFacetCodePromise.abi.info.source.wasmHash.toString();
  const initFacetMessages = initFacetCodePromise.abi.messages;
  const initSelector = getSelectorByName(initFacetMessages, 'initialize_contract');
  const initFacetSelectors = getSelectorsFromMessages(initFacetMessages);
  const initCut: FacetCut[] = [{ hash: initFacetWasmHash, selectors: initFacetSelectors }];
  // const { contract: psp22Facet, abi, signer } = await setupPSP22Facet(defaultSigner);

  // const initFacetWasmHash = abi.info.source.wasmHash.toString();
  // const psp22Messages = abi.messages;

  // const initSelector = getSelectorByName(psp22Messages, 'init_psp22');
  // const psp22Selectors = getSelectorsFromMessages(psp22Messages);
  // const initCut = [{ hash: initFacetWasmHash, selectors: psp22Selectors }];

  const diamondContract = await deployDiamond(owner);
  await diamondContract.query.diamondCut(initCut, {
    hash: initFacetWasmHash,
    selector: initSelector,
    input: [],
  });

  await diamondContract.tx.diamondCut(initCut, {
    hash: initFacetWasmHash,
    selector: initSelector,
    input: [],
  });

  const initCutRemove = [{ hash: initFacetWasmHash, selectors: [] }];
  await diamondContract.tx.diamondCut(initCutRemove, null);

  const cuts: FacetCut[] = [];
  for (const facet of facets) {
    const facetCodePromise = getCodePromise(api, facet);
    await deployWithLog(defaultSigner, LendingPool, facet);
    const facetCodeHash = facetCodePromise.abi.info.source.wasmHash.toString();
    const facetMessages = facetCodePromise.abi.messages;
    const facetSelectors = getSelectorsFromMessages(facetMessages);
    const facetCut = { hash: facetCodeHash, selectors: facetSelectors };
    cuts.push(facetCut);
    const res = await diamondContract.query.diamondCut([facetCut], null);
    try {
      await diamondContract.tx.diamondCut([facetCut], null);
    } catch (e) {
      console.log(res.value.err);
    }
  }

  return new constructor(diamondContract.address, defaultSigner, api);
};

export const getContractObject = async <T>(
  constructor: new (address: string, signer: KeyringPair, nativeAPI: ApiPromise) => T,
  contractAddress: string,
  signerPair: KeyringPair,
) => {
  return new constructor(contractAddress, signerPair, await apiProviderWrapper.getAndWaitForReady());
};
//reserveDatas: ReserveTokenDeploymentData
export async function deployCoreContracts(owner: KeyringPair) {
  if (process.env.DEBUG) {
    console.log(getLineSeparator());
    console.log('Deploying contracts');
    console.log(getLineSeparator());
    console.log(`Deployer: ${owner.address}`);
  }
  const blockTimestampProvider = await deployBlockTimestampProvider(owner);

  // fallback:
  const lendingPool = await deployLendingPool(owner);

  // const initFacet = 'lending_pool_v0_initialize_facet';
  // const functionalFacets = [
  //   'lending_pool_v0_manage_facet',
  //   'lending_pool_v0_borrow_facet',
  //   'lending_pool_v0_deposit_facet',
  //   'lending_pool_v0_flash_facet',
  //   'lending_pool_v0_liquidate_facet',
  //   'lending_pool_v0_maintain_facet',
  //   'lending_pool_v0_a_token_interface_facet',
  //   'lending_pool_v0_v_token_interface_facet',
  //   'lending_pool_v0_view_facet',
  // ];
  // const lendingPool = await setupDiamondContract(LendingPool, owner, owner, initFacet, functionalFacets);
  return { blockTimestampProvider, lendingPool };
}

export interface ProductionDeploymentParams {
  owner: KeyringPair;

  reserveDatas: ReserveTokenDeploymentData[];
}

const getEntryOrThrow = <T>(record: Record<string, T>, key: string) => {
  if (!(key in record)) throw new Error(`Key "${key}" not found in record ${record}`);
  const value = record[key];
  return value;
};

export type DeploymentConfig = {
  testReserveTokensToDeploy: Omit<ReserveTokenDeploymentData, 'address'>[];
  interestRateModel: [number, number, number, number, number, number, number];
  priceOverridesE8: Record<string, number>;
  shouldUseMockTimestamp: boolean;
  owner: KeyringPair;
  users: KeyringPair[];
};
export const defaultDeploymentConfig: DeploymentConfig = {
  testReserveTokensToDeploy: fs.readJSONSync(path.join(__dirname, 'reserveTokensToDeploy.json')) as Omit<ReserveTokenDeploymentData, 'address'>[],
  interestRateModel: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
  priceOverridesE8: MOCK_CHAINLINK_AGGREGATORS_PRICES,
  shouldUseMockTimestamp: true,
  owner: getSigners()[0],
  users: getSignersWithoutOwner(getSigners(), 0),
};

export const deployAndConfigureSystem = async (
  deploymentConfigOverrides: Partial<DeploymentConfig> = defaultDeploymentConfig,
  saveConfigToFilePath?: string,
): Promise<TestEnv> => {
  const config: DeploymentConfig = {
    ...defaultDeploymentConfig,
    ...deploymentConfigOverrides,
    priceOverridesE8: {
      ...MOCK_CHAINLINK_AGGREGATORS_PRICES,
      ...deploymentConfigOverrides.priceOverridesE8,
    },
  };

  const { owner, users, testReserveTokensToDeploy, priceOverridesE8: prices, shouldUseMockTimestamp, interestRateModel } = config;

  const contracts = await deployCoreContracts(owner);

  await contracts.lendingPool.withSigner(owner).tx.setBlockTimestampProvider(contracts.blockTimestampProvider.address);
  const timestampToSet = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
  await contracts.blockTimestampProvider.withSigner(owner).tx.setBlockTimestamp(timestampToSet.toString());

  if (process.env.DEBUG) console.log({ shouldUseMockTimestamp });
  if (shouldUseMockTimestamp) {
    await contracts.blockTimestampProvider.withSigner(owner).tx.setShouldReturnMockValue(true);
  }
  await contracts.lendingPool.withSigner(owner).query.addMarketRule([]);
  await contracts.lendingPool.withSigner(owner).tx.addMarketRule([]);

  const reservesWithLendingTokens = {} as TestEnv['reserves'];
  for (const reserveData of testReserveTokensToDeploy) {
    const reserve = await deployEmitableToken(owner, reserveData.name, reserveData.decimals);
    if (process.env.DEBUG) console.log(`${reserveData.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      owner,
      contracts.lendingPool,
      reserveData.name,
      reserve.address,
      reserveData.collateralCoefficient,
      reserveData.borrowCoefficient,
      reserveData.penalty,
      reserveData.maximalTotalSupply,
      reserveData.maximalTotalDebt,
      reserveData.minimalCollateral,
      reserveData.minimalDebt,
      reserveData.decimals,
      reserveData.feeD6,
      reserveData.flashLoanFeeE6,
      interestRateModel,
    );
    await contracts.lendingPool.tx.insertReserveTokenPriceE8(reserve.address, prices[reserveData.name]);
    reservesWithLendingTokens[reserveData.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.decimals,
    };
  }

  if (process.env.DEBUG) console.log('Asset rules added');
  const balanceViewer = await deployBalanceViewer(owner, contracts.lendingPool.address);
  const testEnv = {
    blockTimestampProvider: contracts.blockTimestampProvider,
    users: users,
    owner,
    lendingPool: contracts.lendingPool,
    reserves: reservesWithLendingTokens,
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
        name: testEnv.blockTimestampProvider.name,
        address: testEnv.blockTimestampProvider.address,
      },
      ...Object.entries(testEnv.reserves).flatMap(([reserveName, r]) =>
        [r.underlying, r.aToken, r.vToken].map((c) => ({
          name: c.name,
          address: c.address,
          reserveName,
        })),
      ),
      {
        name: testEnv.balanceViewer.name,
        address: testEnv.balanceViewer.address,
      },
    ],
    writePath,
  );
}

export async function registerNewAsset(
  owner: KeyringPair,
  lendingPool: LendingPool,
  symbol: string,
  assetAddress: string,
  collateralCoefficient: null | number,
  borrowCoefficient: null | number,
  penalty: null | number,
  maximalTotalSupply: null | BN | string,
  maximalDebt: null | BN | string,
  minimalCollatral: number | BN,
  minimalDebt: number | BN,
  decimals: number,
  feeD6: number,
  flashLoanFeeE6: number,
  interestRateModel: [number, number, number, number, number, number, number],
) {
  const aToken = await deployAToken(owner, symbol, decimals, lendingPool.address, assetAddress);
  const vToken = await deployVToken(owner, symbol, decimals, lendingPool.address, assetAddress);
  const registerAssetArgs: Parameters<typeof lendingPool.query.registerAsset> = [
    assetAddress,
    new BN(Math.pow(10, decimals).toString()),
    collateralCoefficient ? toE6(collateralCoefficient) : null,
    borrowCoefficient ? toE6(borrowCoefficient) : null,
    penalty ? toE6(penalty) : null,
    maximalTotalSupply,
    maximalDebt,
    minimalCollatral,
    minimalDebt,
    toE6(1) - feeD6,
    flashLoanFeeE6,
    interestRateModel,
    aToken.address,
    vToken.address,
  ];
  const res = await lendingPool.query.registerAsset(...registerAssetArgs);

  await lendingPool.tx.registerAsset(...registerAssetArgs);

  return { aToken, vToken };
}
