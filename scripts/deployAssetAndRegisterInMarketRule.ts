import { toE } from '@c-forge/polkahat-network-helpers';
import Keyring from '@polkadot/keyring';
import chalk from 'chalk';
import path from 'path';
import { registerNewAsset } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { readContractsFromFile, saveContractInfoToFileAsJson } from 'tests/setup/nodePersistence';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING } from 'tests/setup/tokensToDeployForTesting';
import { TestExternalToken, TokensToDeployForTesting } from 'tests/setup/tokensToDeployForTesting.types';
import ATokenContract from 'typechain/contracts/a_token';
import Psp22EmitableContract from 'typechain/contracts/psp22_emitable';
import VTokenContract from 'typechain/contracts/v_token';
import BalanceViewerDeployer from 'typechain/deployers/balance_viewer';
import Psp22EmitableDeployer from 'typechain/deployers/psp22_emitable';
import { AssetRules } from 'typechain/types-arguments/lending_pool';

const RESERVE_TOKEN_TO_ADD: TestExternalToken & { stableRule?: AssetRules; cryptoRule?: AssetRules } = {
  metadata: { name: 'SOLANA', symbol: 'SOL', decimals: 9 },

  fees: {
    depositFeeE6: 0,
    debtFeeE6: 0,
  },
  interestRateModelE18: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
  defaultRule: { collateralCoefficientE6: toE(6, 0.75), borrowCoefficientE6: toE(6, 1.25), penaltyE6: toE(6, 0.1) },

  //uncomment if you want to add asset to stable rule and adjust coefficients accordingly
  // stableRule: { collateralCoefficientE6: toE(6, 0.98), borrowCoefficientE6: toE(6, 1.02), penaltyE6: toE(6, 0.02) },

  //uncomment if you want to add asset to crypto rule and adjust coefficients accordingly
  // cryptoRule: { collateralCoefficientE6: toE(6, 0.98), borrowCoefficientE6: toE(6, 1.02), penaltyE6: toE(6, 0.02) },
  restrictions: { maximalTotalDeposit: null, maximalTotalDebt: null, minimalCollateral: 2000000, minimalDebt: 1000000 },
};

const DEPLOYED_TOKENS_PATH = path.join(__dirname, 'deployedContracts.azero.testnet.json');

type TokenReserve = {
  underlying: Psp22EmitableContract;
  aToken: ATokenContract;
  vToken: VTokenContract;
  decimals: number;
};

(async () => {
  if (require.main !== module) return;
  const wsEndpoint = process.env.WS_ENDPOINT;
  if (!wsEndpoint) throw 'could not determine wsEndpoint';
  const seed = process.env.SEED;
  if (!seed) throw 'could not determine seed';
  const api = await apiProviderWrapper.getAndWaitForReady();

  const timestamp = await api.query.timestamp.now();
  console.log(new Date(parseInt(timestamp.toString())));

  const keyring = new Keyring();
  const signer = keyring.createFromUri(seed, {}, 'sr25519'); // getSigners()[0];

  const contracts = await readContractsFromFile(DEPLOYED_TOKENS_PATH);

  const reservesWithLendingTokens: Record<string, TokenReserve> = contracts.reserves;
  //TODO
  const reserve = (
    await new Psp22EmitableDeployer(api, signer).new(
      RESERVE_TOKEN_TO_ADD.metadata.name,
      `Reserve ${RESERVE_TOKEN_TO_ADD.metadata.name} token`,
      RESERVE_TOKEN_TO_ADD.metadata.decimals,
    )
  ).contract;
  if (process.env.DEBUG)
    console.log(`${RESERVE_TOKEN_TO_ADD.metadata.name} | insert reserve token price, deploy A/S/V tokens and register as an asset`);
  const { aToken, vToken } = await registerNewAsset(
    api,
    signer,
    contracts.lendingPool,
    reserve.address,
    contracts.aTokenCodeHash,
    contracts.vTokenCodeHash,
    RESERVE_TOKEN_TO_ADD.metadata.name,
    RESERVE_TOKEN_TO_ADD.metadata.symbol,
    RESERVE_TOKEN_TO_ADD.metadata.decimals,
    RESERVE_TOKEN_TO_ADD.defaultRule,
    RESERVE_TOKEN_TO_ADD.restrictions,
    RESERVE_TOKEN_TO_ADD.fees,
    RESERVE_TOKEN_TO_ADD.interestRateModelE18,
  );
  console.log('inserting token price');
  const qr = await contracts.priceFeedProvider
    .withSigner(signer)
    .query.setAccountSymbol(reserve.address, RESERVE_TOKEN_TO_ADD.metadata.symbol + '/USD');
  await contracts.priceFeedProvider.withSigner(signer).tx.setAccountSymbol(reserve.address, RESERVE_TOKEN_TO_ADD.metadata.symbol + '/USD');
  reservesWithLendingTokens[RESERVE_TOKEN_TO_ADD.metadata.name] = {
    underlying: reserve,
    aToken,
    vToken,
    decimals: RESERVE_TOKEN_TO_ADD.metadata.decimals,
  };

  if (RESERVE_TOKEN_TO_ADD.stableRule) {
    // stable id - 1
    await contracts.lendingPool.withSigner(signer).tx.modifyAssetRule(1, reserve.address, RESERVE_TOKEN_TO_ADD.stableRule);
  }

  if (RESERVE_TOKEN_TO_ADD.cryptoRule) {
    // crypto id - 2
    await contracts.lendingPool.withSigner(signer).tx.modifyAssetRule(2, reserve.address, RESERVE_TOKEN_TO_ADD.cryptoRule);
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
        name: contracts.balanceViewer.name,
        address: contracts.balanceViewer.address,
      },
      {
        name: contracts.lendingPool.name,
        address: contracts.lendingPool.address,
      },
      {
        name: contracts.priceFeedProvider.name,
        address: contracts.priceFeedProvider.address,
      },
    ],
    DEPLOYED_TOKENS_PATH,
  );

  await api.disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
