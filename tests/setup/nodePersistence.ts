import chalk from 'chalk';
import { ChildProcess, spawn } from 'child_process';
import findProcess from '@c-forge/find-process';
import fs from 'fs-extra';
import path from 'path';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import AToken from '../../typechain/contracts/a_token';
import BalanceViewer from '../../typechain/contracts/balance_viewer';
import LendingPool from '../../typechain/contracts/lending_pool';
import PSP22Emitable from '../../typechain/contracts/test_psp22';
import DiaOracle from '../../typechain/contracts/dia_oracle';
import PriceFeedProvider from '../../typechain/contracts/price_feed_provider';
import VToken from '../../typechain/contracts/v_token';
import StableToken from '../../typechain/contracts/stable_token';
import { apiProviderWrapper, getSigners } from './helpers';
import { getContractObject } from '@abaxfinance/contract-helpers';
import { time } from '@c-forge/polkahat-network-helpers';

export const DEFAULT_DEPLOYED_CONTRACTS_INFO_PATH = `${path.join(__dirname, 'deployedContracts.json')}`;

export interface StoredContractInfo {
  name: string;
  address?: string;
  reserveName?: string;
  stableName?: string;
  codeHash?: string;
}

export const saveContractInfoToFileAsJson = async (contractInfos: StoredContractInfo[], writePath = DEFAULT_DEPLOYED_CONTRACTS_INFO_PATH) => {
  await fs.writeJSON(writePath, contractInfos);
};

const logToFile = (data: string) => {
  if (!process.env.PWD) throw 'could not determine pwd';
  fs.appendFile(path.join(process.env.PWD, `substrate-contracts-node.testrun.log`), data, { encoding: 'utf-8' });
};
export const sleep = (waitTimeInMs) => new Promise((resolve) => setTimeout(resolve, waitTimeInMs));

export async function waitFor(valueGetter: () => any, logMessage = 'Waiting for value...') {
  while (!valueGetter()) {
    console.log(logMessage);
    await sleep(1000);
  }
}

const spawnContractsNode = async (testChainStateLocation: string) => {
  if (!process.env.PWD) throw 'could not determine pwd';
  const command = path.join(process.env.PWD, 'substrate-contracts-node');
  const cliArgs = [
    '--dev',
    '--base-path',
    `${testChainStateLocation}`,
    '--rpc-max-connections',
    '1000',
    '--max-runtime-instances',
    '256',
    '--rpc-port',
    '9944',
  ];
  const contractsNodeProcess = spawn(command, cliArgs, { cwd: process.env.PWD, stdio: 'overlapped' });

  contractsNodeProcess.on('exit', function (code) {
    if (code === null || code === 0) return code ?? 0;
    throw code;
  });
  contractsNodeProcess.on('error', function (err) {
    throw err;
  });

  const waitForStartupFinish = new Promise<ChildProcess>((resolve) => {
    const endOfBootSequenceStr = `Running JSON-RPC server: addr=127.0.0.1:9944`;

    contractsNodeProcess.stderr?.on('data', (data: string) => {
      logToFile(data);
      if (data.includes(endOfBootSequenceStr)) {
        resolve(contractsNodeProcess);
      }
    });
    contractsNodeProcess.stdout?.on('data', logToFile);
  });

  await waitForStartupFinish;
  return contractsNodeProcess;
};

