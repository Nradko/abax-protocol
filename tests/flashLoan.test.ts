import { KeyringPair } from '@polkadot/keyring/types';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import FlashLoanReceiverMockDeployer from 'typechain/deployers/flash_loan_receiver_mock';
import { FlashLoanReceiverError, LendingPoolErrorBuilder, PSP22ErrorBuilder } from 'typechain/types-returns/lending_pool';
import { E18bn, E6bn } from 'wookashwackomytest-polkahat-network-helpers';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { ROLES } from './consts';
import { TestEnv, TokenReserve, makeSuite } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';

const FLASH_BORROWER = ROLES['FLASH_BORROWER'];

makeSuite('Flash Loan', (getTestEnv) => {
  const amountWETHToDeposit = E18bn.muln(10);
  let testEnv: TestEnv;
  let depositor: KeyringPair;
  let reserveWETH: TokenReserve;
  let flashLoanReceiver: FlashLoanReceiverMock;
  let lendingPool: LendingPoolContract;
  beforeEach(async () => {
    testEnv = getTestEnv();
    depositor = testEnv.users[0];
    reserveWETH = testEnv.reserves['WETH'];
    lendingPool = testEnv.lendingPool;
    flashLoanReceiver = (await new FlashLoanReceiverMockDeployer(testEnv.api, depositor).new()).contract;
    await reserveWETH.underlying.tx.mint(depositor.address, amountWETHToDeposit);
    await reserveWETH.underlying.withSigner(depositor).tx.approve(lendingPool.address, amountWETHToDeposit);
    await lendingPool.withSigner(depositor).tx.deposit(reserveWETH.underlying.address, depositor.address, amountWETHToDeposit, []);
  });

  it('Takes WETH flashloan and returns the funds correctly', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const tx = lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
  });

  it('for flashBorrower taking WETH flashloan is cheaper than for other user', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const wethPoolBalance0 = await testEnv.reserves['WETH'].underlying.query.balanceOf(lendingPool.address);
    await lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    const wethPoolBalance1 = await testEnv.reserves['WETH'].underlying.query.balanceOf(lendingPool.address);
    await lendingPool.withSigner(testEnv.owner).tx.grantRole(FLASH_BORROWER, testEnv.owner.address);
    await lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    const wethPoolBalance2 = await testEnv.reserves['WETH'].underlying.query.balanceOf(lendingPool.address);

    const diff1 = wethPoolBalance1.value.unwrap().sub(wethPoolBalance0.value.unwrap());
    const diff2 = wethPoolBalance2.value.unwrap().sub(wethPoolBalance1.value.unwrap());
    expect(diff1.toString()).to.equal(amountToBorrow.divn(1000).toString());
    expect(diff2.toString()).to.equal(amountToBorrow.divn(10000).toString());
  });

  it('Takes WETH flashloan but fails the operation', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    // set borrower to fail transaction
    await flashLoanReceiver.tx.setFailExecuteOperation(true);

    const queryRes = (await lendingPool.query.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], [])).value.ok;
    expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.FlashLoanReceiverError(FlashLoanReceiverError.executeOperationFailed));
  });
  it('tries to take a flashloan using a non contract address as receiver (revert expected)', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await expect(lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - does not approve the transfer of the funds', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const amountToApprove = amountToBorrow.divn(2);
    await flashLoanReceiver.tx.setCustomAmountToApprove(amountToApprove);
    await expect(lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - does not have sufficient balance to cover the fee', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await flashLoanReceiver.tx.setSimulateBalanceToCoverFee(false);
    await expect(lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - the amount is bigger than the available liquidity', async () => {
    const amountToBorrow = amountWETHToDeposit.add(E6bn);
    const res = (await lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).value.ok;
    await expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.PSP22Error(PSP22ErrorBuilder.InsufficientBalance()));
  });
});
