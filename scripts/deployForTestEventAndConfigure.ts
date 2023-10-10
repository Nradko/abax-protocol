import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { E8 } from '@abaxfinance/utils';
import {
  deployBalanceViewer,
  deployCoreContracts,
  deployOwnableToken,
  deployTestReservesMinter,
  getContractObject,
  registerNewAsset,
} from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { StoredContractInfo, saveContractInfoToFileAsJson } from 'tests/setup/nodePersistence';
import { ReserveTokenDeploymentData } from 'tests/setup/testEnvConsts';
import ATokenContract from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Ownable from 'typechain/contracts/psp22_ownable';
import VTokenContract from 'typechain/contracts/v_token';
import { getArgvObj } from '@abaxfinance/utils';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING } from 'tests/setup/defaultInterestRateModel';

const RESERVE_TOKENS_TO_DEPLOY: Omit<ReserveTokenDeploymentData, 'address'>[] = [
  {
    name: 'DAI_TEST',
    decimals: 6,
    feeD6: 100_000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.97,
    borrowCoefficient: 1.03,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000000,
    minimalDebt: 1000000,
    penalty: 0.015,
  },
  {
    name: 'USDC_TEST',
    decimals: 6,
    feeD6: 100_000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.98,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.02,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.01,
  },
  {
    name: 'WETH_TEST',
    decimals: 18,
    feeD6: 100_000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'BTC_TEST',
    decimals: 8,
    feeD6: 100_000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'AZERO_TEST',
    decimals: 12,
    feeD6: 100_000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'DOT_TEST',
    decimals: 12,
    feeD6: 100_000,
    stableBaseRate: null,
    collateralCoefficient: 0.7,
    borrowCoefficient: 1.3,
    maximalTotalDeposit: '1000000000000000000000000000',
    maximalTotalDebt: '1000000000000000000000000000',
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.15,
  },
];

const LENDING_POOL_ADDRESS = '5C9MoPeD8rEATyW77U6fmUcnzGpvoLvqQ9QTMiA9oByGwffx';

const PRICES_E8 = {
  // Update to USD-based price feeds
  DAI_TEST: E8,
  AZERO_TEST: E8 * 1.5,
  USDC_TEST: E8,
  WETH_TEST: 270 * E8,
  DOT_TEST: 6 * E8,
  BTC_TEST: 29_000 * E8,
};

type TokenReserve = {
  underlying: PSP22Ownable;
  aToken: ATokenContract;
  vToken: VTokenContract;
  decimals: number;
};

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? process.env.PWD;
  if (!outputJsonFolder) throw 'could not determine path';
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';
  const api = await apiProviderWrapper.getAndWaitForReady();

  const timestamp = await api.query.timestamp.now();
  console.log(new Date(parseInt(timestamp.toString())));

  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519');
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.azero.testnet.json');

  // const lendingPool = await getContractObject(LendingPool, LENDING_POOL_ADDRESS, signer);
  const { lendingPool, blockTimestampProvider } = await deployCoreContracts(signer);

  await lendingPool.withSigner(signer).tx.setBlockTimestampProvider(blockTimestampProvider.address);
  await blockTimestampProvider.tx.setShouldReturnMockValue(false);
  await lendingPool.withSigner(signer).tx.addMarketRule([]);

  console.log(`signer: ${signer.address}`);
  console.log(`lendingPool: ${lendingPool.address}`);

  const testReservesMinter = await deployTestReservesMinter(signer);

  const reservesWithLendingTokens = {} as Record<string, TokenReserve>;
  for (const reserveData of RESERVE_TOKENS_TO_DEPLOY) {
    const reserve = await deployOwnableToken(signer, reserveData.name, reserveData.decimals, testReservesMinter.address);
    if (process.env.DEBUG) console.log(`${reserveData.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      signer,
      lendingPool,
      reserveData.name,
      reserve.address,
      reserveData.collateralCoefficient,
      reserveData.borrowCoefficient,
      reserveData.penalty,
      reserveData.maximalTotalDeposit,
      reserveData.maximalTotalDebt,
      reserveData.minimalCollateral,
      reserveData.minimalDebt,
      reserveData.decimals,
      reserveData.feeD6,
      DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
    );
    console.log('inserting token price');
    const tokenPriceQueryRes = await lendingPool.query.insertReserveTokenPriceE8(reserve.address, PRICES_E8[reserveData.name]);
    await lendingPool.tx.insertReserveTokenPriceE8(reserve.address, PRICES_E8[reserveData.name]);
    reservesWithLendingTokens[reserveData.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.decimals,
    };
  }

  await lendingPool.tx.addMarketRule([
    { collateralCoefficientE6: 970000, borrowCoefficientE6: 1020000, penaltyE6: 50000 },
    { collateralCoefficientE6: 980000, borrowCoefficientE6: 1010000, penaltyE6: 50000 },
    null,
  ]);
  await lendingPool.tx.addMarketRule([
    null,
    null,
    null,
    null,
    { collateralCoefficientE6: 900000, borrowCoefficientE6: 1020000, penaltyE6: 50000 },
    { collateralCoefficientE6: 910000, borrowCoefficientE6: 1030000, penaltyE6: 50000 },
  ]);

  const balanceViewer = await deployBalanceViewer(signer, lendingPool.address);

  await saveContractInfoToFileAsJson(
    [
      ...Object.entries(reservesWithLendingTokens).flatMap(([reserveName, r]) =>
        [r.underlying, r.aToken, r.vToken].map((c) => ({
          name: c.name,
          address: c.address,
          reserveName,
        })),
      ),
      {
        name: testReservesMinter.name,
        address: testReservesMinter.address,
      },
      {
        name: balanceViewer.name,
        address: balanceViewer.address,
      },
      {
        name: lendingPool.name,
        address: lendingPool.address,
      },
      {
        name: blockTimestampProvider.name,
        address: blockTimestampProvider.address,
      },
    ],
    deployPath.replace('.json', 'final_v5.json'),
  );

  await api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