export const restartAndRestoreNodeState = async (getOldContractsNodeProcess: () => ChildProcess | undefined) => {
  try {
    if (!process.env.PWD) throw 'could not determine pwd';
    const testChainStateLocation = path.join(process.env.PWD, 'test-chain-state');
    await apiProviderWrapper.closeApi();
    await restoreTestChainState(getOldContractsNodeProcess(), testChainStateLocation);
    const contractsNodeProcess = await spawnContractsNode(testChainStateLocation);

    contractsNodeProcess.stderr?.on('data', (data: string) => {
      logToFile(data);
    });
    contractsNodeProcess.stdout?.on('data', logToFile);

    await apiProviderWrapper.getAndWaitForReady();
    await restoreTimestamp();
    return () => contractsNodeProcess;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const readContractsFromFile = async (writePath = DEFAULT_DEPLOYED_CONTRACTS_INFO_PATH): Promise<TestEnv> => {
  const api = await apiProviderWrapper.getAndWaitForReady();
  const contracts = JSON.parse(await fs.readFile(writePath, 'utf8')) as StoredContractInfo[];

  const [owner, ...accounts] = getSigners();

  const lendingPoolContractInfo = contracts.find((c) => c.name === 'lending_pool');
  if (!lendingPoolContractInfo) throw 'lendingPool ContractInfo not found';
  const lendingPool = await getContractObject(LendingPool, lendingPoolContractInfo.address!, owner, api);

  const priceFeedProviderContractInfo = contracts.find((c) => c.name === 'price_feed_provider');
  if (!priceFeedProviderContractInfo) throw 'price_feed_provider ContractInfo not found';
  const priceFeedProvider = await getContractObject(PriceFeedProvider, priceFeedProviderContractInfo.address!, owner, api);

  const oracleInfo = contracts.find((c) => c.name === 'dia_oracle');
  if (!oracleInfo) throw 'dia_oracle ContractInfo not found';
  const oracle = await getContractObject(DiaOracle, oracleInfo.address!, owner, api);

  const reservesContracts = contracts.filter((c) => c.reserveName);

  const reservesWithLendingTokens = {} as TestEnv['reserves'];
  for (const contractInfo of reservesContracts) {
    if (!contractInfo.reserveName) continue;
    switch (contractInfo.name) {
      case 'test_psp22': {
        const reserve = await getContractObject(PSP22Emitable, contractInfo.address!, owner, api);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], underlying: reserve };
        break;
      }
      case 'a_token': {
        const aToken = await getContractObject(AToken, contractInfo.address!, owner, api);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], aToken };
        break;
      }
      case 'v_token': {
        const vToken = await getContractObject(VToken, contractInfo.address!, owner, api);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], vToken };
        break;
      }
    }
  }

  const stableContracts = contracts.filter((c) => c.stableName);

  const stablesWithLendingTokens = {} as TestEnv['stables'];
  for (const contractInfo of stableContracts) {
    if (!contractInfo.stableName) continue;
    switch (contractInfo.name) {
      case 'stable_token': {
        const reserve = await getContractObject(StableToken, contractInfo.address!, owner, api);
        stablesWithLendingTokens[contractInfo.stableName] = { ...stablesWithLendingTokens[contractInfo.stableName], underlying: reserve };
        break;
      }
      case 'a_token': {
        const aToken = await getContractObject(AToken, contractInfo.address!, owner, api);
        stablesWithLendingTokens[contractInfo.stableName] = { ...stablesWithLendingTokens[contractInfo.stableName], aToken };
        break;
      }
      case 'v_token': {
        const vToken = await getContractObject(VToken, contractInfo.address!, owner, api);
        stablesWithLendingTokens[contractInfo.stableName] = { ...stablesWithLendingTokens[contractInfo.stableName], vToken };
        break;
      }
    }
  }

  const balanceViewerContractInfo = contracts.find((c) => c.name === 'balance_viewer');
  if (!balanceViewerContractInfo) throw 'BalanceViewer ContractInfo not found';
  const balanceViewer = await getContractObject(BalanceViewer, balanceViewerContractInfo.address!, owner, api);

  return {
    accounts: accounts,
    owner,
    lendingPool: lendingPool,
    oracle: oracle,
    priceFeedProvider: priceFeedProvider,
    reserves: reservesWithLendingTokens,
    stables: stablesWithLendingTokens,
    aTokenCodeHash: contracts.find((c) => c.name === 'aTokenCodeHash')!.codeHash!,
    vTokenCodeHash: contracts.find((c) => c.name === 'vTokenCodeHash')!.codeHash!,
    balanceViewer,
    api: api,
  };
};

async function restoreTestChainState(oldContractsNodeProcess: ChildProcess | undefined, testChainStateLocation: string) {
  try {
    if (!process.env.PWD) throw 'could not determine pwd';
    const backupLocation = path.join(process.env.PWD, 'test-chain-state-bp');
    if (oldContractsNodeProcess) {
      oldContractsNodeProcess.kill();
    }

    const existingProcessesListeningOnPort = await findProcess('port', 9944, { logLevel: 'error' });
    for (const p of existingProcessesListeningOnPort) {
      if (process.env.DEBUG)
        console.log(chalk.yellow(`Killing process `) + chalk.magenta(p.name) + `(${chalk.italic(p.cmd)})` + ` occupying test port\n\n`);
      process.kill(p.pid);
      await sleep(50);
    }

    fs.rmSync(testChainStateLocation, { force: true, recursive: true });
    fs.copySync(backupLocation, testChainStateLocation);
  } catch (e) {
    console.log(chalk.yellow(JSON.stringify(e, null, 2)));
    console.log('sleeping for 100ms then retrying...');
    await sleep(100);
    restoreTestChainState(oldContractsNodeProcess, testChainStateLocation);
  }
}

export async function storeTimestamp() {
  if (!process.env.PWD) throw 'could not determine pwd';
  const timestampBackupLocation = path.join(process.env.PWD, 'test-chain-timestamp');

  const api = await apiProviderWrapper.getAndWaitForReady(false);
  const timestamp = await api.query.timestamp.now();
  if (process.env.DEBUG) console.log(`storing timestamp to: ${timestamp}`);
  fs.writeFileSync(timestampBackupLocation, timestamp.toString());
}

export async function restoreTimestamp(): Promise<void> {
  try {
    if (!process.env.PWD) throw 'could not determine pwd';
    const timestampBackupLocation = path.join(process.env.PWD, 'test-chain-timestamp');
    let storedValue;
    if (fs.existsSync(timestampBackupLocation)) {
      storedValue = parseInt(fs.readFileSync(timestampBackupLocation, 'utf-8'), 10);
    }
    const api = await apiProviderWrapper.getAndWaitForReady(false);
    if (typeof storedValue === 'number') {
      await time.setTo(storedValue, api);
    } else {
      // used to push fake_timestamp equal to current timestamp
      await time.setTo(Date.now(), api);
    }
  } catch (error) {
    console.error('Error reading file:', error);
  }
}
