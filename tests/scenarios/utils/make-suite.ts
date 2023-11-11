import { ChildProcess } from 'child_process';
import { readContractsFromFile, restartAndRestoreNodeState, sleep } from 'tests/setup/nodePersistence';
import ATokenContract from '../../../typechain/contracts/a_token';
import BalanceViewer from '../../../typechain/contracts/balance_viewer';
import LendingPoolContract from '../../../typechain/contracts/lending_pool';
import BlockTimestampProvider from '../../../typechain/contracts/block_timestamp_provider';
import PSP22Emitable from '../../../typechain/contracts/psp22_emitable';
import StableToken from '../../../typechain/contracts/stable_token';
import VTokenContract from '../../../typechain/contracts/v_token';
import PriceFeedProvider from '../../../typechain/contracts/price_feed_provider';
import DiaOracleContract from '../../../typechain/contracts/dia_oracle';
import { KeyringPair } from '@polkadot/keyring/types';
import { apiProviderWrapper } from 'tests/setup/helpers';

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
  users: KeyringPair[];
  owner: KeyringPair;
  lendingPool: LendingPoolContract;
  reserves: TestEnvReserves;
  stables: TestEnvStables;
  blockTimestampProvider: BlockTimestampProvider;
  priceFeedProvider: PriceFeedProvider;
  oracle: DiaOracleContract;
  aTokenCodeHash: number[];
  vTokenCodeHash: number[];
  balanceViewer: BalanceViewer;
}

function makeSuiteInternal(
  mode: 'none' | 'skip' | 'only',
  name: string,
  generateTests: (getTestEnv: () => TestEnv) => void,
  skipRegenerateEnvBeforeEach = false,
) {
  let hasAnyStoryStepFailed = false;
  (mode === 'none' ? describe : describe[mode])(`[Scenario Suite] ${name}`, () => {
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
        await sleep(1000);
      }
    });

    after(async () => {
      await apiProviderWrapper.closeApi();
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
