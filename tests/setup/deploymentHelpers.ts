import { KeyringPair } from '@polkadot/keyring/types';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import ATokenContract from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PriceFeedProviderContract from 'typechain/contracts/price_feed_provider';
import VTokenContract from 'typechain/contracts/v_token';

import { getLineSeparator } from 'scripts/compile/common';
import { BURNER, MINTER, ROLES } from 'tests/consts';
import ATokenDeployer from 'typechain/deployers/a_token';
import BalanceViewerDeployer from 'typechain/deployers/balance_viewer';
import DiaOracleDeployer from 'typechain/deployers/dia_oracle';
import LendingPoolDeployer from 'typechain/deployers/lending_pool';
import PriceFeedProviderDeployer from 'typechain/deployers/price_feed_provider';
import Psp22EmitableDeployer from 'typechain/deployers/psp22_emitable';
import StableTokenDeployer from 'typechain/deployers/stable_token';
import VTokenDeployer from 'typechain/deployers/v_token';
import { ReserveFees } from 'typechain/types-arguments/balance_viewer';
import { AssetRules, ReserveRestrictions } from 'typechain/types-arguments/lending_pool';
import { getContractObjectWrapper } from 'wookashwackomytest-contract-helpers';
import { localApi } from 'wookashwackomytest-polkahat-network-helpers';
import { apiProviderWrapper, getSigners } from './helpers';
import { saveContractInfoToFileAsJson } from './nodePersistence';
import { MOCK_CHAINLINK_AGGREGATORS_PRICES, ReserveTokenDeploymentData } from './testEnvConsts';
import { TOKENS_TO_DEPLOY_FOR_TESTING } from './tokensToDeployForTesting';
import { InterestRateModel, TokensToDeployForTesting } from './tokensToDeployForTesting.types';

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
  const api = await apiProviderWrapper.getAndWaitForReady();
  const priceFeedProvider = (await new PriceFeedProviderDeployer(api, owner).new(oracle)).contract;

  const aTokenContract = await new ATokenDeployer(api, owner).new('Abacus Deposit Token', 'AToken', 0, owner.address, owner.address);
  const vTokenContract = await new VTokenDeployer(api, owner).new('Abacus Debt Token', 'VToken', 0, owner.address, owner.address);

  const { codeHash: aTokenCodeHashHex } = (await api.query.contracts.contractInfoOf(aTokenContract.contract.address)).toHuman() as {
    codeHash: string;
  };
  const { codeHash: vTokenCodeHashHex } = (await api.query.contracts.contractInfoOf(vTokenContract.contract.address)).toHuman() as {
    codeHash: string;
  };
  const aTokenCodeHash = aTokenCodeHashHex; //hexToBytes(aTokenCodeHashHex);
  const vTokenCodeHash = vTokenCodeHashHex; //hexToBytes(vTokenCodeHashHex);

  const lendingPool = (await new LendingPoolDeployer(api, owner).new()).contract;
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
const [defaultOwner, ...defaultUsers] = getSigners();
export const DEFAULT_TEST_DEPLOYMENT_CONFIG: DeploymentConfig = {
  testTokensToDeploy: TOKENS_TO_DEPLOY_FOR_TESTING,
  priceOverridesE18: MOCK_CHAINLINK_AGGREGATORS_PRICES,
  owner: defaultOwner,
  users: defaultUsers,
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
  const api = await apiProviderWrapper.getAndWaitForReady();

  const { owner, users, testTokensToDeploy, priceOverridesE18: prices } = config;
  const oracle = (await new DiaOracleDeployer(api, owner).new()).contract;

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
    const reserve = (
      await new Psp22EmitableDeployer(api, owner).new(
        reserveData.metadata.name,
        `Reserve ${reserveData.metadata.name} token `,
        reserveData.metadata.decimals,
      )
    ).contract;
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
    const reserve = (
      await new StableTokenDeployer(api, owner).new(
        stableData.metadata.name,
        `Reserve ${stableData.metadata.name} token`,
        stableData.metadata.decimals,
      )
    ).contract;
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
  const balanceViewer = (await new BalanceViewerDeployer(api, owner).new(contracts.lendingPool.address)).contract;
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
    api: api,
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
  const api = await localApi.get(false);
  const aToken = getContractObjectWrapper(api, ATokenContract, tokenAdresses.aTokenAddress.toString(), owner);
  const vToken = getContractObjectWrapper(api, VTokenContract, tokenAdresses.vTokenAddress.toString(), owner);
  return { aToken, vToken };
}
