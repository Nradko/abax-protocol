// import { BN } from 'bn.js';
// import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool_v0_borrow_facet';
// import { approve, convertToCurrencyDecimals, getExpectedError } from './scenarios/utils/actions';
// import { makeSuite } from './scenarios/utils/make-suite';
// import { expect } from './setup/chai';
// import { MOCK_CHAINLINK_AGGREGATORS_PRICES } from './setup/testEnvConsts';

// makeSuite('LendingPool liquidation stable - liquidator receiving aToken', (getTestEnv) => {
//   it('Deposits WETH, borrows DAI/Check liquidation fails because the borrower is collaterized', async () => {
//     const testEnv = getTestEnv();
//     const { lendingPool, reserves, users } = testEnv;
//     const depositorReserveSymbol = 'DAI';
//     const borrowerReserveSymbol = 'WETH';
//     const suppliersDepositReserve = reserves[depositorReserveSymbol].underlying;
//     const borrowersDepositReserve = reserves[borrowerReserveSymbol].underlying;
//     const supplier = users[0];
//     const borrower = users[1];
//     const liquidator = users[2];

//     const amountDAIToDeposit = await convertToCurrencyDecimals(suppliersDepositReserve, 1000);
//     await suppliersDepositReserve.tx.mint(supplier.address, amountDAIToDeposit);
//     await approve(depositorReserveSymbol, supplier, testEnv);
//     await lendingPool.withSigner(supplier).tx.deposit(suppliersDepositReserve.address, supplier.address, amountDAIToDeposit,[]);
//     await lendingPool.withSigner(supplier).tx.setAsCollateral(suppliersDepositReserve.address, true);

//     const amountWETHToDepositByBorrower = await convertToCurrencyDecimals(borrowersDepositReserve, 1);
//     await borrowersDepositReserve.tx.mint(borrower.address, amountWETHToDepositByBorrower);
//     await approve(borrowerReserveSymbol, borrower, testEnv);
//     await lendingPool.withSigner(borrower).tx.deposit(borrowersDepositReserve.address, borrower.address, amountWETHToDepositByBorrower,[]);
//     await lendingPool.withSigner(borrower).tx.setAsCollateral(borrowersDepositReserve.address, true);

//     const amountDAIToBorrow = await convertToCurrencyDecimals(suppliersDepositReserve, 100); //TODO
//     await lendingPool.withSigner(borrower).tx.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);

//     await borrowersDepositReserve.tx.mint(liquidator.address, amountWETHToDepositByBorrower);
//     // await approve(borrowerReserveSymbol, liquidator, testEnv);

//     await expect(
//       lendingPool
//         .withSigner(liquidator)
//         .query.liquidationStable(borrower.address, borrowersDepositReserve.address, borrowersDepositReserve.address, amountDAIToBorrow, 1),
//     ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.Collaterized());
//   });

//   it('Deposits WETH, borrows DAI/Check, user gets undercollaterized, liquidator choses wrong asset to repay - liquidation fails', async () => {
//     const testEnv = getTestEnv();
//     const { lendingPool, reserves, users } = testEnv;
//     const depositorReserveSymbol = 'DAI';
//     const borrowerReserveSymbol = 'WETH';
//     const suppliersDepositReserve = reserves[depositorReserveSymbol].underlying;
//     const borrowersDepositReserve = reserves[borrowerReserveSymbol].underlying;
//     const supplier = users[0];
//     const borrower = users[1];
//     const liquidator = users[2];

//     const amountDAIToDeposit = await convertToCurrencyDecimals(suppliersDepositReserve, 1000);
//     await suppliersDepositReserve.tx.mint(supplier.address, amountDAIToDeposit);
//     await approve(depositorReserveSymbol, supplier, testEnv);
//     await lendingPool.withSigner(supplier).tx.deposit(suppliersDepositReserve.address, supplier.address, amountDAIToDeposit,[]);
//     await lendingPool.withSigner(supplier).tx.setAsCollateral(suppliersDepositReserve.address, true);

//     const amountWETHToDepositByBorrower = await convertToCurrencyDecimals(borrowersDepositReserve, 10);
//     await borrowersDepositReserve.tx.mint(borrower.address, amountWETHToDepositByBorrower);
//     await approve(borrowerReserveSymbol, borrower, testEnv);
//     await lendingPool.withSigner(borrower).tx.deposit(borrowersDepositReserve.address, borrower.address, amountWETHToDepositByBorrower,[]);
//     await lendingPool.withSigner(borrower).tx.setAsCollateral(borrowersDepositReserve.address, true);

