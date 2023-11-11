import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import AToken from 'typechain/contracts/a_token';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import VToken from 'typechain/contracts/v_token';
import StableToken from 'typechain/contracts/stable_token';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves, TestEnvStables } from './scenarios/utils/make-suite';
import { LendingPoolErrorBuilder, replaceRNBNPropsWithStrings } from '@abaxfinance/contract-helpers';
import { expect } from './setup/chai';
import { ONE_YEAR } from './consts';
import { BorrowVariable, Deposit, Redeem, RepayVariable } from 'typechain/event-types/lending_pool';
import { Transfer } from 'typechain/event-types/a_token';
import { PSP22ErrorBuilder } from 'typechain/types-returns/a_token';

makeSuite('AbaxStableToken', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let stables: TestEnvStables;
  let users: KeyringPair[];
  let alice: KeyringPair;
  let bob: KeyringPair;
  let charlie: KeyringPair;
  let dave: KeyringPair;
  let daiContract: PSP22Emitable;
  let usdcContract: PSP22Emitable;
  let wethContract: PSP22Emitable;
  let usdaxContract: StableToken;
  let aTokenDaiContract: AToken;
  let aTokenUsdcContract: AToken;
  let aTokenWETHContract: AToken;

  beforeEach('setup Env', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    stables = testEnv.stables;
    users = testEnv.users;
    alice = users[0];
    bob = users[1];
    charlie = users[2];
    dave = users[3];
    daiContract = reserves['DAI'].underlying;
    usdcContract = reserves['USDC'].underlying;
    wethContract = reserves['WETH'].underlying;
    usdaxContract = testEnv.stables['USDax'].underlying;
    aTokenDaiContract = reserves['DAI'].aToken;
    aTokenUsdcContract = reserves['USDC'].aToken;
    aTokenWETHContract = reserves['WETH'].aToken;
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
      expect(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
        {
          name: 'BorrowVariable',
          args: {
            amount: initialUsdaxDebt.toString(),
            onBehalfOf: alice.address,
            caller: alice.address,
            asset: usdaxContract.address,
          },
        },
      ]);
      expect(replaceRNBNPropsWithStrings(capturedTransferEvents)).to.deep.equal([
        {
          from: null,
          to: alice.address,
          value: initialUsdaxDebt.toString(),
        },
      ]);
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
        await lendingPool.withSigner(alice).tx.borrow(usdaxContract.address, alice.address, initialUsdaxDebt, []);
        await testEnv.blockTimestampProvider.tx.increaseBlockTimestamp(ONE_YEAR);
        timestamp = (await testEnv.blockTimestampProvider.query.getBlockTimestamp()).value.ok!;
      });

      it('Alice repays 10 000 USDax, debt should be accumulated', async () => {
        const capturedTransferEvents: Transfer[] = [];
        usdaxContract.events.subscribeOnTransferEvent((event) => {
          capturedTransferEvents.push(event);
        });
        const tx = lendingPool.withSigner(alice).tx.repay(usdaxContract.address, alice.address, initialUsdaxDebt, []);
        await expect(tx).to.eventually.be.fulfilled;
        const txRes = await tx;
        const reserveData = (await lendingPool.query.viewUnupdatedReserveData(usdaxContract.address)).value.ok!;
        const userReserveData = (await lendingPool.query.viewUnupdatedUserReserveData(usdaxContract.address, alice.address)).value.ok!;

        expect.soft(replaceRNBNPropsWithStrings(reserveData)).to.deep.equal({
          activated: true,
          freezed: false,
          currentDebtRateE24: '350000000000',
          currentDepositRateE24: '0',
          totalDebt: '110376000', // [3.5 * 10^11 * YearInMS] / 10^24 * 10^10  [[curent_debt_rate * time] * debt]
          totalDeposit: '0',
          indexesUpdateTimestamp: timestamp,
        });
        expect.soft(replaceRNBNPropsWithStrings(userReserveData)).to.deep.equal({
          appliedCumulativeDebtIndexE18: '1011037600000000002', // 10^18 * (10^18 +(3.5 * 10^11 * YearInMS / E6 +1)) +1
          appliedCumulativeDepositIndexE18: '1000000000000000000',
          debt: '110376001', // same as totalDebt above +1
          deposit: '0',
        });
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'RepayVariable',
            args: {
              amount: initialUsdaxDebt.toString(),
              onBehalfOf: alice.address,
              caller: alice.address,
              asset: usdaxContract.address,
            },
          },
        ]);
        expect.soft(replaceRNBNPropsWithStrings(capturedTransferEvents)).to.deep.equal([
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
