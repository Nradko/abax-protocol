import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';
import { PSP22ErrorBuilder } from 'typechain/types-returns/a_token';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { MAX_U128 } from './consts';
import { getCheckWithdrawParameters } from './scenarios/utils/actions';
import { checkWithdraw } from './scenarios/utils/comparisons';
import { TestEnv, TokenReserve, makeSuite } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { time } from '@c-forge/polkahat-network-helpers';

makeSuite('Unit Message', (getTestEnv) => {
  let testEnv: TestEnv;
  let accounts: KeyringPair[];
  let lendingPool: LendingPoolContract;
  beforeEach(async () => {
    testEnv = getTestEnv();
    accounts = testEnv.accounts;
    lendingPool = testEnv.lendingPool;
  });

  describe('Actions', () => {
    describe('Configure', () => {
      describe('setAsCollateral', () => {
        it('Fails if asset does not exist', async () => {
          const queryRes = (await lendingPool.withSigner(accounts[0]).query.setAsCollateral(accounts[1].address, true)).value.ok;
          expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AssetNotRegistered());
        });
        it('Fails if account gets undercollaterized', async () => {
          const mintedAmount = new BN('1000000000000000000');
          const reserve = testEnv.reserves['DAI'];
          await reserve.underlying.tx.mint(accounts[0].address, mintedAmount);
          await reserve.underlying.withSigner(accounts[0]).tx.approve(lendingPool.address, mintedAmount);
          await lendingPool.withSigner(accounts[0]).tx.deposit(reserve.underlying.address, accounts[0].address, mintedAmount, []);
          await lendingPool.withSigner(accounts[0]).tx.setAsCollateral(reserve.underlying.address, true);
          await lendingPool.withSigner(accounts[0]).tx.borrow(reserve.underlying.address, accounts[0].address, mintedAmount.div(new BN(2)), [0]);

          const queryRes = (await lendingPool.withSigner(accounts[0]).query.setAsCollateral(reserve.underlying.address, false)).value.ok;
          expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.InsufficientCollateral());
        });
        it('Fails without deposit', async () => {
          const reserve = testEnv.reserves['DAI'];
          await expect(lendingPool.withSigner(accounts[0]).tx.setAsCollateral(reserve.underlying.address, true)).to.eventually.be.rejected;
        });
      });
    });

    describe('Withdraw | Account supplies DAI (with non-zero utilization rate) and earns interest', () => {
      let reserve: TokenReserve;
      let mintedAmount;
      beforeEach(async () => {
        //Arrange
        mintedAmount = new BN('1000000000000000000');
        reserve = testEnv.reserves['DAI'];
        await reserve.underlying.tx.mint(accounts[0].address, mintedAmount);
        await reserve.underlying.withSigner(accounts[0]).tx.approve(lendingPool.address, mintedAmount);
        await lendingPool.withSigner(accounts[0]).tx.deposit(reserve.underlying.address, accounts[0].address, mintedAmount, []);
        await lendingPool.withSigner(accounts[0]).tx.setAsCollateral(reserve.underlying.address, true);
        await lendingPool.withSigner(accounts[0]).tx.borrow(reserve.underlying.address, accounts[0].address, mintedAmount.div(new BN(2)), [0]);
        await reserve.underlying.tx.mint(accounts[1].address, mintedAmount);
        await reserve.underlying.withSigner(accounts[1]).tx.approve(lendingPool.address, mintedAmount);
      });

      it('No interest accumulation when reddeming at the same time', async () => {
        //Arrange
        const testAccount = accounts[1];
        const depositAmount = mintedAmount.div(new BN(10));
        await lendingPool.withSigner(testAccount).tx.deposit(reserve.underlying.address, testAccount.address, depositAmount, []);

        //Act
        await testEnv.lendingPool.withSigner(testAccount).tx.withdraw(reserve.underlying.address, testAccount.address, depositAmount, []);

        //Assert
        const accountReserveDataAfter = (await lendingPool.query.viewUnupdatedAccountReserveData(reserve.underlying.address, testAccount.address))
          .value.ok!;
        const accountBalanceAfter = (await reserve.underlying.query.balanceOf(testAccount.address)).value.ok!;
        expect(accountReserveDataAfter.deposit.toString()).to.be.equal('0');
        expect(accountBalanceAfter.toString()).to.be.equal(mintedAmount.toString());
      });

      it('Some interest accumulation when reddeming at the later time', async () => {
        //Arrange
        const testAccount = accounts[1];
        const depositAmount = mintedAmount.div(new BN(10));
        await lendingPool.withSigner(testAccount).tx.deposit(reserve.underlying.address, testAccount.address, depositAmount, []);
        const DAY = 24 * 60 * 60 * 1000;
        //Act
        await time.increase(DAY);
        await lendingPool.withSigner(testAccount).tx.withdraw(reserve.underlying.address, testAccount.address, depositAmount, []);

        //Assert
        const accountReserveDataAfter = (await lendingPool.query.viewUnupdatedAccountReserveData(reserve.underlying.address, testAccount.address))
          .value.ok!;
        const accountBalanceAfter = (await reserve.underlying.query.balanceOf(testAccount.address)).value.ok!;
        expect(accountReserveDataAfter.deposit.toNumber()).to.be.greaterThan(0);
        expect(accountBalanceAfter.toString()).to.be.equal(mintedAmount.toString());
      });

      it('Exact interest accumulation when reddeming at the later time | withdrawing deposited amount', async () => {
        //Arrange
        const testAccount = accounts[1];
        const depositAmount = mintedAmount.div(new BN(10));
        await lendingPool.withSigner(testAccount).tx.deposit(reserve.underlying.address, testAccount.address, depositAmount, []);
        const DAY = 24 * 60 * 60 * 1000;
        const withdrawParametersBefore = await getCheckWithdrawParameters(
          lendingPool,
          reserve.underlying,
          testEnv.reserves['DAI'].aToken,
          testAccount,
          testAccount,
        );
        //Act
        await time.increase(DAY);

        const tx = await lendingPool.withSigner(testAccount).tx.withdraw(reserve.underlying.address, testAccount.address, depositAmount, []);

        //Assert
        const withdrawParametersAfter = await getCheckWithdrawParameters(
          lendingPool,
          reserve.underlying,
          testEnv.reserves['DAI'].aToken,
          testAccount,
          testAccount,
        );

        await checkWithdraw(
          lendingPool,
          reserve,
          testAccount.address,
          testAccount.address,
          depositAmount,
          withdrawParametersBefore,
          withdrawParametersAfter,
          tx,
        );
      });

      it('Exact interest accumulation when reddeming at the later time | withdrawing ALL ', async () => {
        //Arrange
        const testAccount = accounts[1];
        const depositAmount = mintedAmount.div(new BN(10));
        await lendingPool.withSigner(testAccount).tx.deposit(reserve.underlying.address, testAccount.address, depositAmount, []);
        const DAY = 24 * 60 * 60 * 1000;
        const withdrawParametersBefore = await getCheckWithdrawParameters(
          lendingPool,
          reserve.underlying,
          testEnv.reserves['DAI'].aToken,
          testAccount,
          testAccount,
        );
        //Act
        await time.increase(DAY);

        const tx = await lendingPool.withSigner(testAccount).tx.withdraw(reserve.underlying.address, testAccount.address, MAX_U128, []);

        //Assert
        const withdrawParametersAfter = await getCheckWithdrawParameters(
          lendingPool,
          reserve.underlying,
          testEnv.reserves['DAI'].aToken,
          testAccount,
          testAccount,
        );

        await checkWithdraw(
          lendingPool,
          reserve,
          testAccount.address,
          testAccount.address,
          new BN(MAX_U128),
          withdrawParametersBefore,
          withdrawParametersAfter,
          tx,
        );
      });
    });
  });

  describe('AToken - Only Lending Pool', () => {
    let reserve: TokenReserve;
    beforeEach(() => {
      reserve = testEnv.reserves['DAI'];
    });
    it('A regular account should not be able to emit transfer events', async () => {
      const queryRes = (
        await reserve.aToken
          .withSigner(testEnv.accounts[0])
          .query.emitTransferEvents([{ from: null, to: testEnv.accounts[0].address, amount: 1_000_000 }])
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', PSP22ErrorBuilder.Custom('NotLendingPool'));
    });
    it('An owner/admin of Lending Pool should not be able to emit transfer events', async () => {
      const queryRes = (
        await reserve.aToken.withSigner(testEnv.owner).query.emitTransferEvents([{ from: null, to: testEnv.accounts[0].address, amount: 1_000_000 }])
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', PSP22ErrorBuilder.Custom('NotLendingPool'));
    });
    it('A regular account should not be able to call emit_transfer_event_and_decrease_allowance', async () => {
      const queryRes = (
        await reserve.aToken
          .withSigner(testEnv.accounts[0])
          .query.emitTransferEventAndDecreaseAllowance(
            { from: null, to: testEnv.accounts[0].address, amount: 1_000_000 },
            testEnv.accounts[0].address,
            testEnv.accounts[1].address,
            1_000_000,
          )
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', PSP22ErrorBuilder.Custom('NotLendingPool'));
    });
    it('An admin of Lending Pool should not be able call emit_transfer_event_and_decrease_allowance', async () => {
      const queryRes = (
        await reserve.aToken
          .withSigner(testEnv.owner)
          .query.emitTransferEventAndDecreaseAllowance(
            { from: null, to: testEnv.accounts[0].address, amount: 1_000_000 },
            testEnv.accounts[0].address,
            testEnv.accounts[1].address,
            1_000_000,
          )
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', PSP22ErrorBuilder.Custom('NotLendingPool'));
    });
  });
  describe('Abacus A/V/S Token caller check', () => {
    let reserveDAI: TokenReserve;
    let reserveWETH: TokenReserve;
    const mintedAmount = 10_000_000;
    beforeEach(async () => {
      reserveDAI = testEnv.reserves['DAI'];
      reserveWETH = testEnv.reserves['WETH'];
      await reserveDAI.underlying.tx.mint(accounts[0].address, mintedAmount);
      await reserveDAI.underlying.withSigner(accounts[0]).tx.approve(lendingPool.address, mintedAmount);
      await lendingPool.withSigner(accounts[0]).tx.deposit(reserveDAI.underlying.address, accounts[0].address, mintedAmount, []);
      await reserveDAI.aToken.withSigner(testEnv.accounts[0]).tx.approve(testEnv.accounts[1].address, mintedAmount);
    });
    it('A regular account should not be able to execute transfer supply on AToken', async () => {
      const queryRes = (
        await lendingPool
          .withSigner(testEnv.accounts[1])
          .query.transferDepositFromTo(reserveDAI.underlying.address, testEnv.accounts[0].address, testEnv.accounts[1].address, 1_000_000)
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('A regular account should not be able to execute transfer supply on VToken', async () => {
      const amountToBorrow = mintedAmount / 2;
      await reserveWETH.underlying.tx.mint(accounts[1].address, mintedAmount);
      await reserveWETH.underlying.withSigner(accounts[1]).tx.approve(lendingPool.address, mintedAmount);
      await lendingPool.withSigner(accounts[1]).tx.deposit(reserveWETH.underlying.address, accounts[1].address, mintedAmount, []);
      await lendingPool.withSigner(accounts[1]).tx.setAsCollateral(reserveWETH.underlying.address, true);
      await lendingPool.withSigner(accounts[1]).tx.borrow(reserveWETH.underlying.address, accounts[1].address, amountToBorrow, [0]);
      await reserveWETH.vToken.withSigner(testEnv.accounts[1]).tx.approve(testEnv.accounts[1].address, mintedAmount);

      const queryRes = (
        await lendingPool
          .withSigner(testEnv.accounts[0])
          .query.transferDebtFromTo(reserveWETH.underlying.address, testEnv.accounts[1].address, testEnv.accounts[0].address, amountToBorrow)
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });
});
