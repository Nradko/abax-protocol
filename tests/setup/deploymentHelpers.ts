import { ApiPromise } from '@polkadot/api';
import { CodePromise, ContractPromise } from '@polkadot/api-contract';
import { CodeSubmittableResult } from '@polkadot/api-contract/base';
import { KeyringPair } from '@polkadot/keyring/types';
import type { WeightV1 } from '@polkadot/types/interfaces';
import { BN } from 'bn.js';
import fs, { readFileSync } from 'fs-extra';
import path from 'path';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import { LINE_SEPARATOR, toE6, toNullableNumArg } from 'tests/scenarios/utils/misc';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import { FacetCut } from 'typechain/types-arguments/diamond';
import ATokenContract from '../../typechain/contracts/a_token';
import BlockTimestampProvider from '../../typechain/contracts/block_timestamp_provider';
import DiamondContract from '../../typechain/contracts/diamond';
import LendingPool from '../../typechain/contracts/lending_pool';
import EmittedTokenContract from '../../typechain/contracts/psp22_emitable';
import STokenContract from '../../typechain/contracts/s_token';
import VTokenContract from '../../typechain/contracts/v_token';
import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './helpers';
import { saveContractInfoToFileAsJson } from './nodePersistence';
import { MOCK_CHAINLINK_AGGREGATORS_PRICES, ReserveTokenDeploymentData } from './testEnvConsts';

