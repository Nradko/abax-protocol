import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool_v0_borrow_facet';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { E18, E6 } from '@abaxfinance/utils';

makeSuite('LendingPool liquidation - liquidator receiving aToken', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let users: KeyringPair[];
  let supplier: KeyringPair;
  let borrower: KeyringPair;
  let liquidator: KeyringPair;

  beforeEach('setup Env', () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    users = testEnv.users;
    supplier = users[0];
    borrower = users[1];
    liquidator = users[2];
  });

  describe('Borrower deposits WETH (1WETH = 1500$) and borrows (variable) 1000 DAI (1DAI = 1$). Then ...', () => {
    let daiContract: PSP22Emitable;
    let wethContract: PSP22Emitable;
    let linkContract: PSP22Emitable;

    let totalDaiSupply: BN;
    let collateralWethAmount: BN;
    let debtDaiAmount: BN;
    let suppliedLinkAmount: BN;

    const daiPrice = E6;
    const wethPrice = 1500 * E6;
    const linkPrice = 10 * E6;

    beforeEach('make deposit and make borrow', async () => {
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
      collateralWethAmount = await convertToCurrencyDecimals(wethContract, 1);
      await wethContract.tx.mint(borrower.address, collateralWethAmount);
      await wethContract.withSigner(borrower).tx.approve(lendingPool.address, collateralWethAmount);
      await lendingPool.withSigner(borrower).tx.deposit(wethContract.address, borrower.address, collateralWethAmount, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(wethContract.address, true);

      suppliedLinkAmount = await convertToCurrencyDecimals(wethContract, 1000);
      await linkContract.tx.mint(borrower.address, suppliedLinkAmount);
      await linkContract.withSigner(borrower).tx.approve(lendingPool.address, suppliedLinkAmount);
      await lendingPool.withSigner(borrower).tx.deposit(linkContract.address, borrower.address, suppliedLinkAmount, []);
      //
      debtDaiAmount = await convertToCurrencyDecimals(daiContract, 1000); //TODO;
      await lendingPool.withSigner(borrower).query.borrow(daiContract.address, borrower.address, debtDaiAmount, []);
      await lendingPool.withSigner(borrower).tx.borrow(daiContract.address, borrower.address, debtDaiAmount, []);
      // mint DAI for liquidator
      await daiContract.tx.mint(liquidator.address, debtDaiAmount.muln(2));
      await daiContract.withSigner(liquidator).tx.approve(lendingPool.address, debtDaiAmount.muln(2));
    });

    it('liquidation fails because the borrower is collateralized', async () => {
      const queryRes = (
        await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, 1, [])
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.Collaterized());
    });

    describe('WETH price changes to 1290$, borrower remains collateralized. Then ...', () => {
      beforeEach('', async () => {
        await lendingPool.tx.insertReserveTokenPriceE8(wethContract.address, (wethPrice * 1290) / 1500);
      });

      it('liquidation fails because the borrower is collaterized', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.Collaterized());
      });
    });

    describe('WETH price changes to 1280$, borrower gets undercollateralized. Then ...', () => {
      beforeEach('', async () => {
        await lendingPool.tx.insertReserveTokenPriceE8(wethContract.address, (wethPrice * 1280) / 1500);
      });

      it('liquidator choses wrong asset to repay - liquidation fails', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, linkContract.address, wethContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        await expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.NothingToRepay());
      });

      it('liquidator choses a reserve to take from that the user has not marked as collaterall - liquidation fails', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, linkContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        await expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.TakingNotACollateral());
      });

      it('liquidator choses a minimum for repaid token that is too big (greater than 871093750000000000000000000) - liquidation fails', async () => {
        // for each 1 DAI user should recieve  1 / 1280 ETH
        // DAI has 6 decimals and ETH has 18 so
        // for each 1 absDAI user should recieve 1/1280 * 10^12 absETH = 7.8125 & 10^8 absETH
        // above didnt include liquidation penalty which is (1 + 0.1 (WETH) + 0.015(DAI)) = 1.115
        // in total for one absDAI liquidator should receive 7.8125 * 10^14 * 1.115 = 8,7109375 * 10^8
        // the parameter is _e18 so maximal accepted parameter is 8,7109375 * 10^26

        const queryRes = (
          await lendingPool
            .withSigner(liquidator)
            .query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000001'), [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.MinimumRecieved());
      });

      it('liquidation succeeds', async () => {
        const daiReserveDataBefore = (await lendingPool.query.viewReserveData(daiContract.address)).value.ok!;
        const lendingPoolDAIBalanceBefore = (await daiContract.query.balanceOf(lendingPool.address)).value.ok!;
        // const borrowerData = await lendingPool.query.viewUserReserveData(daiContract.address, borrower.address);

        await lendingPool
          .withSigner(liquidator)
          .query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000000'), []);
        //Act & Assert

        await expect(
          lendingPool
            .withSigner(liquidator)
            .tx.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000000'), []),
        ).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        //Assert
        const [collateralizedPost, collateralCoefficientPost] = (await lendingPool.query.getUserFreeCollateralCoefficient(borrower.address)).value
          .ok!;
        const borrowersDAIDataAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, borrower.address)).value.ok!;
        const borrowersWETHDataAfter = (await lendingPool.query.viewUserReserveData(wethContract.address, borrower.address)).value.ok!;
        const liquidatorsWETHDataAfter = (await lendingPool.query.viewUserReserveData(wethContract.address, liquidator.address)).value.ok!;
        const daiReserveDataAfter = (await lendingPool.query.viewReserveData(daiContract.address)).value.ok!;
        const lendingPoolDAIBalanceAfter = (await daiContract.query.balanceOf(lendingPool.address)).value.ok!;
        expect.soft(collateralizedPost).to.be.true;
        expect.soft(borrowersDAIDataAfter.debt.toString()).to.equal('0', 'user got liquidated therefore user should no longer have variable debt');
        expect.soft(liquidatorsWETHDataAfter.supplied.rawNumber.gt(new BN((0.8 * E18).toString()))).to.be.true;
        expect.soft(borrowersWETHDataAfter.supplied.rawNumber.lt(new BN((0.2 * E18).toString()))).to.be.true;
        expect.soft(daiReserveDataAfter.totalDebt.toString()).to.equal('0', 'all borrows got repaid therefore totalDebt should be zero');
        expect.soft(daiReserveDataAfter.totalSupplied.toString()).to.equal(daiReserveDataBefore.totalSupplied.toString());
        expect.soft(lendingPoolDAIBalanceAfter.rawNumber.gt(lendingPoolDAIBalanceBefore.rawNumber)).to.be.true;
        expect.flushSoft();

        // TODO: check rates
      });
    });
  });
  describe('Borrower deposits WETH (1WETH = 1500$) and borrows (stable) 1000 DAI (1DAI = 1$). Then ...', () => {
    let daiContract: PSP22Emitable;
    let wethContract: PSP22Emitable;
    let linkContract: PSP22Emitable;

    let totalDaiSupply: BN;
    let collateralWethAmount: BN;
    let debtDaiAmount: BN;
    let suppliedLinkAmount: BN;

    const daiPrice = E6;
    const wethPrice = 1500 * E6;
    const linkPrice = 10 * E6;

    beforeEach('make deposit and make borrow', async () => {
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
      collateralWethAmount = await convertToCurrencyDecimals(wethContract, 1);
      await wethContract.tx.mint(borrower.address, collateralWethAmount);
      await wethContract.withSigner(borrower).tx.approve(lendingPool.address, collateralWethAmount);
      await lendingPool.withSigner(borrower).tx.deposit(wethContract.address, borrower.address, collateralWethAmount, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(wethContract.address, true);

      suppliedLinkAmount = await convertToCurrencyDecimals(wethContract, 1000);
      await linkContract.tx.mint(borrower.address, suppliedLinkAmount);
      await linkContract.withSigner(borrower).tx.approve(lendingPool.address, suppliedLinkAmount);
      await lendingPool.withSigner(borrower).tx.deposit(linkContract.address, borrower.address, suppliedLinkAmount, []);
      //
      debtDaiAmount = await convertToCurrencyDecimals(daiContract, 1000); //TODO;
      await lendingPool.withSigner(borrower).query.borrow(daiContract.address, borrower.address, debtDaiAmount, []);
      await lendingPool.withSigner(borrower).tx.borrow(daiContract.address, borrower.address, debtDaiAmount, []);
      // mint DAI for liquidator
      await daiContract.tx.mint(liquidator.address, debtDaiAmount.muln(2));
      await daiContract.withSigner(liquidator).tx.approve(lendingPool.address, debtDaiAmount.muln(2));
    });

    it('liquidation fails because the borrower is collateralized', async () => {
      const queryRes = (
        await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, 1, [])
      ).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.Collaterized());
    });

    describe('WETH price changes to 1290$, borrower remains collateralized. Then ...', () => {
      beforeEach('', async () => {
        await lendingPool.tx.insertReserveTokenPriceE8(wethContract.address, (wethPrice * 1290) / 1500);
      });

      it('liquidation fails because the borrower is collaterized', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.Collaterized());
      });
    });

    describe('WETH price changes to 1280$, borrower gets undercollateralized. Then ...', () => {
      beforeEach('', async () => {
        await lendingPool.tx.insertReserveTokenPriceE8(wethContract.address, (wethPrice * 1280) / 1500);
      });

      it('liquidator choses wrong asset to repay - liquidation fails', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, linkContract.address, wethContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.NothingToRepay());
      });

      it('liquidator choses a reserve to take from that the user has not marked as collaterall - liquidation fails', async () => {
        const queryRes = (
          await lendingPool.withSigner(liquidator).query.liquidate(borrower.address, daiContract.address, linkContract.address, debtDaiAmount, 1, [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.TakingNotACollateral());
      });

      it('liquidator choses a minimum for repaid token that is too big (greater than 871093750000000000000000000) - liquidation fails', async () => {
        // for each 1 DAI user should recieve  1 / 1280 ETH
        // DAI has 6 decimals and ETH has 18 so
        // for each 1 absDAI user should recieve 1/1280 * 10^12 absETH = 7.8125 & 10^8 absETH
        // above didnt include liquidation penalty which is (1 + 0.1 (WETH) + 0.015(DAI)) = 1.115
        // in total for one absDAI liquidator should receive 7.8125 * 10^8 * 1.115 = 8,7109375 * 10^8
        // the parameter is _e18 so maximal accepted parameter is 8,7109375 * 10^26
        const queryRes = (
          await lendingPool
            .withSigner(liquidator)
            .query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000001'), [])
        ).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.MinimumRecieved());
      });

      it('liquidation succeeds', async () => {
        // for each 1 DAI user should recieve  1 / 1280 ETH
        // DAI has 6 decimals and ETH has 18 so
        // for each 1 absDAI user should recieve 1/1280 * 10^12 absETH = 7.8125 & 10^8 absETH
        // above didnt include liquidation penalty which is (1 + 0.1 (WETH) + 0.015(DAI)) = 1.115
        // in total for one absDAI liquidator should receive 7.8125 * 10^8 * 1.115 = 8,7109375 * 10^8
        // the parameter is _e18 so maximal accepted parameter is 8,7109375 * 10^26
        // liquidator is repaying 10^9 absDAI thus should return 8,7109375 * 10^17 ansWETH ~ 0,87... WETH
        const daiReserveDataBefore = (await lendingPool.query.viewReserveData(daiContract.address)).value.ok!;
        const lendingPoolDAIBalanceBefore = (await daiContract.query.balanceOf(lendingPool.address)).value.ok!;
        await lendingPool
          .withSigner(liquidator)
          .query.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000000'), []);
        //Act & Assert
        const tx = lendingPool
          .withSigner(liquidator)
          .tx.liquidate(borrower.address, daiContract.address, wethContract.address, debtDaiAmount, new BN('871093750000000000000000000'), []);
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        //Assert
        const [collateralizedPost, collateralCoefficientPost] = (await lendingPool.query.getUserFreeCollateralCoefficient(borrower.address)).value
          .ok!;
        const borrowersDAIDataAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, borrower.address)).value.ok!;
        const borrowersWETHDataAfter = (await lendingPool.query.viewUserReserveData(wethContract.address, borrower.address)).value.ok!;
        const liquidatorsWETHDataAfter = (await lendingPool.query.viewUserReserveData(wethContract.address, liquidator.address)).value.ok!;
        const daiReserveDataAfter = (await lendingPool.query.viewReserveData(daiContract.address)).value.ok!;
        const lendingPoolDAIBalanceAfter = (await daiContract.query.balanceOf(lendingPool.address)).value.ok!;
        expect.soft(collateralizedPost).to.be.true;
        expect.soft(borrowersDAIDataAfter.debt.toString()).to.equal('0', 'user got liquidated therefore user should no longer have variable debt');
        expect
          .soft(
            liquidatorsWETHDataAfter.supplied.rawNumber.toString(),
            'liquidator received the exactly the minimal amount he provided as it was the maximal minimal amount he could provide',
          )
          .to.equal((0.87109375 * E18).toString());
        expect
          .soft(borrowersWETHDataAfter.supplied.rawNumber.toString(), 'liquidated user supply is decreased by what the liquidator have received')
          .to.equal(((1 - 0.87109375) * E18).toString());
        expect.soft(daiReserveDataAfter.totalDebt.toString()).to.equal('0', 'all borrows got repaid therefore totalDebt should be zero');
        expect.soft(daiReserveDataAfter.totalSupplied.toString()).to.equal(daiReserveDataBefore.totalSupplied.toString());
        expect.soft(lendingPoolDAIBalanceAfter.rawNumber.gt(lendingPoolDAIBalanceBefore.rawNumber)).to.be.true;

        const txRes = await tx;
        expect.soft(txRes.events).to.deep.equal([]);
        expect.flushSoft();
      });
    });
  });
});
