import { ReturnNumber } from '@727-ventures/typechain-types';
import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import AToken from 'typechain/contracts/a_token';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import VToken from 'typechain/contracts/v_token';
import { PSP22ErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { BlockTimestampProvider, replaceRNBNPropsWithStrings } from '@abaxfinance/contract-helpers';
import { expect } from './setup/chai';
import { ONE_YEAR } from './consts';

makeSuite('AbacusToken transfers', (getTestEnv) => {
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
  });

  describe('Alice and Bob have 10000$ of both DAI and USDC supplied to the leningPool. Then ...', () => {
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

    it('Alice should NOT be able to transfer more than she has', async () => {
      const queryResult = (await aTokenDaiContract.withSigner(alice).query.transfer(bob.address, initialDaiBalance.addn(1), [])).value.ok;
      expect(queryResult).to.have.deep.property('err', PSP22ErrorBuilder.InsufficientBalance());
    });

    it('Alice should be able to transfer all her balance of aDAI to Bob, and then Bob should be able to transfer all his aDai Balance to Alice', async () => {
      await expect(aTokenDaiContract.withSigner(alice).tx.transfer(bob.address, initialDaiBalance, [])).to.eventually.be.fulfilled;
      await expect(aTokenDaiContract.withSigner(bob).tx.transfer(alice.address, initialDaiBalance.muln(2), [])).to.eventually.be.fulfilled;
    });

    it('Alice should be able to transfer all her balance of aDAI to Bob, event should be emitted and supply should be transferred inside lendingPool contract', async () => {
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
      const aliceSupplyAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, alice.address)).value.ok!;
      const bobSupplyAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, bob.address)).value.ok!;

      expect.soft(aliceBalanceAfter.rawNumber.toString()).to.equal('0');
      expect.soft(aliceSupplyAfter.supplied.rawNumber.toString()).to.equal('0');

      expect.soft(bobBalanceAfter.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.soft(bobSupplyAfter.supplied.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
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
      const aliceSupplyAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, alice.address)).value.ok!;
      const bobSupplyAfter = (await lendingPool.query.viewUserReserveData(daiContract.address, bob.address)).value.ok!;

      expect.soft(aliceBalanceAfter.rawNumber.toString()).to.equal('0');
      expect.soft(aliceSupplyAfter.supplied.rawNumber.toString()).to.equal('0');

      expect.soft(bobBalanceAfter.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
      expect.soft(bobSupplyAfter.supplied.rawNumber.toString()).to.equal(initialDaiBalance.muln(2).toString());
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

    describe('Alice takes 1WETH loan after Charlie has supplied 10 WETH. Then...', () => {
      let vTokenWETHContract: VToken;
      let aliceDebt: BN;
      beforeEach('Alice SetAsCollateral USDC and DAI and she takes loan', async () => {
        const charliesDeposit = await convertToCurrencyDecimals(wethContract, 10);
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
          const tx1 = await vTokenWETHContract.withSigner(bob).tx.increaseAllowance(alice.address, aliceDebt);
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
            const tx = vTokenWETHContract.withSigner(alice).tx.transfer(bob.address, aliceDebt, []);
            await expect(tx).to.eventually.be.fulfilled;
            const txRes = await tx;
            const RN = ReturnNumber;
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
          });
        });
      });
    });
  });
});
