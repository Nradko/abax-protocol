import { getArgvObj } from '@abaxfinance/utils';
import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import path from 'path';
import { deployBalanceViewer, deployCoreContracts, deployTestReservesMinter, registerNewAsset } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { saveContractInfoToFileAsJson } from 'tests/setup/nodePersistence';
import { ReserveTokenDeploymentData } from 'tests/setup/testEnvConsts';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING } from 'tests/setup/tokensToDeployForTesting';
import ATokenContract from 'typechain/contracts/a_token';
import PSP22Ownable from 'typechain/contracts/psp22_ownable';
import VTokenContract from 'typechain/contracts/v_token';

const RESERVE_TOKENS_TO_DEPLOY: Omit<ReserveTokenDeploymentData, 'address'>[] = [
  {
    name: 'DAI_TEST',
    symbol: 'DAI',
    decimals: 6,
    feeD6: 100_000,
    collateralCoefficient: 0.92,
    borrowCoefficient: 1.08,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000000,
    minimalDebt: 1000000,
    penalty: 0.04,
  },
  {
    name: 'USDC_TEST',
    symbol: 'USDC',
    decimals: 6,
    feeD6: 100_000,
    collateralCoefficient: 0.95,
    borrowCoefficient: 1.05,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.025,
  },
  {
    name: 'WETH_TEST',
    symbol: 'ETH',
    decimals: 18,
    feeD6: 100_000,
    collateralCoefficient: 0.75,
    borrowCoefficient: 1.25,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.125,
  },
  {
    name: 'BTC_TEST',
    symbol: 'BTC',
    decimals: 8,
    feeD6: 100_000,
    collateralCoefficient: 0.75,
    borrowCoefficient: 1.25,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.125,
  },
  {
    name: 'AZERO_TEST',
    symbol: 'AZERO',
    decimals: 12,
    feeD6: 100_000,
    collateralCoefficient: 0.63,
    borrowCoefficient: 1.42,
    maximalTotalDeposit: null,
    maximalTotalDebt: null,
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.2,
  },
  {
    name: 'DOT_TEST',
    symbol: 'DOT',
    decimals: 12,
    feeD6: 100_000,
    collateralCoefficient: 0.7,
    borrowCoefficient: 1.3,
    maximalTotalDeposit: '1000000000000000000000000000',
    maximalTotalDebt: '1000000000000000000000000000',
    minimalCollateral: 2000,
    minimalDebt: 1000,
    penalty: 0.15,
  },
];

const ORACLE_ADDRESS = '5F5z8pZoLgkGapEksFWc2h7ZxH2vdh1A9agnhXvfdCeAfS9b';

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
  const signer = keyring.createFromUri(seed, {}, 'sr25519'); // getSigners()[0];
  const deployPath = path.join(outputJsonFolder, 'deployedContracts.azero.testnet.json');

  const deployedContracts = await deployCoreContracts(signer, ORACLE_ADDRESS);
  const lendingPool = deployedContracts.lendingPool;
  const priceFeedProvider = deployedContracts.priceFeedProvider;

  await lendingPool.withSigner(signer).tx.setPriceFeedProvider(priceFeedProvider.address);

  await lendingPool.withSigner(signer).tx.addMarketRule([]);
  console.log(`signer: ${signer.address}`);
  console.log(`lendingPool: ${lendingPool.address}`);
  console.log(`priceFeedProvider: ${priceFeedProvider.address}`);
  console.log('a_token code hash:', deployedContracts.aTokenCodeHash);
  console.log('v_token code hash:', deployedContracts.vTokenCodeHash);

  const testReservesMinter = await deployTestReservesMinter(signer);

  const reservesWithLendingTokens = {} as Record<string, TokenReserve>;
  for (const reserveData of RESERVE_TOKENS_TO_DEPLOY) {
    //TODO
    const reserve = await deployOwnableToken(signer, reserveData.name, reserveData.decimals, testReservesMinter.address);
    if (process.env.DEBUG) console.log(`${reserveData.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      signer,
      lendingPool,
      reserve.address,
      deployedContracts.aTokenCodeHash,
      deployedContracts.vTokenCodeHash,
      reserveData.name,
      reserveData.symbol,
      reserveData.decimals,
      reserveData.collateralCoefficient,
      reserveData.borrowCoefficient,
      reserveData.penalty,
      reserveData.maximalTotalDeposit,
      reserveData.maximalTotalDebt,
      reserveData.minimalCollateral,
      reserveData.minimalDebt,
      reserveData.feeD6,
      DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
    );
    console.log('inserting token price');
    const setSymbolQuey = await priceFeedProvider.query.setAccountSymbol(reserve.address, reserveData.symbol + '/USD');
    await priceFeedProvider.tx.setAccountSymbol(reserve.address, reserveData.symbol + '/USD');
    reservesWithLendingTokens[reserveData.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.decimals,
    };
  }

  // stable
  await lendingPool.tx.addMarketRule([
    { collateralCoefficientE6: 980000, borrowCoefficientE6: 1020000, penaltyE6: 10000 },
    { collateralCoefficientE6: 990000, borrowCoefficientE6: 1010000, penaltyE6: 5000 },
    null,
  ]);

  // crypto
  await lendingPool.tx.addMarketRule([
    null,
    null,
    { collateralCoefficientE6: 900000, borrowCoefficientE6: 1100000, penaltyE6: 50000 },
    { collateralCoefficientE6: 900000, borrowCoefficientE6: 1100000, penaltyE6: 50000 },
    { collateralCoefficientE6: 800000, borrowCoefficientE6: 1200000, penaltyE6: 100000 },
    { collateralCoefficientE6: 850000, borrowCoefficientE6: 1150000, penaltyE6: 75000 },
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
        name: priceFeedProvider.name,
        address: priceFeedProvider.address,
      },
    ],
    deployPath.replace('.json', 'final_v6.json'),
  );

  await api.disconnect();
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
