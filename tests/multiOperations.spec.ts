import { KeyringPair } from '@polkadot/keyring/types';

import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { MAX_U128, ROLES } from './consts';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv, TestEnvReserves } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { stringifyNumericProps } from 'wookashwackomytest-polkahat-chai-matchers';
import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import ATokenContract from 'typechain/contracts/a_token';

makeSuite.only('Multi operations', (getTestEnv) => {
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
  let aTokenUsdcContract: ATokenContract;
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
          lendingPool.withSigner(bob).query.multiOp([
            {
              deposit: [daiContract.address, bob.address, initialDaiBalance, []],
            },
            {
              deposit: [usdcContract.address, bob.address, initialUsdcBalance, []],
            },
          ]),
        ).to.haveOkResult();

        const tx = lendingPool.withSigner(bob).tx.multiOp([
          {
            deposit: [daiContract.address, bob.address, initialDaiBalance, []],
          },
          {
            deposit: [usdcContract.address, bob.address, initialUsdcBalance, []],
          },
        ]);
        await expect(tx).to.eventually.be.fulfilled;

        // const aliceATokenDaiBalance = (await aTokenDaiContract.query.balanceOf(alice.address)).value.ok!;
        // expect(aliceATokenDaiBalance.toString()).to.equal(initialDaiBalance.toString());
        // const aliceATokenUsdcBalance = (await aTokenUsdcContract.query.balanceOf(alice.address)).value.ok!;
        // expect(aliceATokenUsdcBalance.toString()).to.equal(initialUsdcBalance.toString());

        await expect(tx).to.changePSP22Balances(aTokenDaiContract, [bob.address], [initialDaiBalance]);
        await expect(tx).to.changePSP22Balances(aTokenUsdcContract, [bob.address], [initialUsdcBalance]);
      });
    });
  });
});
