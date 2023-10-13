import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import AToken from 'typechain/contracts/a_token';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import VToken from 'typechain/contracts/v_token';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { replaceRNBNPropsWithStrings } from '@abaxfinance/contract-helpers';
import { expect } from './setup/chai';
import { ONE_YEAR } from './consts';
import { BorrowVariable, Deposit, Redeem, RepayVariable } from 'typechain/event-types/lending_pool';
import { Transfer } from 'typechain/event-types/a_token';
import { PSP22ErrorBuilder } from 'typechain/types-returns/a_token';

makeSuite('AbaxToken transfers', (getTestEnv) => {
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
  let aTokenDaiContract: AToken;
  let aTokenUsdcContract: AToken;
  let aTokenWETHContract: AToken;

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
    aTokenUsdcContract = reserves['USDC'].aToken;
    aTokenWETHContract = reserves['WETH'].aToken;
  });

  describe('Alice and Bob have 10000$ of both DAI and USDC deposit to the Lending Pool. Then ...', () => {
    let initialDaiBalance: BN;
    let initialUsdcBalance: BN;

    beforeEach('make deposit and make borrow', async () => {
      initialDaiBalance = await convertToCurrencyDecimals(daiContract, 10000);
      await daiContract.tx.mint(alice.address, initialDaiBalance);
      await daiContract.withSigner(alice).tx.approve(lendingPool.address, initialDaiBalance);
      await lendingPool.withSigner(alice).tx.deposit(daiContract.address, alice.address, initialDaiBalance, []);
      await daiContract.tx.mint(bob.address, initialDaiBalance);
      await daiContract.withSigner(bob).tx.approve(lendingPool.address, initialDaiBalance);
      await lendingPool.withSigner(bob).tx.deposit(daiContract.address, bob.address, initialDaiBalance, []);
      //
      initialUsdcBalance = await convertToCurrencyDecimals(usdcContract, 10000);
      await usdcContract.tx.mint(alice.address, initialUsdcBalance);
      await usdcContract.withSigner(alice).tx.approve(lendingPool.address, initialUsdcBalance);
      await lendingPool.withSigner(alice).tx.deposit(usdcContract.address, alice.address, initialUsdcBalance, []);
      await usdcContract.tx.mint(bob.address, initialUsdcBalance);
      await usdcContract.withSigner(bob).tx.approve(lendingPool.address, initialUsdcBalance);
      await lendingPool.withSigner(bob).tx.deposit(usdcContract.address, bob.address, initialUsdcBalance, []);
    });

    it('they should have apropariate amount of aTokens', async () => {
      const aliceATokenDaiBalance = (await aTokenDaiContract.query.balanceOf(alice.address)).value.ok!;
      expect(aliceATokenDaiBalance.rawNumber.toString()).to.equal(initialDaiBalance.toString());
      const aliceATokenUsdcBalance = (await aTokenUsdcContract.query.balanceOf(alice.address)).value.ok!;
      expect(aliceATokenUsdcBalance.rawNumber.toString()).to.equal(initialUsdcBalance.toString());

      const bobATokenDaiBalance = (await aTokenDaiContract.query.balanceOf(bob.address)).value.ok!;
      expect(bobATokenDaiBalance.rawNumber.toString()).to.equal(initialDaiBalance.toString());
      const bobATokenUsdcBalance = (await aTokenUsdcContract.query.balanceOf(bob.address)).value.ok!;
      expect(bobATokenUsdcBalance.rawNumber.toString()).to.equal(initialUsdcBalance.toString());
    });

    it('Alice should NOT be able to transfer more aDai than she has', async () => {
      const queryResult = (await aTokenDaiContract.withSigner(alice).query.transfer(bob.address, initialDaiBalance.addn(1), [])).value.ok;
      expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.InsufficientBalance());
    });

    it('Alice should be able to transfer all her balance of aDAI to Bob, and then Bob should be able to transfer all his aDai Balance to Alice', async () => {
      await expect(aTokenDaiContract.withSigner(alice).tx.transfer(bob.address, initialDaiBalance, [])).to.eventually.be.fulfilled;
      await expect(aTokenDaiContract.withSigner(bob).tx.transfer(alice.address, initialDaiBalance.muln(2), [])).to.eventually.be.fulfilled;
    });

    it('Alice should be able to transfer all her balance of aDAI to Bob, event should be emitted and supply should be transferred inside Lending Pool contract', async () => {
      const tx = aTokenDaiContract.withSigner(alice).tx.transfer(bob.address, initialDaiBalance, []);
      await expect(tx).to.eventually.be.fulfilled;
      const txRes = await tx;
      expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
        {
          name: 'Transfer',
          args: {
            from: alice.address,
            to: bob.address,
            value: initialDaiBalance.toString(),
          },
        },
      ]);
      const aliceBalanceAfter = (await aTokenDaiContract.query.balanceOf(alice.address)).value.ok!;
      const bobBalanceAfter = (await aTokenDaiContract.query.balanceOf(bob.address)).value.ok!;
      const aliceDepositAfter = (await lendingPool.query.viewUnupdatedUserReserveData(daiContract.address, alice.address)).value.ok!;
      const bobDepositAfter = (await lendingPool.query.viewUnupdatedUserReserveData(daiContract.address, bob.address)).value.ok!;

      expect.soft(aliceBalanceAfter.rawNumber.toString()).to.equal('0');
      expect.soft(aliceDepositAfter.deposit.rawNumber.toString()).to.equal('0');

      expect.soft(bobBalanceAfter.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.soft(bobDepositAfter.deposit.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.flushSoft();
    });

    it('Charlie should NOT be able to transfer from Alice to BoB', async () => {
      const queryResult = (await aTokenDaiContract.withSigner(charlie).query.transferFrom(alice.address, bob.address, 1, [])).value.ok;
      expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.InsufficientAllowance());
    });

    it('After Alice gives Charlie allowance, Charlie should be able to transfer from Alice to BoB', async () => {
      await aTokenDaiContract.withSigner(alice).tx.increaseAllowance(charlie.address, initialDaiBalance);
      const tx = aTokenDaiContract.withSigner(charlie).tx.transferFrom(alice.address, bob.address, initialDaiBalance, []);
      await expect(tx).to.eventually.be.fulfilled;
      const txRes = await tx;
      const aliceBalanceAfter = (await aTokenDaiContract.query.balanceOf(alice.address)).value.ok!;
      const bobBalanceAfter = (await aTokenDaiContract.query.balanceOf(bob.address)).value.ok!;
      const aliceDepositAfter = (await lendingPool.query.viewUnupdatedUserReserveData(daiContract.address, alice.address)).value.ok!;
      const bobDepositAfter = (await lendingPool.query.viewUnupdatedUserReserveData(daiContract.address, bob.address)).value.ok!;

      expect.soft(aliceBalanceAfter.rawNumber.toString()).to.equal('0');
      expect.soft(aliceDepositAfter.deposit.rawNumber.toString()).to.equal('0');

      expect.soft(bobBalanceAfter.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.soft(bobDepositAfter.deposit.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
        {
          name: 'Approval',
          args: {
            owner: alice.address,
            spender: charlie.address,
            value: '0',
          },
        },
        {
          name: 'Transfer',
          args: {
            from: alice.address,
            to: bob.address,
            value: initialDaiBalance.toString(),
          },
        },
      ]);
      expect.flushSoft();
    });

    describe('Alice takes 1WETH loan after Charlie has deposit 10 WETH. Then...', () => {
      let vTokenWETHContract: VToken;
      let aliceDebt: BN;
      let charliesDeposit: BN;
      beforeEach('Alice SetAsCollateral USDC and DAI and she takes loan', async () => {
        charliesDeposit = await convertToCurrencyDecimals(wethContract, 10);
        await wethContract.tx.mint(charlie.address, charliesDeposit);
        await wethContract.withSigner(charlie).tx.approve(lendingPool.address, charliesDeposit);
        await lendingPool.withSigner(charlie).tx.deposit(wethContract.address, charlie.address, charliesDeposit, []);

        aliceDebt = await convertToCurrencyDecimals(wethContract, 1);
        await lendingPool.withSigner(alice).tx.setAsCollateral(reserves['DAI'].underlying.address, true);
        await lendingPool.withSigner(alice).tx.setAsCollateral(reserves['USDC'].underlying.address, true);
        await lendingPool.withSigner(alice).tx.borrow(reserves['WETH'].underlying.address, alice.address, aliceDebt, [0]);
        vTokenWETHContract = reserves['WETH'].vToken;
      });

      it('Alice should have apropariate vWETH balance', async () => {
        const aliceVTokenWethBalance = (await vTokenWETHContract.query.balanceOf(alice.address)).value.ok!;
        expect(aliceVTokenWethBalance.rawNumber.toString()).to.equal(aliceDebt.toString());
      });

      it('Alice should not be able to transfer vWETH to Bob because of lack of allowance', async () => {
        const queryResult = (await vTokenWETHContract.withSigner(alice).query.transfer(bob.address, aliceDebt, [])).value.ok;
        expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.InsufficientAllowance());
      });
      describe('Bob and Dave gives Alice allowance to transfer vWETH to them', () => {
        beforeEach('giving allowance', async () => {
          await vTokenWETHContract.withSigner(bob).tx.increaseAllowance(alice.address, aliceDebt);
          await vTokenWETHContract.withSigner(dave).tx.increaseAllowance(alice.address, aliceDebt);
        });
        it('Alice should have apropariate allowance', async () => {
          const aliceToBobAllowace = (await vTokenWETHContract.withSigner(alice).query.allowance(bob.address, alice.address)).value.ok!;
          expect(aliceToBobAllowace.rawNumber.toString()).to.equal(aliceDebt.toString());
        });

        it('Alice should not be able to transfer vWETH to Dave because Dave does not have collateral', async () => {
          const queryResult = (await vTokenWETHContract.withSigner(alice).query.transfer(dave.address, aliceDebt, [])).value.ok;
          expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.Custom('InsufficientCollateral'));
        });

        it('Alice should not be able to transfer vWETH to Bob because Bob doesnt have collateral', async () => {
          const queryResult = (await vTokenWETHContract.withSigner(alice).query.transfer(bob.address, aliceDebt, [])).value.ok!;
          expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.Custom('InsufficientCollateral'));
        });
        describe('bob sets his collaterals. Then...', () => {
          beforeEach('a', async () => {
            await lendingPool.withSigner(bob).tx.setAsCollateral(reserves['DAI'].underlying.address, true);
            await lendingPool.withSigner(bob).tx.setAsCollateral(reserves['USDC'].underlying.address, true);
          });
          it('Alice should be able to transfer vWETH to Bob and Transfer event should be emitted', async () => {
            const capturedRepayEvents: RepayVariable[] = [];
            lendingPool.events.subscribeOnRepayVariableEvent((event) => {
              capturedRepayEvents.push(event);
            });
            const capturedBorrowEvents: BorrowVariable[] = [];
            lendingPool.events.subscribeOnBorrowVariableEvent((event) => {
              capturedBorrowEvents.push(event);
            });
            const tx = vTokenWETHContract.withSigner(alice).tx.transfer(bob.address, aliceDebt, []);
            await expect(tx).to.eventually.be.fulfilled;
            const txRes = await tx;
            expect(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
              {
                name: 'Approval',
                args: {
                  owner: bob.address,
                  spender: alice.address,
                  value: '0',
                },
              },
              {
                name: 'Transfer',
                args: {
                  from: alice.address,
                  to: bob.address,
                  value: aliceDebt.toString(),
                },
              },
            ]);
            expect(replaceRNBNPropsWithStrings(capturedRepayEvents)).to.deep.equal([
              {
                asset: wethContract.address,
                caller: vTokenWETHContract.address,
                onBehalfOf: alice.address,
                amount: aliceDebt.toString(),
              },
            ]);

            expect(replaceRNBNPropsWithStrings(capturedBorrowEvents)).to.deep.equal([
              {
                asset: wethContract.address,
                caller: vTokenWETHContract.address,
                onBehalfOf: bob.address,
                amount: aliceDebt.toString(),
              },
            ]);
          });
          describe(` Bob takes 0.01 Weth loan. One year passes and interests accumulate. Then...`, () => {
            let bobDebt: BN;
            beforeEach('time passes', async () => {
              bobDebt = await convertToCurrencyDecimals(wethContract, 0.01);
              await lendingPool.withSigner(bob).tx.borrow(wethContract.address, bob.address, bobDebt, []);
              await testEnv.blockTimestampProvider.tx.increaseBlockTimestamp(ONE_YEAR);
            });
            it('Alice should be able to transfer vWETH to Bob and Transfer multiple events(inluding Alice debt mint) should be emitted', async () => {
              const capturedRepayEvents: RepayVariable[] = [];
              lendingPool.events.subscribeOnRepayVariableEvent((event) => {
                capturedRepayEvents.push(event);
              });
              const capturedBorrowEvents: BorrowVariable[] = [];
              lendingPool.events.subscribeOnBorrowVariableEvent((event) => {
                capturedBorrowEvents.push(event);
              });
              const capturedTransferEvents: Transfer[] = [];
              aTokenWETHContract.events.subscribeOnTransferEvent((event) => {
                capturedTransferEvents.push(event);
              });
              const querry = await vTokenWETHContract.withSigner(alice).query.transfer(bob.address, aliceDebt, []);
              const tx = vTokenWETHContract.withSigner(alice).tx.transfer(bob.address, aliceDebt, []);
              await expect(tx).to.eventually.be.fulfilled;
              const txRes = await tx;
              expect(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
                {
                  name: 'Approval',
                  args: {
                    owner: bob.address,
                    spender: alice.address,
                    value: '0',
                  },
                },
                {
                  name: 'Transfer',
                  args: {
                    from: null,
                    to: alice.address,
                    value: `1911081600031539`, // ~ ((3 * 10^11)/4.95 +1) * Year / 10^6 [(current_debt_rate_e24)* year /10^6]
                  },
                },
                {
                  name: 'Transfer',
                  args: {
                    from: null,
                    to: bob.address,
                    value: `19110816000316`, // 1/100 of the above
                  },
                },
                {
                  name: 'Transfer',
                  args: {
                    from: alice.address,
                    to: bob.address,
                    value: aliceDebt.toString(),
                  },
                },
              ]);
              expect(replaceRNBNPropsWithStrings(capturedRepayEvents)).to.deep.equal([
                {
                  asset: wethContract.address,
                  caller: vTokenWETHContract.address,
                  onBehalfOf: alice.address,
                  amount: aliceDebt.toString(),
                },
              ]);

              expect(replaceRNBNPropsWithStrings(capturedBorrowEvents)).to.deep.equal([
                {
                  asset: wethContract.address,
                  caller: vTokenWETHContract.address,
                  onBehalfOf: bob.address,
                  amount: aliceDebt.toString(),
                },
              ]);

              expect(replaceRNBNPropsWithStrings(capturedTransferEvents)).to.deep.equal([]);
            });

            it('Charlie should be able to transfer aWETH to Alice and Transfer multiple events(inluding Alice debt mint) should be emitted', async () => {
              const capturedDepositEvents: Deposit[] = [];
              lendingPool.events.subscribeOnDepositEvent((event) => {
                capturedDepositEvents.push(event);
              });
              const capturedRedeemEvents: Redeem[] = [];
              lendingPool.events.subscribeOnRedeemEvent((event) => {
                capturedRedeemEvents.push(event);
              });
              const capturedTransferEvents: Transfer[] = [];
              vTokenWETHContract.events.subscribeOnTransferEvent((event) => {
                capturedTransferEvents.push(event);
              });
              const tx = aTokenWETHContract.withSigner(charlie).tx.transfer(alice.address, charliesDeposit, []);
              await expect(tx).to.eventually.be.fulfilled;
              const txRes = await tx;
              expect(replaceRNBNPropsWithStrings(txRes.events), 'AWeth events').to.deep.equal([
                {
                  name: 'Transfer',
                  args: {
                    from: null,
                    to: charlie.address,
                    value: '1930173114075840', // ~ alice interest * 1.01, because Bob also has debt and charlie is the only supplier.
                  },
                },
                {
                  name: 'Transfer',
                  args: {
                    from: charlie.address,
                    to: alice.address,
                    value: charliesDeposit.toString(),
                  },
                },
              ]);
              expect(replaceRNBNPropsWithStrings(capturedDepositEvents), 'LendingPool Deposit event').to.deep.equal([
                {
                  asset: wethContract.address,
                  caller: aTokenWETHContract.address,
                  onBehalfOf: alice.address,
                  amount: charliesDeposit.toString(),
                },
              ]);

              expect(replaceRNBNPropsWithStrings(capturedRedeemEvents), 'LendingPool Redeem event').to.deep.equal([
                {
                  asset: wethContract.address,
                  caller: aTokenWETHContract.address,
                  onBehalfOf: charlie.address,
                  amount: charliesDeposit.toString(),
                },
              ]);

              expect(replaceRNBNPropsWithStrings(capturedTransferEvents), 'VWeth Transfer event').to.deep.equal([
                {
                  from: null,
                  to: alice.address,
                  value: `1911081600031539`, // ~ ((3 * 10^11)/4.95 +1) * Year / 10^6 [(current_debt_rate_e24)* year /10^6]
                },
              ]);
            });

            describe('Charlie sets Weth as a collateral and gives Alice allowance to trasnfer vWETH', () => {
              beforeEach('set collateral and igive allowance', async () => {
                await lendingPool.withSigner(charlie).tx.setAsCollateral(wethContract.address, true);
                await vTokenWETHContract.withSigner(charlie).tx.increaseAllowance(alice.address, aliceDebt);
              });
              it('Alice should be able to transfer vWETH to Charlie and Transfer multiple events(inluding Alice debt mint) should be emitted', async () => {
                const capturedRepayEvents: RepayVariable[] = [];
                lendingPool.events.subscribeOnRepayVariableEvent((event) => {
                  capturedRepayEvents.push(event);
                });
                const capturedBorrowEvents: RepayVariable[] = [];
                lendingPool.events.subscribeOnBorrowVariableEvent((event) => {
                  capturedBorrowEvents.push(event);
                });
                const capturedTransferEvents: Transfer[] = [];
                aTokenWETHContract.events.subscribeOnTransferEvent((event) => {
                  capturedTransferEvents.push(event);
                });
                const tx = vTokenWETHContract.withSigner(alice).tx.transfer(charlie.address, aliceDebt, []);
                await expect(tx).to.eventually.be.fulfilled;
                const txRes = await tx;
                expect(replaceRNBNPropsWithStrings(txRes.events), 'VWeth events').to.deep.equal([
                  {
                    name: 'Approval',
                    args: {
                      owner: charlie.address,
                      spender: alice.address,
                      value: '0',
                    },
                  },
                  {
                    name: 'Transfer',
                    args: {
                      from: null,
                      to: alice.address,
                      value: `1911081600031539`, // ~ ((3 * 10^11)/4.95 +1) * Year / 10^6 [(current_debt_rate_e24)* year /10^6]
                    },
                  },
                  {
                    name: 'Transfer',
                    args: {
                      from: alice.address,
                      to: charlie.address,
                      value: aliceDebt.toString(),
                    },
                  },
                ]);
                expect(replaceRNBNPropsWithStrings(capturedRepayEvents), 'LendingPool Repay event').to.deep.equal([
                  {
                    asset: wethContract.address,
                    caller: vTokenWETHContract.address,
                    onBehalfOf: alice.address,
                    amount: aliceDebt.toString(),
                  },
                ]);

                expect(replaceRNBNPropsWithStrings(capturedBorrowEvents), 'LendingPool Borrow event').to.deep.equal([
                  {
                    asset: wethContract.address,
                    caller: vTokenWETHContract.address,
                    onBehalfOf: charlie.address,
                    amount: aliceDebt.toString(),
                  },
                ]);

                expect(replaceRNBNPropsWithStrings(capturedTransferEvents), 'AWeth Transfer event').to.deep.equal([
                  {
                    from: null,
                    to: charlie.address,
                    value: '1930173114075840', // ~ alice interest * 1.01, because Bob also has debt and charlie is the only supplier.
                  },
                ]);
              });
            });
          });
        });
      });
    });
  });
});
