import { ChildProcess, spawn } from 'child_process';
import fs, { write } from 'fs-extra';
import chalk from 'chalk';
import path from 'path';
import { TestEnv } from 'tests/scenarios/utils/make-suite';
import AToken from '../../typechain/contracts/a_token';
import LendingPool from '../../typechain/contracts/lending_pool';
import PSP22Emitable from '../../typechain/contracts/psp22_emitable';
import SToken from '../../typechain/contracts/s_token';
import VToken from '../../typechain/contracts/v_token';
import BalanceViewer from '../../typechain/contracts/balance_viewer';
import BlockTimestampProvider from '../../typechain/contracts/block_timestamp_provider';
import { getContractObject } from './deploymentHelpers';
import findProcess from 'find-process';
import { apiProviderWrapper, getSigners } from './helpers';

export const DEFAULT_DEPLOYED_CONTRACTS_INFO_PATH = `${path.join(__dirname, 'deployedContracts.json')}`;

interface StoredContractInfo {
  name: string;
  address: string;
  reserveName?: string;
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
    '--ws-max-connections',
    '1000',
    '--max-runtime-instances',
    '256',
    '--ws-port',
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
    const endOfBootSequenceStr = `Running JSON-RPC WS server: addr=127.0.0.1:9944`;

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
  return () => contractsNodeProcess;
};

export const readContractsFromFile = async (writePath = DEFAULT_DEPLOYED_CONTRACTS_INFO_PATH) => {
  const contracts = JSON.parse(await fs.readFile(writePath, 'utf8')) as StoredContractInfo[];

  const [owner, ...users] = getSigners();
  const lendingPoolContractInfo = contracts.find((c) => c.name === 'lending_pool');
  if (!lendingPoolContractInfo) throw 'lendingPool ContractInfo not found';
  const lendingPool = await getContractObject(LendingPool, lendingPoolContractInfo.address, owner);
  const blockTimestampProviderContractInfo = contracts.find((c) => c.name === 'block_timestamp_provider');
  if (!blockTimestampProviderContractInfo) throw 'BlockTimestampProvider ContractInfo not found';
  const blockTimestampProvider = await getContractObject(BlockTimestampProvider, blockTimestampProviderContractInfo.address, owner);

  const reservesContracts = contracts.filter((c) => c.reserveName);

  const reservesWithLendingTokens = {} as TestEnv['reserves'];
  for (const contractInfo of reservesContracts) {
    if (!contractInfo.reserveName) continue;
    switch (contractInfo.name) {
      case 'psp22_emitable': {
        const reserve = await getContractObject(PSP22Emitable, contractInfo.address, owner);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], underlying: reserve };
        break;
      }
      case 'a_token': {
        const aToken = await getContractObject(AToken, contractInfo.address, owner);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], aToken };
        break;
      }
      case 'v_token': {
        const vToken = await getContractObject(VToken, contractInfo.address, owner);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], vToken };
        break;
      }
      case 's_token': {
        const sToken = await getContractObject(SToken, contractInfo.address, owner);
        reservesWithLendingTokens[contractInfo.reserveName] = { ...reservesWithLendingTokens[contractInfo.reserveName], sToken };
        break;
      }
    }
  }

  const balanceViewerContractInfo = contracts.find((c) => c.name === 'balance_viewer');
  if (!balanceViewerContractInfo) throw 'BalanceViewer ContractInfo not found';
  const balanceViewer = await getContractObject(BalanceViewer, balanceViewerContractInfo.address, owner);

  return {
    users: users,
    owner,
    lendingPool: lendingPool,
    reserves: reservesWithLendingTokens,
    blockTimestampProvider,
    balanceViewer,
  };
};

async function restoreTestChainState(oldContractsNodeProcess: ChildProcess | undefined, testChainStateLocation: string) {
  if (!process.env.PWD) throw 'could not determine pwd';
  const backupLocation = path.join(process.env.PWD, 'test-chain-state-bp');
  if (oldContractsNodeProcess) {
    oldContractsNodeProcess.kill();
  }

  const existingProcessesListeningOnPort = await findProcess('port', 9944, { logLevel: 'error' });
  for (const p of existingProcessesListeningOnPort) {
    console.log(chalk.yellow(`Killing process `) + chalk.magenta(p.name) + `(${chalk.italic(p.cmd)})` + ` occupying test port\n\n`);
    process.kill(p.pid);
  }

  fs.rmSync(testChainStateLocation, { force: true, recursive: true });
  fs.copySync(backupLocation, testChainStateLocation);
}
