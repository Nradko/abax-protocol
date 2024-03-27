import { KeyringPair } from '@polkadot/keyring/types';

import BN from 'bn.js';
import ATokenContract from 'typechain/contracts/a_token';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import VTokenContract from 'typechain/contracts/v_token';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { TestEnv, TestEnvReserves, makeSuite } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { Operation } from 'typechain/types-arguments/lending_pool';
import { getContractEventsFromTx, stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';
import { LendingPoolEvent } from 'typechain/events/enum';

makeSuite('Multi operations', (getTestEnv) => {
  let testEnv: TestEnv;
  let lendingPool: LendingPoolContract;
  let reserves: TestEnvReserves;
  let users: KeyringPair[];
  let alice: KeyringPair;
  let bob: KeyringPair;
  let charlie: KeyringPair;
  let dave: KeyringPair;
  let daiContract: PSP22Emitable;
  let usdcContract: PSP22Emitable;
  let wethContract: PSP22Emitable;
  let aTokenDaiContract: ATokenContract;
  let vTokenDaiContract: VTokenContract;
  let aTokenUsdcContract: ATokenContract;
  let vTokenUsdcContract: VTokenContract;
  let aTokenWETHContract: ATokenContract;

  beforeEach('setup Env', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    reserves = testEnv.reserves;
    users = testEnv.users;
    alice = users[0];
    bob = users[1];
    charlie = users[2];
    dave = users[3];
    daiContract = reserves['DAI'].underlying;
    usdcContract = reserves['USDC'].underlying;
    wethContract = reserves['WETH'].underlying;
    aTokenDaiContract = reserves['DAI'].aToken;
    vTokenDaiContract = reserves['DAI'].vToken;
    aTokenUsdcContract = reserves['USDC'].aToken;
    vTokenUsdcContract = reserves['USDC'].vToken;
    aTokenWETHContract = reserves['WETH'].aToken;
  });

  describe('Alice and Bob have 10000$ of both DAI and USDC deposit to the Lending Pool. Then ...', () => {
    let initialDaiBalance: BN;
    let initialUsdcBalance: BN;

    beforeEach('make deposit and make borrow', async () => {
      initialDaiBalance = await convertToCurrencyDecimals(daiContract, 10000);
      await daiContract.tx.mint(alice.address, initialDaiBalance);
      await daiContract.withSigner(alice).tx.approve(lendingPool.address, initialDaiBalance);
      await daiContract.tx.mint(bob.address, initialDaiBalance);
      await daiContract.withSigner(bob).tx.approve(lendingPool.address, initialDaiBalance);
      //
      initialUsdcBalance = await convertToCurrencyDecimals(usdcContract, 10000);
      await usdcContract.tx.mint(alice.address, initialUsdcBalance);
      await usdcContract.withSigner(alice).tx.approve(lendingPool.address, initialUsdcBalance);
      await usdcContract.tx.mint(bob.address, initialUsdcBalance);
      await usdcContract.withSigner(bob).tx.approve(lendingPool.address, initialUsdcBalance);
    });
    describe('can perform multiple the same operations', () => {
      it('deposit', async () => {
        // await lendingPool.withSigner(alice).tx.deposit(daiContract.address, alice.address, initialDaiBalance, []);
        // await lendingPool.withSigner(alice).tx.deposit(usdcContract.address, alice.address, initialUsdcBalance, []);
        // await lendingPool.withSigner(bob).tx.deposit(daiContract.address, bob.address, initialDaiBalance, []);
        // await lendingPool.withSigner(bob).tx.deposit(usdcContract.address, bob.address, initialUsdcBalance, []);

        await expect(
          lendingPool.withSigner(bob).query.multiOp(
            [
              {
                op: Operation.deposit,
                args: {
                  asset: daiContract.address,
                  amount: initialDaiBalance,
                },
              },
              {
                op: Operation.deposit,
                args: {
                  asset: usdcContract.address,
                  amount: initialUsdcBalance,
                },
              },
            ],
            bob.address,
            [],
          ),
        ).to.haveOkResult();

        const tx = lendingPool.withSigner(bob).tx.multiOp(
          [
            {
              op: Operation.deposit,
              args: {
                asset: daiContract.address,
                amount: initialDaiBalance,
              },
            },
            {
              op: Operation.deposit,
              args: {
                asset: usdcContract.address,
                amount: initialUsdcBalance,
              },
            },
          ],
          bob.address,
          [],
        );
        await expect(tx).to.eventually.be.fulfilled;

        // const aliceATokenDaiBalance = (await aTokenDaiContract.query.balanceOf(alice.address)).value.ok!;
        // expect(aliceATokenDaiBalance.toString()).to.equal(initialDaiBalance.toString());
        // const aliceATokenUsdcBalance = (await aTokenUsdcContract.query.balanceOf(alice.address)).value.ok!;
        // expect(aliceATokenUsdcBalance.toString()).to.equal(initialUsdcBalance.toString());

        await expect(tx).to.changePSP22Balances(aTokenDaiContract, [bob.address], [initialDaiBalance]);
        await expect(tx).to.changePSP22Balances(aTokenUsdcContract, [bob.address], [initialUsdcBalance]);
      });

      describe('bob deposits 10000 DAI and 10000 USDC, then alice borrows 500 DAI and 1 WETH and repays 250 DAI in the same transaction', () => {
        beforeEach('make deposit', async () => {
          await lendingPool.withSigner(alice).tx.deposit(usdcContract.address, alice.address, initialUsdcBalance, []);

          const tx = lendingPool.withSigner(bob).tx.multiOp(
            [
              {
                op: Operation.deposit,
                args: {
                  asset: daiContract.address,
                  amount: initialDaiBalance,
                },
              },
              {
                op: Operation.deposit,
                args: {
                  asset: usdcContract.address,
                  amount: initialUsdcBalance,
                },
              },
            ],
            bob.address,
            [],
          );
          await expect(tx).to.eventually.be.fulfilled;

          const charliesDeposit = await convertToCurrencyDecimals(wethContract, 10);
          await wethContract.tx.mint(charlie.address, charliesDeposit);
          await wethContract.withSigner(charlie).tx.approve(lendingPool.address, charliesDeposit);
          await lendingPool.withSigner(charlie).tx.deposit(wethContract.address, charlie.address, charliesDeposit, []);
        });

        it('borrow and repay', async () => {
          const borrowAmountWeth = await convertToCurrencyDecimals(wethContract, 1);
          const borrowAmountDai = await convertToCurrencyDecimals(daiContract, 250);
          const repayAmountDai = await convertToCurrencyDecimals(daiContract, 250);
          await daiContract.withSigner(alice).tx.approve(lendingPool.address, repayAmountDai);
          await lendingPool.withSigner(alice).tx.setAsCollateral(usdcContract.address, true);

          await expect(
            lendingPool.withSigner(alice).query.multiOp(
              [
                {
                  op: Operation.borrow,
                  args: {
                    asset: daiContract.address,
                    amount: borrowAmountDai,
                  },
                },
                {
                  op: Operation.borrow,
                  args: {
                    asset: wethContract.address,
                    amount: borrowAmountWeth,
                  },
                },
                {
                  op: Operation.repay,
                  args: {
                    asset: daiContract.address,
                    amount: repayAmountDai,
                  },
                },
              ],
              alice.address,
              [],
            ),
          ).to.haveOkResult();

          const tx = lendingPool.withSigner(alice).tx.multiOp(
            [
              {
                op: Operation.borrow,
                args: {
                  asset: daiContract.address,
                  amount: borrowAmountDai,
                },
              },
              {
                op: Operation.borrow,
                args: {
                  asset: wethContract.address,
                  amount: borrowAmountWeth,
                },
              },
              {
                op: Operation.repay,
                args: {
                  asset: daiContract.address,
                  amount: repayAmountDai,
                },
              },
            ],
            alice.address,
            [],
          );
          await expect(tx).to.eventually.be.fulfilled;
          const vTokenWETHContract = reserves['WETH'].vToken;
          await expect(tx).to.changePSP22Balances(vTokenWETHContract, [alice.address], [borrowAmountWeth]);
          await expect(tx).to.changePSP22Balances(wethContract, [alice.address], [borrowAmountWeth]);
          await expect(tx).to.changePSP22Balances(daiContract, [alice.address], [borrowAmountDai.sub(repayAmountDai)]);

          const txRes = await tx;
          const [borrowEvents, allEvents] = getContractEventsFromTx(txRes, lendingPool as any, LendingPoolEvent.Borrow);
          const [repayEvents] = getContractEventsFromTx(txRes, lendingPool as any, LendingPoolEvent.Repay);

          expect(borrowEvents.length).to.equal(2);
          expect(repayEvents.length).to.equal(1);
          expect(allEvents.length).to.equal(3);
          expect(stringifyNumericProps(borrowEvents[0].args)).to.deep.equal(
            stringifyNumericProps({
              asset: daiContract.address,
              caller: alice.address,
              onBehalfOf: alice.address,
              amount: borrowAmountDai,
            }),
          );
          expect(stringifyNumericProps(borrowEvents[1].args)).to.deep.equal(
            stringifyNumericProps({
              asset: wethContract.address,
              caller: alice.address,
              onBehalfOf: alice.address,
              amount: borrowAmountWeth,
            }),
          );
          expect(stringifyNumericProps(repayEvents[0].args)).to.deep.equal(
            stringifyNumericProps({
              asset: daiContract.address,
              caller: alice.address,
              onBehalfOf: alice.address,
              amount: repayAmountDai,
            }),
          );

          //TODO rest of checks
        });
      });
    });
  });
});
