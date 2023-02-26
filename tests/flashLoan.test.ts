import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import { makeSuite, TestEnv, TokenReserve } from './scenarios/utils/make-suite';
import { E18, E6 } from './scenarios/utils/misc';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import { deployFlashLoanReceiverMock } from './setup/deploymentHelpers';
import { expect } from './setup/chai';
import { FlashLoanReceiverErrorBuilder, PSP22ErrorBuilder } from 'typechain/types-returns/lending_pool_v0_flash_facet';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import { FLASH_BORROWER } from './access_control.test';

makeSuite('Flash Loan', (getTestEnv) => {
  const amountWETHToDeposit = new BN((10 * E18).toString());
  let testEnv: TestEnv;
  let depositor: KeyringPair;
  let reserveWETH: TokenReserve;
  let flashLoanReceiver: FlashLoanReceiverMock;
  beforeEach(async () => {
    testEnv = getTestEnv();
    depositor = testEnv.users[0];
    reserveWETH = testEnv.reserves['WETH'];
    flashLoanReceiver = await deployFlashLoanReceiverMock(depositor);
    await reserveWETH.underlying.tx.mint(depositor.address, amountWETHToDeposit);
    await reserveWETH.underlying.withSigner(depositor).tx.approve(testEnv.lendingPool.address, amountWETHToDeposit);
    await testEnv.lendingPool.withSigner(depositor).tx.deposit(reserveWETH.underlying.address, depositor.address, amountWETHToDeposit, []);
  });

  it('Takes WETH flashloan and returns the funds correctly', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const tx = testEnv.lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
  });

  it('for flashBorrower taking WETH flashloan is cheaper than for other user', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const wethPoolBalance0 = await testEnv.reserves['WETH'].underlying.query.balanceOf(testEnv.lendingPool.address);
    await testEnv.lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    const wethPoolBalance1 = await testEnv.reserves['WETH'].underlying.query.balanceOf(testEnv.lendingPool.address);
    await testEnv.lendingPool.withSigner(testEnv.owner).tx.grantRole(FLASH_BORROWER, testEnv.owner.address);
    await testEnv.lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
    const wethPoolBalance2 = await testEnv.reserves['WETH'].underlying.query.balanceOf(testEnv.lendingPool.address);

    const diff1 = wethPoolBalance1.value.unwrap().rawNumber.sub(wethPoolBalance0.value.unwrap().rawNumber);
    const diff2 = wethPoolBalance2.value.unwrap().rawNumber.sub(wethPoolBalance1.value.unwrap().rawNumber);
    expect(diff1.toString()).to.equal(amountToBorrow.divn(1000).toString());
    expect(diff2.toString()).to.equal(amountToBorrow.divn(10000).toString());
  });

  it('Takes WETH flashloan but fails the operation', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    // set borrower to fail transaction
    await flashLoanReceiver.tx.setFailExecuteOperation(true);

    const queryRes = (await testEnv.lendingPool.query.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []))
      .value.ok;
    expect(queryRes).to.have.deep.property(
      'err',
      LendingPoolErrorBuilder.FlashLoanReceiverError(FlashLoanReceiverErrorBuilder.ExecuteOperationFailed()),
    );
  });
  it('tries to take a flashloan using a non contract address as receiver (revert expected)', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await expect(testEnv.lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually
      .be.rejected;
  });
  it('Takes WETH flashloan - does not approve the transfer of the funds', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const amountToApprove = amountToBorrow.divn(2);
    await flashLoanReceiver.tx.setCustomAmountToApprove(amountToApprove);
    await expect(testEnv.lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually
      .be.rejected;
  });
  it('Takes WETH flashloan - does not have sufficient balance to cover the fee', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await flashLoanReceiver.tx.setSimulateBalanceToCoverFee(false);
    await expect(testEnv.lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually
      .be.rejected;
  });
  it('Takes WETH flashloan - the amount is bigger than the available liquidity', async () => {
    const amountToBorrow = amountWETHToDeposit.addn(E6);
    const res = (await testEnv.lendingPool.query.flashLoan(testEnv.users[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).value
      .ok;
    await expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.PSP22Error(PSP22ErrorBuilder.InsufficientBalance()));
  });
});
