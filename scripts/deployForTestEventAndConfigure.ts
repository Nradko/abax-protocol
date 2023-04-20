import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { E8 } from 'tests/scenarios/utils/misc';
import { deployOwnableToken, deployTestReservesMinter, getContractObject, registerNewAsset } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { StoredContractInfo, saveContractInfoToFileAsJson } from 'tests/setup/nodePersistence';
import { ReserveTokenDeploymentData } from 'tests/setup/testEnvConsts';
import ATokenContract from 'typechain/contracts/a_token';
import LendingPool from 'typechain/contracts/lending_pool';
import PSP22Ownable from 'typechain/contracts/psp22_ownable';
import VTokenContract from 'typechain/contracts/v_token';
import { argvObj } from './compile/common';

const RESERVE_TOKENS_TO_DEPLOY: Omit<ReserveTokenDeploymentData, 'address'>[] = [
  {
    name: 'DAI_3',
    decimals: 6,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.97,
    borrowCoefficient: 1.03,
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000000,
    minimalDebt: 1000000,
    penalty: 0.015,
  },
  {
    name: 'USDC_3',
    decimals: 6,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.98,
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.02,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.01,
  },
  {
    name: 'WETH_3',
    decimals: 18,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'BTC_3',
    decimals: 8,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'AZERO_3',
    decimals: 12,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: 50000000000,
    collateralCoefficient: 0.8,
    maximalTotalSupply: null,
    maximalTotalDebt: null,
    borrowCoefficient: 1.2,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.1,
  },
  {
    name: 'DOT_3',
    decimals: 12,
    feeD6: 10,
    flashLoanFeeE6: 1000,
    stableBaseRate: null,
    collateralCoefficient: 0.7,
    borrowCoefficient: 1.3,
    maximalTotalSupply: '1000000000000000000000000000',
    maximalTotalDebt: '1000000000000000000000000000',
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.15,
  },
];

const PRICES = {
  // Update to USD-based price feeds
  DAI_3: E8,
  AZERO_3: E8 * 1.5,
  USDC_3: E8,
  WETH_3: 270 * E8,
  DOT_3: 6 * E8,
  BTC_3: 29_000 * E8,
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

  const contracts = JSON.parse(await fs.readFile(deployPath, 'utf8')) as StoredContractInfo[];
  const lendingPoolContractInfo = contracts.find((c) => c.name === 'lending_pool');
  if (!lendingPoolContractInfo) throw 'lendingPool ContractInfo not found';
  const lendingPool = await getContractObject(LendingPool, lendingPoolContractInfo.address, signer);

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
      reserveData.maximalTotalSupply,
      reserveData.maximalTotalDebt,
      reserveData.minimalCollateral,
      reserveData.minimalDebt,
      reserveData.decimals,
      reserveData.feeD6,
      reserveData.flashLoanFeeE6,
    );
    await lendingPool.tx.insertReserveTokenPriceE8(reserve.address, PRICES[reserveData.name]);
    reservesWithLendingTokens[reserveData.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.decimals,
    };
  }

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
    ],
    deployPath.replace('.json', 'appendix2.json'),
  );

  await api.disconnect();
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
