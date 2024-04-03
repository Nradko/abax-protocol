import { KeyringPair } from '@polkadot/keyring/types';
import { ChildProcess } from 'child_process';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState, storeTimestamp } from 'tests/setup/nodePersistence';
import ATokenContract from '../../../typechain/contracts/a_token';
import BalanceViewer from '../../../typechain/contracts/balance_viewer';
import DiaOracleContract from '../../../typechain/contracts/dia_oracle';
import LendingPoolContract from '../../../typechain/contracts/lending_pool';
import PriceFeedProvider from '../../../typechain/contracts/price_feed_provider';
import PSP22Emitable from '../../../typechain/contracts/psp22_emitable';
import StableToken from '../../../typechain/contracts/stable_token';
import VTokenContract from '../../../typechain/contracts/v_token';
import { ApiPromise } from '@polkadot/api';

export type TokenReserve = {
  underlying: PSP22Emitable;
  aToken: ATokenContract;
  vToken: VTokenContract;
  decimals: number;
};

export type StableReserve = {
  underlying: StableToken;
  aToken: ATokenContract;
  vToken: VTokenContract;
  decimals: number;
};

export type TestEnvReserves = Record<string, TokenReserve>;
export type TestEnvStables = Record<string, StableReserve>;
export interface TestEnv {
  accounts: KeyringPair[];
  owner: KeyringPair;
  lendingPool: LendingPoolContract;
  reserves: TestEnvReserves;
  stables: TestEnvStables;
  priceFeedProvider: PriceFeedProvider;
  oracle: DiaOracleContract;
  aTokenCodeHash: string;
  vTokenCodeHash: string;
  balanceViewer: BalanceViewer;
  api: ApiPromise;
}

function makeSuiteInternal(
  mode: 'none' | 'skip' | 'only',
  name: string,
  generateTests: (getTestEnv: () => TestEnv) => void,
  skipRegenerateEnvBeforeEach = false,
) {
  let hasAnyStoryStepFailed = false;
  (mode === 'none' ? describe : describe[mode])(`[Make Suite] ${name}`, () => {
    let suiteTestEnv: TestEnv;
    let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
    before(async () => {
      if (!skipRegenerateEnvBeforeEach) return;

      getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
      await apiProviderWrapper.getAndWaitForReady();
      suiteTestEnv = await readContractsFromFile();
    });

    beforeEach(async function (this) {
      if (hasAnyStoryStepFailed && skipRegenerateEnvBeforeEach) {
        this.skip();
        return;
      }
      if (skipRegenerateEnvBeforeEach) {
        await apiProviderWrapper.getAndWaitForReady();
        return;
      }

      getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
      await apiProviderWrapper.getAndWaitForReady();
      suiteTestEnv = await readContractsFromFile();
    });

    generateTests(() => suiteTestEnv);

    afterEach(async function (this) {
      if (this.currentTest?.state === 'failed') {
        hasAnyStoryStepFailed = true;
      }
    });

    after(async () => {
      await apiProviderWrapper.closeApi();
      await storeTimestamp();
      getContractsNodeProcess()?.kill();
    });
  });
}

export function makeSuite(name: string, generateTests: (getTestEnv: () => TestEnv) => void, skipRegenerateEnvBeforeEach = false) {
  makeSuiteInternal('none', name, generateTests, skipRegenerateEnvBeforeEach);
}
makeSuite.only = function (name: string, generateTests: (getTestEnv: () => TestEnv) => void, skipRegenerateEnvBeforeEach = false) {
  makeSuiteInternal('only', name, generateTests, skipRegenerateEnvBeforeEach);
};
makeSuite.skip = function (name: string, generateTests: (getTestEnv: () => TestEnv) => void, skipRegenerateEnvBeforeEach = false) {
  makeSuiteInternal('skip', name, generateTests, skipRegenerateEnvBeforeEach);
};