const getCodePromise = (api: ApiPromise, contractName: string): CodePromise => {
  const abi = JSON.parse(readFileSync(`./artifacts/${contractName}.json`).toString());
  const wasm = readFileSync(`./artifacts/${contractName}.wasm`);

  return new CodePromise(api, abi, wasm);
};
export const setupContract = async (owner: KeyringPair, contractName: string, constructorName: string, ...constructorArgs: any[]) => {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const codePromise = getCodePromise(api, contractName);
  // maximum gas to be consumed for the instantiation. if limit is too small the instantiation will fail.
  const gasLimit = 100000n * 1000000n;
  const gasLimitFromNetwork = api.consts.system.blockWeights
    ? (api.consts.system.blockWeights as unknown as { maxBlock: WeightV1 }).maxBlock
    : (api.consts.system.maximumBlockWeight as unknown as WeightV1);
  // a limit to how much Balance to be used to pay for the storage created by the instantiation
  // if null is passed, unlimited balance can be used
  const storageDepositLimit = null;
  // used to derive contract address,
  // use null to prevent duplicate contracts
  const salt = new Uint8Array();
  // balance to transfer to the contract account, formerly know as "endowment".
  // use only with payable constructors, will fail otherwise.
  const value = (await apiProviderWrapper.getAndWaitForReady()).registry.createType('Balance', 1000);

  const deployedContract = await new Promise<ContractPromise>((resolve, reject) => {
    let unsub: () => void;
    const tx = codePromise.tx[constructorName](
      {
        storageDepositLimit: null,
        gasLimit: gasLimitFromNetwork.muln(2).divn(10),
        salt: undefined,
        value: undefined,
      },
      ...constructorArgs,
    );
    tx.signAndSend(owner, (result: CodeSubmittableResult<'promise'>) => {
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

  return { owner, deployedContract };
};

const deployWithLog = async <T>(
  owner: KeyringPair,
  constructor: new (address: string, signer: KeyringPair, nativeAPI: ApiPromise) => T,
  contractName: string,
  ...deployArgs
) => {
  const ret = await setupContract(owner, contractName, 'new', ...deployArgs);
  if (process.env.DEBUG) console.log(`Deployed ${contractName}: ${ret.deployedContract.address.toString()}`);
  return getContractObject<T>(constructor, ret.deployedContract.address.toString(), ret.owner);
};

export const deployBlockTimestampProvider = async (owner: KeyringPair, shouldReturnMockValue = false) =>
  await deployWithLog(owner, BlockTimestampProvider, 'block_timestamp_provider', shouldReturnMockValue, owner.address);

export const deployAToken = async (owner: KeyringPair, symbol: string, decimal: number, lendingPoolAddress: string, underlyingAssetAddress: string) =>
  deployWithLog(owner, ATokenContract, 'a_token', 'AToken', symbol, decimal, lendingPoolAddress, underlyingAssetAddress);

export const deployVToken = async (owner: KeyringPair, symbol: string, decimal: number, lendingPoolAddress: string, underlyingAssetAddress: string) =>
  deployWithLog(owner, VTokenContract, 'v_token', 'VToken', symbol, decimal, lendingPoolAddress, underlyingAssetAddress);

export const deploySToken = async (owner: KeyringPair, symbol: string, decimal: number, lendingPoolAddress: string, underlyingAssetAddress: string) =>
  deployWithLog(owner, STokenContract, 's_token', 'SToken', symbol, decimal, lendingPoolAddress, underlyingAssetAddress);

export const deployReserveToken = async (owner: KeyringPair, name: string, decimals: number = 6) => {
  return deployWithLog(owner, EmittedTokenContract, 'psp22_emitable', name, `Reserve ${name} token `, decimals);
};

export const deployFlashLoanReceiverMock = async (owner: KeyringPair) => {
  return deployWithLog(owner, FlashLoanReceiverMock, 'flash_loan_receiver_mock');
};

export const deployDiamond = async (owner: KeyringPair) => deployWithLog(owner, DiamondContract, 'diamond', owner.address);

const getSelectorsFromMessages = (messages) => {
  return messages.map((message) => {
    return message.selector;
  });
};

const getSelectorByName = (messages, name) => {
  return messages.filter((message) => {
    return message.label === name;
  })[0].selector;
};

export const setupUpgradableContract = async <T>(
  constructor: new (address: string, signer: KeyringPair, nativeAPI: ApiPromise) => T,
  defaultSigner: KeyringPair,
  owner: KeyringPair,
  facetWithInitializeMethod: string,
  facets: string[],
) => {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const diamondContract = await deployWithLog(defaultSigner, DiamondContract, 'diamond', owner.address);
  const initCodePromise = getCodePromise(api, facetWithInitializeMethod);

  //await api.tx.contracts.uploadCode(initCodePromise.code, null);
  await deployWithLog(defaultSigner, constructor, facetWithInitializeMethod);

  const initCodeHash = (initCodePromise.abi.json.source as any).hash as string;
  const initMessages = (initCodePromise.abi.json.V3 as any).spec.messages;
  const initSelector = getSelectorByName(initMessages, 'initialize_contract');
  const initSelectors = getSelectorsFromMessages(initMessages);
  const initCut: FacetCut[] = [{ hash: initCodeHash, selectors: initSelectors }];

  await diamondContract.query.diamondCut(initCut, {
    hash: initCodeHash,
    selector: initSelector,
    input: [],
  });
  await diamondContract.tx.diamondCut(initCut, {
    hash: initCodeHash,
    selector: initSelector,
    input: [],
  });

  const initCutRemove = [{ hash: initCodeHash, selectors: [] }];
  await diamondContract.tx.diamondCut(initCutRemove, null);

  const cuts: FacetCut[] = [];
  for (const facet of facets) {
    const facetCodePromise = getCodePromise(api, facet);
    //await api.tx.contracts.uploadCode(facetCodePromise.code, null);
    await deployWithLog(defaultSigner, LendingPool, facet);
    const facetCodeHash = (facetCodePromise.abi.json.source as any).hash as string;
    const facetMessages = (facetCodePromise.abi.json.V3 as any).spec.messages;
    const facetSelectors = getSelectorsFromMessages(facetMessages);
    cuts.push({ hash: facetCodeHash, selectors: facetSelectors });
  }
  await diamondContract.tx.diamondCut(cuts, null);

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
    console.log(LINE_SEPARATOR);
    console.log('Deploying contracts');
    console.log(LINE_SEPARATOR);
    console.log(`Deployer: ${owner.address}`);
  }
  const blockTimestampProvider = await deployBlockTimestampProvider(owner);
  const lendingPool = await setupUpgradableContract(LendingPool, owner, owner, 'lending_pool_v0_initialize_facet', [
    'lending_pool_v0_borrow_facet',
    'lending_pool_v0_deposit_facet',
    'lending_pool_v0_flash_facet',
    'lending_pool_v0_liquidate_facet',
    'lending_pool_v0_maintain_facet',
    'lending_pool_v0_a_token_interface_facet',
    'lending_pool_v0_v_token_interface_facet',
    'lending_pool_v0_s_token_interface_facet',
    'lending_pool_v0_manage_facet',
    'lending_pool_v0_view_facet',
  ]);
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
  priceOverridesE8: Record<string, number>;
  shouldUseMockTimestamp: boolean;
  owner: KeyringPair;
  users: KeyringPair[];
};
export const defaultDeploymentConfig: DeploymentConfig = {
  testReserveTokensToDeploy: fs.readJSONSync(path.join(__dirname, 'reserveTokensToDeploy.json')) as Omit<ReserveTokenDeploymentData, 'address'>[],
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

  const { owner, users, testReserveTokensToDeploy, priceOverridesE8: prices, shouldUseMockTimestamp } = config;

  const contracts = await deployCoreContracts(owner);

  await contracts.lendingPool.withSigner(owner).tx.setBlockTimestampProvider(contracts.blockTimestampProvider.address);
  const timestampToSet = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
  await contracts.blockTimestampProvider.withSigner(owner).tx.setBlockTimestamp(timestampToSet.toString());

  if (shouldUseMockTimestamp) {
    await contracts.blockTimestampProvider.withSigner(owner).tx.setShouldReturnMockValue(true);
  }

  const reservesWithLendingTokens = {} as TestEnv['reserves'];
  for (const reserveData of testReserveTokensToDeploy) {
    const reserve = await deployReserveToken(owner, reserveData.name, reserveData.decimals);
    if (process.env.DEBUG) console.log(`${reserveData.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken, sToken } = await registerNewAsset(
      owner,
      contracts.lendingPool,
      reserveData.name,
      reserve.address,
      reserveData.collateralCoefficient,
      reserveData.borrowCoefficient,
      reserveData.stableBaseRate,
      reserveData.penalty,
      reserveData.decimals,
      reserveData.feeD6,
      reserveData.flashLoanFeeE6,
    );
    await contracts.lendingPool.tx.insertReserveTokenPriceE8(reserve.address, prices[reserveData.name]);
    reservesWithLendingTokens[reserveData.name] = {
      underlying: reserve,
      aToken,
      vToken,
      sToken,
      decimals: reserveData.decimals,
    };
  }

  if (process.env.DEBUG) console.log('Asset rules added');
  const testEnv = {
    blockTimestampProvider: contracts.blockTimestampProvider,
    users: users,
    owner,
    lendingPool: contracts.lendingPool,
    reserves: reservesWithLendingTokens,
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
        [r.underlying, r.aToken, r.vToken, r.sToken].map((c) => ({
          name: c.name,
          address: c.address,
          reserveName,
        })),
      ),
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
  stableRateBaseE24: number | null,
  penalty: number,
  decimals: number,
  feeD6: number,
  flashLoanFeeE6: number,
) {
  const aToken = await deployAToken(owner, symbol, decimals, lendingPool.address, assetAddress);
  const vToken = await deployVToken(owner, symbol, decimals, lendingPool.address, assetAddress);
  const sToken = await deploySToken(owner, symbol, decimals, lendingPool.address, assetAddress);
  const registerAssetArgs: Parameters<typeof lendingPool.query.registerAsset> = [
    assetAddress,
    new BN(Math.pow(10, decimals).toString()),
    collateralCoefficient ? toE6(collateralCoefficient) : null,
    borrowCoefficient ? toE6(borrowCoefficient) : null,
    stableRateBaseE24,
    toE6(penalty),
    toE6(1) - feeD6,
    flashLoanFeeE6,
    aToken.address,
    vToken.address,
    sToken.address,
  ];
  await lendingPool.query.registerAsset(...registerAssetArgs);

  await lendingPool.tx.registerAsset(...registerAssetArgs);

  return { aToken, vToken, sToken };
}
