import { BN } from 'bn.js';
import { ChildProcess } from 'child_process';
import { ONE_YEAR } from './consts';
import { approve } from './scenarios/utils/actions';
import { TestEnv } from './scenarios/utils/make-suite';
import { E12, E6 } from './scenarios/utils/misc';
import { expect } from './setup/chai';
import { apiProviderWrapper } from './setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';

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

  // !! actions do not longer trigger overflow as U256 is used for calculations !!
  // it('Trigger overflow by borrow action', async () => {
  //   const reserveSymbol = 'DAI';
  //   const reserve2Symbol = 'USDC';
  //   const reserve = testEnv.reserves[reserveSymbol].underlying;
  //   const reserve2 = testEnv.reserves[reserve2Symbol].underlying;
  //   const user = testEnv.users[0];
  //   const user2 = testEnv.users[1];
  //   const amountToDeposit = U128_MAX_VALUE.subn(E6);

  //   await reserve.tx.mint(user.address, U128_MAX_VALUE);
  //   await approve(reserveSymbol, user, testEnv, U128_MAX_VALUE);
  //   await reserve2.tx.mint(user2.address, U128_MAX_VALUE);
  //   await approve(reserve2Symbol, user2, testEnv, U128_MAX_VALUE);

  //   await testEnv.lendingPool.withSigner(user).tx.deposit(reserve.address, user.address, amountToDeposit, []);
  //   await testEnv.lendingPool.withSigner(user).tx.setAsCollateral(reserve.address, true);
  //   await testEnv.lendingPool.withSigner(user2).tx.deposit(reserve2.address, user2.address, amountToDeposit, []);
  //   await testEnv.lendingPool.withSigner(user2).tx.setAsCollateral(reserve2.address, true);

  //   // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  //   const amountToBorrow = amountToDeposit.muln(4).divn(5);
  //   await expect(testEnv.lendingPool.withSigner(user2).query.borrow(reserve.address, user2.address, amountToBorrow, [0])).to.eventually.be.fulfilled;
  // });
  it('Trigger overflow by time travel', async () => {
    const reserveSymbol = 'DAI';
    const reserve2Symbol = 'USDC';
    const reserve = testEnv.reserves[reserveSymbol].underlying;
    const reserve2 = testEnv.reserves[reserve2Symbol].underlying;
    const user = testEnv.users[0];
    const user2 = testEnv.users[1];
    const amountToDeposit = U128_MAX_VALUE.sub(new BN(E12.toString()));

    await reserve.tx.mint(user.address, amountToDeposit);
    await approve(reserveSymbol, user, testEnv, amountToDeposit);
    await reserve2.tx.mint(user2.address, amountToDeposit);
    await approve(reserve2Symbol, user2, testEnv, amountToDeposit);

    await testEnv.lendingPool.withSigner(user).tx.deposit(reserve.address, user.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(user).tx.setAsCollateral(reserve.address, true);
    await testEnv.lendingPool.withSigner(user2).tx.deposit(reserve2.address, user2.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(user2).tx.setAsCollateral(reserve2.address, true);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const amountToBorrow = amountToDeposit.muln(2).divn(3);
    await testEnv.lendingPool.withSigner(user2).tx.borrow(reserve.address, user2.address, amountToBorrow, [0]);
    await testEnv.blockTimestampProvider.tx.increaseBlockTimestamp(ONE_YEAR);

    await expect(testEnv.lendingPool.query.accumulateUserInterest(reserve.address, user.address)).to.eventually.be.rejected;
  });
});
