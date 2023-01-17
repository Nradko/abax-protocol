import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool_v0_borrow_facet';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { E6 } from './scenarios/utils/misc';
import { expect } from './setup/chai';

makeSuite('LendingPool stable borrow & and stable rate rebalance', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let users: KeyringPair[];
  let supplier: KeyringPair;
  let borrower: KeyringPair;
  let rebalancer: KeyringPair;
  let whaleBorrower: KeyringPair;

  beforeEach('setup Env', () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    users = testEnv.users;
    supplier = users[0];
    borrower = users[1];
    rebalancer = users[2];
    whaleBorrower = users[3];
  });

  describe('Borrower deposits WETH (1WETH = 1500$) when total DAI supply is 10000 DAI and total LINK supply is 1000 LINK. Then ...', () => {
    let daiContract: PSP22Emitable;
    let wethContract: PSP22Emitable;
    let linkContract: PSP22Emitable;

    let totalDaiSupply: BN;
    let totalLinkSupply: BN;
    let borrowerCollateralWethAmount: BN;
    let whaleCollateralWethAmount: BN;

    const daiPrice = E6;
    const wethPrice = 1500 * E6;
    const linkPrice = 10 * E6;

    beforeEach('make deposit', async () => {
      daiContract = reserves['DAI'].underlying;
      wethContract = reserves['WETH'].underlying;
      linkContract = reserves['LINK'].underlying;
      // initial token prices
      await lendingPool.tx.insertReserveTokenPriceE8(daiContract.address, daiPrice);
      await lendingPool.tx.insertReserveTokenPriceE8(wethContract.address, wethPrice);
      await lendingPool.tx.insertReserveTokenPriceE8(linkContract.address, linkPrice);
      //
      totalDaiSupply = await convertToCurrencyDecimals(daiContract, 10000);
      await daiContract.tx.mint(supplier.address, totalDaiSupply);
      await daiContract.withSigner(supplier).tx.approve(lendingPool.address, totalDaiSupply);
      await lendingPool.withSigner(supplier).tx.deposit(daiContract.address, supplier.address, totalDaiSupply, []);
      //
      totalLinkSupply = await convertToCurrencyDecimals(linkContract, 1000);
      await linkContract.tx.mint(supplier.address, totalLinkSupply);
      await linkContract.withSigner(supplier).tx.approve(lendingPool.address, totalLinkSupply);
      await lendingPool.withSigner(supplier).tx.deposit(linkContract.address, supplier.address, totalLinkSupply, []);
      //
      borrowerCollateralWethAmount = await convertToCurrencyDecimals(wethContract, 1);
      await wethContract.tx.mint(borrower.address, borrowerCollateralWethAmount);
      await wethContract.withSigner(borrower).tx.approve(lendingPool.address, borrowerCollateralWethAmount);
      await lendingPool.withSigner(borrower).tx.deposit(wethContract.address, borrower.address, borrowerCollateralWethAmount, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(wethContract.address, true);
      //
      whaleCollateralWethAmount = await convertToCurrencyDecimals(wethContract, 1000);
      await wethContract.tx.mint(whaleBorrower.address, whaleCollateralWethAmount);
      await wethContract.withSigner(whaleBorrower).tx.approve(lendingPool.address, whaleCollateralWethAmount);
      await lendingPool.withSigner(whaleBorrower).tx.deposit(wethContract.address, whaleBorrower.address, whaleCollateralWethAmount, []);
      await lendingPool.withSigner(whaleBorrower).tx.setAsCollateral(wethContract.address, true);
    });

    it('borrower tries to borrow_stable Link what is not allowed by the rules. AssetStableBorrowDisabled ERROR', async () => {
      const linkAmountToBorrow = await convertToCurrencyDecimals(linkContract, 1);
      await expect(
        lendingPool.withSigner(borrower).query.borrow(linkContract.address, borrower.address, linkAmountToBorrow, [1]),
      ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.AssetStableBorrowDisabled());
    });

    it('borrower tries to borrow_stable 1500$ Dai what is more than borrower free collateral. InsufficientUserFreeCollateral ERROR', async () => {
      const daiAmountToBorrow = await convertToCurrencyDecimals(daiContract, 1500);
      await expect(
        lendingPool.withSigner(borrower).query.borrow(daiContract.address, borrower.address, daiAmountToBorrow, [1]),
      ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.InsufficientUserFreeCollateral());
    });

    it('borrower succesfully borrow_stable 1000$ Dai.', async () => {
      const daiAmountToBorrow = await convertToCurrencyDecimals(daiContract, 1000);
      await expect(lendingPool.withSigner(borrower).tx.borrow(daiContract.address, borrower.address, daiAmountToBorrow, [1])).to.eventually.be
        .fulfilled;
    });

    describe('borrower borrow_stable 1000 Dai. Then ...', () => {
      beforeEach('', async () => {
        await lendingPool.withSigner(borrower).tx.borrow(daiContract.address, borrower.address, 1000, [1]);
      });

      it('rebalancer tries to rebalance borrower LINK stable rate. NoStableBorrow ERROR.', async () => {
        await expect(
          lendingPool.withSigner(rebalancer).query.rebalanceStableBorrowRate(linkContract.address, borrower.address),
        ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.NoStableBorrow());
      });

      it('rebalancer tries to rebalance borrower DAI stable rate. RebalanceCondition ERROR.', async () => {
        await expect(
          lendingPool.withSigner(rebalancer).query.rebalanceStableBorrowRate(daiContract.address, borrower.address),
        ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.RebalanceCondition());
      });
      describe('whaleBorrower borrow_stable 90% of DAI supply. Then ...', () => {
        beforeEach('', async () => {
          await lendingPool.withSigner(whaleBorrower).tx.borrow(daiContract.address, whaleBorrower.address, totalDaiSupply.muln(90).divn(100), [1]);
        });

        it('rebalancer tries to rebalance borrower DAI stable rate.', async () => {
          await expect(lendingPool.withSigner(rebalancer).query.rebalanceStableBorrowRate(daiContract.address, borrower.address)).to.eventually.be
            .fulfilled;

          //TODO add checks!
        });
      });
    });
  });
});
