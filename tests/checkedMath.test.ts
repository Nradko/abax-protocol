import { BN } from 'bn.js';
import { ChildProcess } from 'child_process';
import { approve } from './scenarios/utils/actions';
import { TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { apiProviderWrapper } from './setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';
import { E6bn } from '@c-forge/polkahat-network-helpers';

const U128_MAX_VALUE = new BN('340282366920938463463374607431768211455');
describe('Checked Math', () => {
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  let testEnv: TestEnv;
  beforeEach(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
    testEnv = await readContractsFromFile();
  });
  afterEach(async () => {
    await apiProviderWrapper.closeApi();
    getContractsNodeProcess()?.kill();
  });

  it('Trigger overflow by setAsColalteral, during value calculation in getAccountCollateralCoefficient', async () => {
    const reserveSymbol = 'DAI';
    const reserve2Symbol = 'USDC';
    const reserve = testEnv.reserves[reserveSymbol].underlying;
    const reserve2 = testEnv.reserves[reserve2Symbol].underlying;
    const account = testEnv.accounts[0];
    const amountToDeposit = U128_MAX_VALUE.sub(E6bn);

    await reserve.tx.mint(account.address, U128_MAX_VALUE);
    await approve(reserveSymbol, account, testEnv, U128_MAX_VALUE);
    await reserve2.tx.mint(account.address, U128_MAX_VALUE);
    await approve(reserve2Symbol, account, testEnv, U128_MAX_VALUE);

    await testEnv.lendingPool.withSigner(account).tx.deposit(reserve.address, account.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(account).tx.deposit(reserve2.address, account.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(account).tx.setAsCollateral(reserve.address, true);
    await testEnv.lendingPool.withSigner(account).tx.setAsCollateral(reserve2.address, true);
    await expect(testEnv.lendingPool.withSigner(account).tx.setAsCollateral(reserve.address, false)).to.eventually.be.rejected;
  });
});