//     const amountDAIToBorrow = await convertToCurrencyDecimals(suppliersDepositReserve, 800); //TODO
//     await lendingPool.withSigner(borrower).query.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);
//     await lendingPool.withSigner(borrower).tx.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);

//     await lendingPool.tx.insertReserveTokenPriceE8(borrowersDepositReserve.address, MOCK_CHAINLINK_AGGREGATORS_PRICES.DAI / 2);

//     await borrowersDepositReserve.tx.mint(liquidator.address, amountWETHToDepositByBorrower);

//     await expect(
//       lendingPool
//         .withSigner(liquidator)
//         .query.liquidationStable(borrower.address, borrowersDepositReserve.address, borrowersDepositReserve.address, amountDAIToBorrow, 1),
//     ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.NothingToRepay());
//   });

//   it('Deposits WETH, borrows DAI/Check, user gets undercollaterized, liquidator choses a reserve to take from that the user has not supplied - liquidation fails', async () => {
//     const testEnv = getTestEnv();
//     const { lendingPool, reserves, users } = testEnv;
//     const depositorReserveSymbol = 'DAI';
//     const borrowerReserveSymbol = 'WETH';
//     const suppliersDepositReserve = reserves[depositorReserveSymbol].underlying;
//     const borrowersDepositReserve = reserves[borrowerReserveSymbol].underlying;
//     const unrelatedDepositReserve = reserves['LINK'].underlying;
//     const supplier = users[0];
//     const borrower = users[1];
//     const liquidator = users[2];

//     const amountDAIToDeposit = await convertToCurrencyDecimals(suppliersDepositReserve, 1000);
//     await suppliersDepositReserve.tx.mint(supplier.address, amountDAIToDeposit);
//     await approve(depositorReserveSymbol, supplier, testEnv);
//     await lendingPool.withSigner(supplier).tx.deposit(suppliersDepositReserve.address, supplier.address, amountDAIToDeposit,[]);
//     await lendingPool.withSigner(supplier).tx.setAsCollateral(suppliersDepositReserve.address, true);

//     const amountWETHToDepositByBorrower = await convertToCurrencyDecimals(borrowersDepositReserve, 10);
//     await borrowersDepositReserve.tx.mint(borrower.address, amountWETHToDepositByBorrower);
//     await approve(borrowerReserveSymbol, borrower, testEnv);
//     await lendingPool.withSigner(borrower).tx.deposit(borrowersDepositReserve.address, borrower.address, amountWETHToDepositByBorrower,[]);
//     await lendingPool.withSigner(borrower).tx.setAsCollateral(borrowersDepositReserve.address, true);

//     const amountDAIToBorrow = await convertToCurrencyDecimals(suppliersDepositReserve, 800); //TODO
//     await lendingPool.withSigner(borrower).query.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);
//     await lendingPool.withSigner(borrower).tx.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);

//     await lendingPool.tx.insertReserveTokenPriceE8(borrowersDepositReserve.address, MOCK_CHAINLINK_AGGREGATORS_PRICES.DAI / 2);

//     await borrowersDepositReserve.tx.mint(liquidator.address, amountWETHToDepositByBorrower);

//     await expect(
//       lendingPool
//         .withSigner(liquidator)
//         .query.liquidationStable(borrower.address, suppliersDepositReserve.address, unrelatedDepositReserve.address, amountDAIToBorrow, 1),
//     ).to.eventually.be.rejected.and.to.have.deep.property('_err', LendingPoolErrorBuilder.NothingToCompensateWith());
//   });

//   it('Deposits WETH, borrows DAI/Check, user gets undercollaterized, liquidation succeeds', async () => {
//     const testEnv = getTestEnv();
//     const { lendingPool, reserves, users } = testEnv;
//     const depositorReserveSymbol = 'DAI';
//     const borrowerReserveSymbol = 'WETH';
//     const suppliersDepositReserve = reserves[depositorReserveSymbol].underlying;
//     const borrowersDepositReserve = reserves[borrowerReserveSymbol].underlying;
//     const supplier = users[0];
//     const borrower = users[1];
//     const liquidator = users[2];

//     const amountDAIToDeposit = await convertToCurrencyDecimals(suppliersDepositReserve, 1000);
//     await suppliersDepositReserve.tx.mint(supplier.address, amountDAIToDeposit);
//     await approve(depositorReserveSymbol, supplier, testEnv);
//     await lendingPool.withSigner(supplier).tx.deposit(suppliersDepositReserve.address, supplier.address, amountDAIToDeposit,[]);
//     await lendingPool.withSigner(supplier).tx.setAsCollateral(suppliersDepositReserve.address, true);

