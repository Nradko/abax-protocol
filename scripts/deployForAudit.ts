import { getArgvObj } from '@abaxfinance/utils';
import { toE } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import path from 'path';
import { ROLES } from 'tests/consts';
import { deployCoreContracts, registerNewAsset } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { saveContractInfoToFileAsJson } from 'tests/setup/nodePersistence';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING } from 'tests/setup/tokensToDeployForTesting';
import { TokensToDeployForTesting } from 'tests/setup/tokensToDeployForTesting.types';
import ATokenContract from 'typechain/contracts/a_token';
import Psp22ForAuditContract from 'typechain/contracts/psp22_for_audit';
import VTokenContract from 'typechain/contracts/v_token';
import BalanceViewerDeployer from 'typechain/deployers/balance_viewer';
import Psp22ForAuditDeployer from 'typechain/deployers/psp22_for_audit';

const RESERVE_TOKENS_TO_DEPLOY: TokensToDeployForTesting = {
  reserveTokens: [
    {
      metadata: { name: 'DAI_TEST', symbol: 'DAI', decimals: 6 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.92), borrowCoefficientE6: toE(6, 1.08), penaltyE6: toE(6, 0.04) },
      restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000000, minimalDebt: 1000000 },
    },
    {
      metadata: { name: 'USDC_TEST', symbol: 'USDC', decimals: 6 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.95), borrowCoefficientE6: toE(6, 1.05), penaltyE6: toE(6, 0.025) },
      restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000, minimalDebt: 1000 },
    },
    {
      metadata: { name: 'WETH_TEST', symbol: 'ETH', decimals: 18 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.75), borrowCoefficientE6: toE(6, 1.25), penaltyE6: toE(6, 0.125) },
      restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000, minimalDebt: 1000 },
    },
    {
      metadata: { name: 'BTC_TEST', symbol: 'BTC', decimals: 8 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.75), borrowCoefficientE6: toE(6, 1.25), penaltyE6: toE(6, 0.125) },
      restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000, minimalDebt: 1000 },
    },
    {
      metadata: { name: 'AZERO_TEST', symbol: 'AZERO', decimals: 12 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.63), borrowCoefficientE6: toE(6, 1.42), penaltyE6: toE(6, 0.2) },
      restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000, minimalDebt: 1000 },
    },
    {
      metadata: { name: 'DOT_TEST', symbol: 'DOT', decimals: 12 },

      fees: {
        depositFeeE6: 0,
        debtFeeE6: 0,
      },
      interestRateModelParams: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
      defaultRule: { collateralCoefficientE6: toE(6, 0.7), borrowCoefficientE6: toE(6, 1.3), penaltyE6: toE(6, 0.15) },
      restrictions: {
        maximalTotalDeposit: '1000000000000000000000000000',
        maximalTotalDebt: '1000000000000000000000000000',
        minimalCollateral: 2000,
        minimalDebt: 1000,
      },
    },
  ],
  stableTokens: [],
};

const ORACLE_ADDRESS = '5F5z8pZoLgkGapEksFWc2h7ZxH2vdh1A9agnhXvfdCeAfS9b';
const CUSTOM_ADMIN = '5EPYzg9NkmtSGcJD82465NG92XxXbX3MgzMsVv1Z3ZALR8aE';

type TokenReserve = {
  underlying: Psp22ForAuditContract;
  aToken: ATokenContract;
  vToken: VTokenContract;
  decimals: number;
};

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const outputJsonFolder = (args['path'] as string) ?? process.argv[2] ?? __dirname;
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
  const outputPath = path.join(outputJsonFolder, 'deployedContracts.azero.testnet.json');
  const { lendingPool, priceFeedProvider, aTokenCodeHash, vTokenCodeHash } = await deployCoreContracts(signer, ORACLE_ADDRESS);

  await lendingPool.withSigner(signer).tx.grantRole(ROLES['ROLE_ADMIN'], CUSTOM_ADMIN);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['ASSET_LISTING_ADMIN'], CUSTOM_ADMIN);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['PARAMETERS_ADMIN'], CUSTOM_ADMIN);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['STABLECOIN_RATE_ADMIN'], CUSTOM_ADMIN);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['EMERGENCY_ADMIN'], CUSTOM_ADMIN);

  await lendingPool.withSigner(signer).tx.grantRole(ROLES['ASSET_LISTING_ADMIN'], signer.address);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['PARAMETERS_ADMIN'], signer.address);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['STABLECOIN_RATE_ADMIN'], signer.address);
  await lendingPool.withSigner(signer).tx.grantRole(ROLES['EMERGENCY_ADMIN'], signer.address);

  const setPriceFeedProviderRes = await lendingPool.withSigner(signer).query.setPriceFeedProvider(priceFeedProvider.address);
  setPriceFeedProviderRes.value.unwrapRecursively();
  await lendingPool.withSigner(signer).tx.setPriceFeedProvider(priceFeedProvider.address);

  const addMarketRuleRes = await lendingPool.withSigner(signer).query.addMarketRule([]);
  addMarketRuleRes.value.unwrapRecursively();
  await lendingPool.withSigner(signer).tx.addMarketRule([]);
  console.log(`signer: ${signer.address}`);
  console.log(`lendingPool: ${lendingPool.address}`);
  console.log(`priceFeedProvider: ${priceFeedProvider.address}`);
  console.log('a_token code hash:', aTokenCodeHash);
  console.log('v_token code hash:', vTokenCodeHash);

  const reservesWithLendingTokens = {} as Record<string, TokenReserve>;
  for (const reserveData of RESERVE_TOKENS_TO_DEPLOY.reserveTokens) {
    //TODO
    const reserve = (
      await new Psp22ForAuditDeployer(api, signer).new(
        reserveData.metadata.name,
        `Reserve ${reserveData.metadata.name} token`,
        reserveData.metadata.decimals,
      )
    ).contract;
    if (process.env.DEBUG) console.log(`${reserveData.metadata.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
    const { aToken, vToken } = await registerNewAsset(
      api,
      signer,
      lendingPool,
      reserve.address,
      aTokenCodeHash,
      vTokenCodeHash,
      reserveData.metadata.name,
      reserveData.metadata.symbol,
      reserveData.metadata.decimals,
      reserveData.defaultRule,
      reserveData.restrictions,
      reserveData.fees,
      reserveData.interestRateModelParams,
    );
    console.log('inserting token price');
    await priceFeedProvider.tx.setAccountSymbol(reserve.address, reserveData.metadata.symbol + '/USD');
    reservesWithLendingTokens[reserveData.metadata.name] = {
      underlying: reserve,
      aToken,
      vToken,
      decimals: reserveData.metadata.decimals,
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

  const balanceViewer = (await new BalanceViewerDeployer(api, signer).new(lendingPool.address)).contract;

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
        name: 'dia_oracle',
        address: ORACLE_ADDRESS,
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
      {
        name: 'aTokenCodeHash',
        codeHash: aTokenCodeHash,
      },
      {
        name: 'vTokenCodeHash',
        codeHash: aTokenCodeHash,
      },
    ],
    outputPath,
  );

  await api.disconnect();

  console.log(`Saved to: ${outputPath}`);

  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
