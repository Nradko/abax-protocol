import { LendingPoolErrorBuilder } from 'wookashwackomytest-contract-helpers';
import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import StableToken from 'typechain/contracts/stable_token';
import { Transfer } from 'typechain/event-types/a_token';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { ONE_YEAR } from './consts';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { TestEnv, TestEnvReserves, makeSuite } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { stringifyNumericProps } from 'wookashwackomytest-polkahat-chai-matchers';
import { time } from 'wookashwackomytest-polkahat-network-helpers';

makeSuite('AbaxStableToken', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let users: KeyringPair[];
  let alice: KeyringPair;
  let usdcContract: PSP22Emitable;
  let usdaxContract: StableToken;

  beforeEach('setup Env', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    users = testEnv.users;
    alice = users[0];
    usdcContract = reserves['USDC'].underlying;
    usdaxContract = testEnv.stables['USDax'].underlying;
  });

  describe('Alice has 11225 USDC collateral in the Lending Pool. Then ...', () => {
    let initialUsdcBalance: BN;

    beforeEach('make deposit and make borrow', async () => {
      initialUsdcBalance = await convertToCurrencyDecimals(usdcContract, 11225);
      await usdcContract.tx.mint(alice.address, initialUsdcBalance);
      await usdcContract.withSigner(alice).tx.approve(lendingPool.address, initialUsdcBalance);
      await lendingPool.withSigner(alice).tx.deposit(usdcContract.address, alice.address, initialUsdcBalance, []);
      await lendingPool.withSigner(alice).tx.setAsCollateral(usdcContract.address, true);
    });

    it('Alice should be able to take 10000 USDax loan', async () => {
      const initialUsdaxDebt: BN = await convertToCurrencyDecimals(usdaxContract, 10000);
      const capturedTransferEvents: Transfer[] = [];
      usdaxContract.events.subscribeOnTransferEvent((event) => {
        capturedTransferEvents.push(event);
      });
      const tx = lendingPool.withSigner(alice).tx.borrow(usdaxContract.address, alice.address, initialUsdaxDebt, []);
      await expect(tx).to.eventually.be.fulfilled;
      const txRes = await tx;
      const reserveData = (await lendingPool.query.viewReserveData(usdaxContract.address)).value.ok!;
      const userReserveData = (await lendingPool.query.viewUnupdatedUserReserveData(usdaxContract.address, alice.address)).value.ok!;

      expect.soft(stringifyNumericProps(reserveData)).to.deep.equal({
        activated: true,
        freezed: false,
        currentDebtRateE18: '350000',
        currentDepositRateE18: '0',
        totalDebt: '10000000000', // [3.5 * 10^11 * YearInMS] / 10^24 * 10^10  [[curent_debt_rate * time] * debt]
        totalDeposit: '0',
      });
      expect.soft(stringifyNumericProps(userReserveData)).to.deep.equal({
        appliedDebtIndexE18: '1000000000000000000', // 10^18 * (10^18 +(3.5 * 10^11 * YearInMS / E6 +1))
        appliedDepositIndexE18: '1000000000000000000',
        debt: '10000000000', // same as totalDebt above +1
        deposit: '0',
      });

      expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
        {
          name: 'Borrow',
          args: {
            amount: initialUsdaxDebt.toString(),
            onBehalfOf: alice.address,
            caller: alice.address,
            asset: usdaxContract.address,
          },
        },
      ]);
      expect.soft(stringifyNumericProps(capturedTransferEvents)).to.deep.equal([
        {
          from: null,
          to: alice.address,
          value: initialUsdaxDebt.toString(),
        },
      ]);
      expect.flushSoft();
    });

    it('Alice should NOT be able to take 10001 USDax loan', async () => {
      const initialUsdaxDebt: BN = await convertToCurrencyDecimals(usdaxContract, 10001);
      const queryResult = (await lendingPool.withSigner(alice).query.borrow(usdaxContract.address, alice.address, initialUsdaxDebt, [])).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.InsufficientCollateral());
    });

    describe('Alice takes 10_000 USDax loan and one year passes. Then...', () => {
      const initialUsdaxDebt: BN = new BN(10_000 * 1_000_000);
      let timestamp: number;
      beforeEach('Alice takes loan', async () => {
        const timestampBeforeBorrow = await time.increase(0);
        console.log('timestamp before Borrow:', timestampBeforeBorrow);
        await lendingPool.withSigner(alice).tx.borrow(usdaxContract.address, alice.address, initialUsdaxDebt, []);
        const timestampAfterBorrow = await time.increase(0);
        console.log('timestamp after Borrow:', timestampAfterBorrow);
        timestamp = await time.increase(ONE_YEAR.toNumber());
        console.log('timestamp after Borrow and increase:', timestamp);
      });

      it('Alice repays 10 000 USDax, debt should be accumulated', async () => {
        const capturedTransferEvents: Transfer[] = [];
        usdaxContract.events.subscribeOnTransferEvent((event) => {
          capturedTransferEvents.push(event);
        });
        const timestampBeforeRepay = await time.increase(0);
        console.log('timestamp before Repay:', timestampBeforeRepay);
        await expect(lendingPool.withSigner(alice).query.repay(usdaxContract.address, alice.address, initialUsdaxDebt, [])).to.haveOkResult();
        const tx = lendingPool.withSigner(alice).tx.repay(usdaxContract.address, alice.address, initialUsdaxDebt, []);
        await expect(tx).to.eventually.be.fulfilled;
        const txRes = await tx;
        const timestampAfterRepay = await time.increase(0);
        console.log('timestamp before Repay:', timestampAfterRepay);
        const reserveData = (await lendingPool.query.viewReserveData(usdaxContract.address)).value.ok!;
        const userReserveData = (await lendingPool.query.viewUnupdatedUserReserveData(usdaxContract.address, alice.address)).value.ok!;

        expect.soft(stringifyNumericProps(reserveData)).to.deep.equal({
          activated: true,
          freezed: false,
          currentDebtRateE18: '350000',
          currentDepositRateE18: '0',
          totalDebt: '110376000', // [3.5 * 10^11 * YearInMS] / 10^24 * 10^10  [[curent_debt_rate * time] * debt]
          totalDeposit: '0',
        });
        expect.soft(stringifyNumericProps(userReserveData)).to.deep.equal({
          appliedDebtIndexE18: '1011037600000000000', // 10^18 * (10^18 +(3.5 * 10^11 * YearInMS / E6))
          appliedDepositIndexE18: '1000000000000000000',
          debt: '110376000', // same as totalDebt above
          deposit: '0',
        });
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'Repay',
            args: {
              amount: initialUsdaxDebt.toString(),
              onBehalfOf: alice.address,
              caller: alice.address,
              asset: usdaxContract.address,
            },
          },
        ]);
        expect.soft(stringifyNumericProps(capturedTransferEvents)).to.deep.equal([
          {
            from: alice.address,
            to: null,
            value: initialUsdaxDebt.toString(),
          },
        ]);
        expect.flushSoft();
      });
    });
  });
});
