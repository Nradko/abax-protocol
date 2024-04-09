import { KeyringPair } from '@polkadot/keyring/types';
import FlashLoanReceiverMock from 'typechain/contracts/flash_loan_receiver_mock';
import FlashLoanReceiverMockDeployer from 'typechain/deployers/flash_loan_receiver_mock';
import {
  FlashLoanReceiverError,
  FlashLoanReceiverErrorBuilder,
  LendingPoolErrorBuilder,
  PSP22ErrorBuilder,
} from 'typechain/types-returns/lending_pool';
import { E18bn, E6bn } from '@c-forge/polkahat-network-helpers';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { ROLES } from './consts';
import { TestEnv, TokenReserve, makeSuite } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import FeeReductionProviderMockDeployer from 'typechain/deployers/fee_reduction_provider_mock';
import FeeReductionProviderMockContract from 'typechain/contracts/fee_reduction_provider_mock';

makeSuite('Flash Loan', (getTestEnv) => {
  const amountWETHToDeposit = E18bn.muln(10);
  let testEnv: TestEnv;
  let depositor: KeyringPair;
  let reserveWETH: TokenReserve;
  let flashLoanReceiver: FlashLoanReceiverMock;
  let lendingPool: LendingPoolContract;
  beforeEach(async () => {
    testEnv = getTestEnv();
    depositor = testEnv.accounts[0];
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

  describe(`Fee Reduction Provider is set`, () => {
    let feeReductionProviderMock: FeeReductionProviderMockContract;
    beforeEach(async () => {
      feeReductionProviderMock = (await new FeeReductionProviderMockDeployer(testEnv.api, testEnv.owner).new()).contract;

      await lendingPool.withSigner(testEnv.owner).tx.setFeeReductionProvider(feeReductionProviderMock.address);
    });

    it("just setting fee provider doesn't change the fee", async () => {
      const amountToBorrow = amountWETHToDeposit.divn(2);
      const fee = amountToBorrow.divn(1000);
      const tx = await lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
      await expect(tx).to.changePSP22Balances(reserveWETH.underlying, [lendingPool.address], [fee]);
    });

    for (const fee_reduction_e6 of [0, 500_000, 1_000_000]) {
      it(`setting flash_loan_fee_reducion_e6 to ${fee_reduction_e6} should reduce fee correctly `, async () => {
        await feeReductionProviderMock.tx.setFlashLoanFeeReduction(null, fee_reduction_e6);
        const amountToBorrow = amountWETHToDeposit.divn(2);
        const fee = amountToBorrow
          .divn(1000)
          .muln(1_000_000 - fee_reduction_e6)
          .divn(1_000_000);
        const tx = await lendingPool.tx.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []);
        await expect(tx).to.changePSP22Balances(reserveWETH.underlying, [lendingPool.address], [fee]);
      });
    }
  });

  it('Takes WETH flashloan but fails the operation', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    // set borrower to fail transaction
    await flashLoanReceiver.tx.setFailExecuteOperation(true);

    await expect(
      lendingPool.query.flashLoan(flashLoanReceiver.address, [reserveWETH.underlying.address], [amountToBorrow], []),
    ).to.be.revertedWithError(LendingPoolErrorBuilder.FlashLoanReceiverError(FlashLoanReceiverErrorBuilder.Custom('ExecuteOperationFailed')));
  });
  it('tries to take a flashloan using a non contract address as receiver (revert expected)', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await expect(lendingPool.query.flashLoan(testEnv.accounts[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - does not approve the transfer of the funds', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    const amountToApprove = amountToBorrow.divn(2);
    await flashLoanReceiver.tx.setCustomAmountToApprove(amountToApprove);
    await expect(lendingPool.query.flashLoan(testEnv.accounts[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - does not have sufficient balance to cover the fee', async () => {
    const amountToBorrow = amountWETHToDeposit.divn(2);
    await flashLoanReceiver.tx.setSimulateBalanceToCoverFee(false);
    await expect(lendingPool.query.flashLoan(testEnv.accounts[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).to.eventually.be
      .rejected;
  });
  it('Takes WETH flashloan - the amount is bigger than the available liquidity', async () => {
    const amountToBorrow = amountWETHToDeposit.add(E6bn);
    const res = (await lendingPool.query.flashLoan(testEnv.accounts[1].address, [reserveWETH.underlying.address], [amountToBorrow], [])).value.ok;
    await expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.PSP22Error(PSP22ErrorBuilder.InsufficientBalance()));
  });
});
