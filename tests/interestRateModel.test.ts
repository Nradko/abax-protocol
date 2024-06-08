import { ONE_DAY, stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';
import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import { InterestRateModel } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { E18bn, E6bn, toE } from '@c-forge/polkahat-network-helpers';
import { ONE_HOUR, ONE_MIN, ONE_PERCENT_APR_E18, ONE_SEC } from './setup/tokensToDeployForTesting';
import { time } from '@c-forge/polkahat-network-helpers';

makeSuite('LendingPool interest rate model tests', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let accounts: KeyringPair[];
  let supplier: KeyringPair;
  let borrower: KeyringPair;
  let usdcContract: PSP22Emitable;
  let wethContract: PSP22Emitable;

  let wethDeposit: BN;
  let usdcDeposit: BN;

  beforeEach('setup Env', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    accounts = testEnv.accounts;
    supplier = accounts[0];
    borrower = accounts[1];
    usdcContract = reserves['USDC'].underlying;
    wethContract = reserves['WETH'].underlying;

    wethDeposit = toE(18, '100');
    usdcDeposit = toE(12, '1000000');

    await usdcContract.tx.mint(borrower.address, usdcDeposit);
    await wethContract.tx.mint(supplier.address, wethDeposit);

    await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, usdcDeposit);
    await wethContract.withSigner(supplier).tx.approve(lendingPool.address, wethDeposit);
  });

  it('the initial interest rate model is correct', async () => {
    const reserve = usdcContract;
    const interestRateModel: InterestRateModel = (await lendingPool.query.viewInterestRateModel(reserve.address)).value.ok!;
    const timestamp = await time.latest();

    expect(stringifyNumericProps(interestRateModel)).to.deep.equal(
      stringifyNumericProps({
        targetUrE6: 900_000,
        minRateAtTargetE18: 2 * ONE_PERCENT_APR_E18,
        maxRateAtTargetE18: 10 * ONE_PERCENT_APR_E18,
        rateAtTargetUrE18: 2 * ONE_PERCENT_APR_E18,
        rateAtMaxUrE18: 100 * ONE_PERCENT_APR_E18,
        minimalTimeBetweenAdjustments: ONE_HOUR,
        lastAdjustmentTimestamp: timestamp,
      }),
    );
  });

  describe('100 WETH is deposited and 85 WETH is borrowed', () => {
    let wethDebt: BN;
    let depositTimestamp: number;
    beforeEach('deposit is made and then 1 day passes and borrow', async () => {
      wethDebt = toE(18, '85');
      await lendingPool.withSigner(supplier).tx.deposit(wethContract.address, supplier.address, wethDeposit, []);
      await lendingPool.withSigner(borrower).tx.deposit(usdcContract.address, borrower.address, usdcDeposit, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(usdcContract.address, true);

      depositTimestamp = await time.latest();
      await time.increase(ONE_DAY.toNumber());

      await lendingPool.withSigner(borrower).tx.borrow(wethContract.address, borrower.address, wethDebt, []);
    });

    it('the twUrEntries are correct', async () => {
      const twUrEntries = (await lendingPool.query.viewAssetTwEntries(wethContract.address, 0, 4)).value.ok!;
      const timestamp = await time.latest();

      expect(stringifyNumericProps(twUrEntries)).to.deep.equal(
        stringifyNumericProps([
          null,
          { timestamp: depositTimestamp, accumulator: toE(6, depositTimestamp) },
          { timestamp: timestamp, accumulator: toE(6, depositTimestamp) },
          null,
        ]),
      );
    });

    // very long test
    it('the twUrEntries should increase correctly', async () => {
      let lastAccValue = toE(6, depositTimestamp);
      let lastTwIndex = 2;

      for (let i = 1; i < 65; i++) {
        console.log(i);
        await time.increase(ONE_MIN.toNumber());
        await lendingPool.withSigner(borrower).tx.accumulateInterest(wethContract.address);
        lastTwIndex = lastTwIndex + 1;

        const reserveData = (await lendingPool.query.viewReserveData(wethContract.address)).value.ok!;
        const utilRateE6 = reserveData.totalDebt.mul(E6bn).div(reserveData.totalDeposit);

        lastAccValue = lastAccValue.add(ONE_MIN.mul(utilRateE6));
        const timestamp = await time.latest();

        const firstIndex = lastTwIndex % 60;
        const secondIndex = (lastTwIndex + 1) % 60 === 0 ? lastTwIndex + 1 : (lastTwIndex + 1) % 60;

        const twUrEntries = (await lendingPool.query.viewAssetTwEntries(wethContract.address, firstIndex, secondIndex)).value.ok!;

        expect(stringifyNumericProps(twUrEntries)).to.deep.equal(stringifyNumericProps([{ timestamp: timestamp, accumulator: lastAccValue }]));
      }
    });

    describe(' adjusting the interest rate model', () => {
      it('adjusting should work for appropriate index  = 1, but nothing should be changed because util was <90% ', async () => {
        const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 1);
        await expect(tx).to.be.eventually.fulfilled;

        const interestRateModel: InterestRateModel = (await lendingPool.query.viewInterestRateModel(wethContract.address)).value.ok!;

        expect(stringifyNumericProps(interestRateModel)).to.deep.equal(
          stringifyNumericProps({
            targetUrE6: 900_000,
            minRateAtTargetE18: 2 * ONE_PERCENT_APR_E18,
            maxRateAtTargetE18: 10 * ONE_PERCENT_APR_E18,
            rateAtTargetUrE18: 2 * ONE_PERCENT_APR_E18,
            rateAtMaxUrE18: 100 * ONE_PERCENT_APR_E18,
            minimalTimeBetweenAdjustments: ONE_HOUR,
            lastAdjustmentTimestamp: await time.latest(),
          }),
        );
      });

      it('should not be possible before the minimum time between adjustments passes', async () => {
        await time.increase(ONE_HOUR.sub(ONE_SEC).toNumber());
        await lendingPool.tx.accumulateInterest(wethContract.address);

        const tx = lendingPool.withSigner(supplier).query.adjustRateAtTarget(wethContract.address, 2);

        await expect(tx).to.be.revertedWithError({ wrongIndex: null });
      });

      it('should be possible after the minimum time between adjustments passes', async () => {
        await time.increase(ONE_HOUR.toNumber());
        await lendingPool.tx.accumulateInterest(wethContract.address);

        const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);

        await expect(tx).to.be.eventually.fulfilled;
      });

      it('should be possible after the minimum time between adjustments passes', async () => {
        await time.increase(ONE_HOUR.toNumber() / 2);
        await lendingPool.tx.accumulateInterest(wethContract.address);
        await time.increase(ONE_HOUR.toNumber() / 2);
        await lendingPool.tx.accumulateInterest(wethContract.address);

        const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);

        await expect(tx).to.be.eventually.fulfilled;
      });
    });
  });

  describe('100 WETH is deposited and 95 WETH is borrowed', () => {
    let wethDebt: BN;
    let depositTimestamp: number;
    beforeEach('deposit is made and then 1 day passes and borrow', async () => {
      wethDebt = toE(18, '95');
      await lendingPool.withSigner(supplier).tx.deposit(wethContract.address, supplier.address, wethDeposit, []);
      await lendingPool.withSigner(borrower).tx.deposit(usdcContract.address, borrower.address, usdcDeposit, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(usdcContract.address, true);

      depositTimestamp = await time.latest();
      await time.increase(ONE_DAY.toNumber());

      await lendingPool.withSigner(borrower).tx.borrow(wethContract.address, borrower.address, wethDebt, []);
    });

    it('the twUrEntries are correct', async () => {
      const twUrEntries = (await lendingPool.query.viewAssetTwEntries(wethContract.address, 0, 4)).value.ok!;
      const timestamp = await time.latest();

      expect(stringifyNumericProps(twUrEntries)).to.deep.equal(
        stringifyNumericProps([
          null,
          { timestamp: depositTimestamp, accumulator: toE(6, depositTimestamp) },
          { timestamp: timestamp, accumulator: toE(6, depositTimestamp) },
          null,
        ]),
      );
    });

    it('after One hour the interest rate should adjust ', async () => {
      await time.increase(ONE_HOUR.toNumber());
      await lendingPool.tx.accumulateInterest(wethContract.address);

      const q = await lendingPool.withSigner(supplier).query.adjustRateAtTarget(wethContract.address, 2);
      const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);
      await expect(tx).to.be.eventually.fulfilled;

      const interestRateModel: InterestRateModel = (await lendingPool.query.viewInterestRateModel(wethContract.address)).value.ok!;

      expect(stringifyNumericProps(interestRateModel)).to.deep.equal(
        stringifyNumericProps({
          targetUrE6: 900_000,
          minRateAtTargetE18: 2 * ONE_PERCENT_APR_E18,
          maxRateAtTargetE18: 10 * ONE_PERCENT_APR_E18,
          rateAtTargetUrE18: 10 * ONE_PERCENT_APR_E18,
          rateAtMaxUrE18: 100 * ONE_PERCENT_APR_E18,
          minimalTimeBetweenAdjustments: ONE_HOUR,
          lastAdjustmentTimestamp: await time.latest(),
        }),
      );
    });
  });

  describe('100 WETH is deposited and 90.5 WETH is borrowed', () => {
    let wethDebt: BN;
    let depositTimestamp: number;
    beforeEach('deposit is made and then 1 day passes and borrow', async () => {
      wethDebt = toE(17, '905');
      await lendingPool.withSigner(supplier).tx.deposit(wethContract.address, supplier.address, wethDeposit, []);
      await lendingPool.withSigner(borrower).tx.deposit(usdcContract.address, borrower.address, usdcDeposit, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(usdcContract.address, true);

      depositTimestamp = await time.latest();
      await time.increase(ONE_DAY.toNumber());

      await lendingPool.withSigner(borrower).tx.borrow(wethContract.address, borrower.address, wethDebt, []);
    });

    it('after One hour the interest rate should adjust ', async () => {
      await time.increase(ONE_HOUR.toNumber());
      await lendingPool.tx.accumulateInterest(wethContract.address);

      const q = await lendingPool.withSigner(supplier).query.adjustRateAtTarget(wethContract.address, 2);
      const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);
      await expect(tx).to.be.eventually.fulfilled;

      const interestRateModel: InterestRateModel = (await lendingPool.query.viewInterestRateModel(wethContract.address)).value.ok!;

      expect(stringifyNumericProps(interestRateModel)).to.deep.equal(
        stringifyNumericProps({
          targetUrE6: 900_000,
          minRateAtTargetE18: 2 * ONE_PERCENT_APR_E18,
          maxRateAtTargetE18: 10 * ONE_PERCENT_APR_E18,
          rateAtTargetUrE18: 21879756,
          rateAtMaxUrE18: 100 * ONE_PERCENT_APR_E18,
          minimalTimeBetweenAdjustments: ONE_HOUR,
          lastAdjustmentTimestamp: await time.latest(),
        }),
      );
    });
  });

  describe('100 WETH is deposited and 95 WETH is borrowed', () => {
    let wethDebt: BN;
    let depositTimestamp: number;
    beforeEach('deposit is made and then 1 day passes and borrow', async () => {
      wethDebt = toE(18, '95');
      await lendingPool.withSigner(supplier).tx.deposit(wethContract.address, supplier.address, wethDeposit, []);
      await lendingPool.withSigner(borrower).tx.deposit(usdcContract.address, borrower.address, usdcDeposit, []);
      await lendingPool.withSigner(borrower).tx.setAsCollateral(usdcContract.address, true);

      depositTimestamp = await time.latest();
      await time.increase(ONE_DAY.toNumber());

      await wethContract.withSigner(borrower).tx.approve(lendingPool.address, wethDebt);
      await lendingPool.withSigner(borrower).tx.borrow(wethContract.address, borrower.address, wethDebt, []);
    });

    it('after One hour the interest rate should adjust and then 45% is repaid and after on hour interest are readjusted  ', async () => {
      await time.increase(ONE_HOUR.toNumber());
      await lendingPool.withSigner(borrower).tx.repay(wethContract.address, borrower.address, toE(18, '45'), []);
      await lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);

      const reserveData = (await lendingPool.query.viewReserveData(wethContract.address)).value.ok!;

      console.log(stringifyNumericProps(reserveData));

      await time.increase(ONE_HOUR.toNumber());
      await lendingPool.tx.accumulateInterest(wethContract.address);
      const tx = lendingPool.withSigner(supplier).tx.adjustRateAtTarget(wethContract.address, 2);
      await expect(tx).to.be.eventually.fulfilled;

      // const twUrEntries = stringifyNumericProps((await lendingPool.query.viewAssetTwEntries(wethContract.address, 0, 7)).value.ok!);

      const interestRateModel: InterestRateModel = (await lendingPool.query.viewInterestRateModel(wethContract.address)).value.ok!;

      expect(stringifyNumericProps(interestRateModel)).to.deep.equal(
        stringifyNumericProps({
          targetUrE6: 900_000,
          minRateAtTargetE18: 2 * ONE_PERCENT_APR_E18,
          maxRateAtTargetE18: 10 * ONE_PERCENT_APR_E18,
          rateAtTargetUrE18: 17636034,
          rateAtMaxUrE18: 100 * ONE_PERCENT_APR_E18,
          minimalTimeBetweenAdjustments: ONE_HOUR,
          lastAdjustmentTimestamp: await time.latest(),
        }),
      );
    });
  });
});
//           { timestamp, accumulator: toE(6, depositTimestamp).add(ONE_DAY.muln(850_000)) },
