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

  it('Trigger overflow by borrow action, during value calculation in getUserCollateralCoefficient', async () => {
    const reserveSymbol = 'DAI';
    const reserve2Symbol = 'USDC';
    const reserve = testEnv.reserves[reserveSymbol].underlying;
    const reserve2 = testEnv.reserves[reserve2Symbol].underlying;
    const user = testEnv.users[0];
    const user2 = testEnv.users[1];
    const amountToDeposit = U128_MAX_VALUE.subn(E6);

    await reserve.tx.mint(user.address, U128_MAX_VALUE);
    await approve(reserveSymbol, user, testEnv, U128_MAX_VALUE);
    await reserve2.tx.mint(user2.address, U128_MAX_VALUE);
    await approve(reserve2Symbol, user2, testEnv, U128_MAX_VALUE);

    await testEnv.lendingPool.withSigner(user).tx.deposit(reserve.address, user.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(user).tx.setAsCollateral(reserve.address, true);
    await testEnv.lendingPool.withSigner(user2).tx.deposit(reserve2.address, user2.address, amountToDeposit, []);
    await testEnv.lendingPool.withSigner(user2).tx.setAsCollateral(reserve2.address, true);

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const amountToBorrow = amountToDeposit.muln(4).divn(5);
    await expect(testEnv.lendingPool.withSigner(user2).tx.borrow(reserve.address, user2.address, amountToBorrow, [0])).to.eventually.be.rejected;
  });
  // !! it is hard to trigger mathoverflow by time travel !! TODO ??
  // it('Trigger overflow by time travel', async () => {
  //   const reserveSymbol = 'DAI';
  //   const reserve2Symbol = 'USDC';
  //   const reserve = testEnv.reserves[reserveSymbol].underlying;
  //   const reserve2 = testEnv.reserves[reserve2Symbol].underlying;
  //   const supplier = testEnv.users[0];
  //   const borrower = testEnv.users[1];
  //   const amountBorrowable = U128_MAX_VALUE.div(new BN(E12.toString()));
  //   const collateralAmount = U128_MAX_VALUE.div(new BN(E12.toString())).muln(2);

  //   await reserve.tx.mint(supplier.address, amountBorrowable);
  //   await approve(reserveSymbol, supplier, testEnv, amountBorrowable);
  //   await reserve2.tx.mint(borrower.address, collateralAmount);
  //   await approve(reserve2Symbol, borrower, testEnv, collateralAmount);

  //   await testEnv.lendingPool.withSigner(supplier).tx.deposit(reserve.address, supplier.address, amountBorrowable, []);
  //   await testEnv.lendingPool.withSigner(supplier).tx.setAsCollateral(reserve.address, true);
  //   await testEnv.lendingPool.withSigner(borrower).tx.deposit(reserve2.address, borrower.address, collateralAmount, []);
  //   await testEnv.lendingPool.withSigner(borrower).tx.setAsCollateral(reserve2.address, true);

  //   // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  //   const amountToBorrow = amountBorrowable;
  //   await testEnv.lendingPool.withSigner(borrower).tx.borrow(reserve.address, borrower.address, amountToBorrow, [0]);
  //   await testEnv.blockTimestampProvider.tx.increaseBlockTimestamp(ONE_YEAR.mul(1000));

  //   await expect(testEnv.lendingPool.tx.accumulateUserInterest(reserve.address, supplier.address)).to.eventually.be.rejected;
  // });
});