//     const amountWETHToDepositByBorrower = await convertToCurrencyDecimals(borrowersDepositReserve, 10);
//     await borrowersDepositReserve.tx.mint(borrower.address, amountWETHToDepositByBorrower);
//     await approve(borrowerReserveSymbol, borrower, testEnv);
//     await lendingPool.withSigner(borrower).tx.deposit(borrowersDepositReserve.address, borrower.address, amountWETHToDepositByBorrower,[]);
//     await lendingPool.withSigner(borrower).tx.setAsCollateral(borrowersDepositReserve.address, true);

//     const amountDAIToBorrow = await convertToCurrencyDecimals(suppliersDepositReserve, 800); //TODO
//     await lendingPool.withSigner(borrower).query.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);
//     await lendingPool.withSigner(borrower).tx.borrow(suppliersDepositReserve.address, borrower.address, amountDAIToBorrow,[1]);

//     await lendingPool.tx.insertReserveTokenPriceE8(borrowersDepositReserve.address, MOCK_CHAINLINK_AGGREGATORS_PRICES.DAI / 2);

//     const liquidatorDAIBalance = amountDAIToBorrow.addn(1_000); //add some overhead to price in interests
//     await suppliersDepositReserve.tx.mint(liquidator.address, liquidatorDAIBalance);
//     await suppliersDepositReserve.withSigner(liquidator).tx.approve(lendingPool.address, liquidatorDAIBalance);

//     //Act
//     await expect(
//       lendingPool
//         .withSigner(liquidator)
//         .query.liquidationStable(borrower.address, suppliersDepositReserve.address, borrowersDepositReserve.address, amountDAIToBorrow, 1),
//     ).to.eventually.be.fulfilled;

//     //Assert

//     //     expect(userGlobalDataAfter.healthFactor.toString()).to.be.bignumber.gt(
//     //       oneEther.toFixed(0),
//     //       'Invalid health factor'
//     //     );

//     //     expect(userReserveDataAfter.currentStableDebt.toString()).to.be.bignumber.almostEqual(
//     //       new BigNumber(userReserveDataBefore.currentStableDebt.toString())
//     //         .minus(amountToLiquidate)
//     //         .toFixed(0),
//     //       'Invalid user borrow balance after liquidation'
//     //     );

//     //     expect(usdcReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//     //       new BigNumber(usdcReserveDataBefore.availableLiquidity.toString())
//     //         .plus(amountToLiquidate)
//     //         .toFixed(0),
//     //       'Invalid principal available liquidity'
//     //     );

//     //     //the liquidity index of the principal reserve needs to be bigger than the index before
//     //     expect(usdcReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
//     //       usdcReserveDataBefore.liquidityIndex.toString(),
//     //       'Invalid liquidity index'
//     //     );

//     //     //the principal APY after a liquidation needs to be lower than the APY before
//     //     expect(usdcReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
//     //       usdcReserveDataBefore.liquidityRate.toString(),
//     //       'Invalid liquidity APY'
//     //     );

//     //     expect(ethReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//     //       new BigNumber(ethReserveDataBefore.availableLiquidity.toString()).toFixed(0),
//     //       'Invalid collateral available liquidity'
//     //     );

//     // expect(userReserveDataAfter.currentStableDebt.toString()).to.be.bignumber.almostEqual(
//     //   stableDebtBeforeTx.minus(amountToLiquidate).toFixed(0),
//     //   'Invalid user debt after liquidation'
//     // );

//     // //the liquidity index of the principal reserve needs to be bigger than the index before
//     // expect(daiReserveDataAfter.liquidityIndex.toString()).to.be.bignumber.gte(
//     //   daiReserveDataBefore.liquidityIndex.toString(),
//     //   'Invalid liquidity index'
//     // );

//     // //the principal APY after a liquidation needs to be lower than the APY before
//     // expect(daiReserveDataAfter.liquidityRate.toString()).to.be.bignumber.lt(
//     //   daiReserveDataBefore.liquidityRate.toString(),
//     //   'Invalid liquidity APY'
//     // );

//     // expect(daiReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//     //   new BigNumber(daiReserveDataBefore.availableLiquidity.toString())
//     //     .plus(amountToLiquidate)
//     //     .toFixed(0),
//     //   'Invalid principal available liquidity'
//     // );

//     // expect(ethReserveDataAfter.availableLiquidity.toString()).to.be.bignumber.almostEqual(
//     //   new BigNumber(ethReserveDataBefore.availableLiquidity.toString())
//     //     .minus(expectedCollateralLiquidated)
//     //     .toFixed(0),
//     //   'Invalid collateral available liquidity'
//     // );
//   });
// });
