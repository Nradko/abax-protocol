import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import BN from 'bn.js';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';

export const FLASH_BORROWER = 1112475474;
export const ASSET_LISTING_ADMIN = 1094072439;
export const PARAMETERS_ADMIN = 368001360;
export const EMERGENCY_ADMIN = 297099943;
export const GLOBAL_ADMIN = 2459877095;
export const ROLE_ADMIN = 0;
export const TREASURY = 2434241257;

makeSuite('Market Rule tests. Create MarketRule for Stablecoins only with id 1', (getTestEnv) => {
  let testEnv: TestEnv;
  let users: KeyringPair[];
  let owner: KeyringPair;
  let user: KeyringPair;
  let parametersAdmin: KeyringPair;
  let lendingPool: LendingPoolContract;
  beforeEach('create MarketRule for Stablecoins only with id 1', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    owner = testEnv.owner;
    users = testEnv.users;
    user = users[0];
    parametersAdmin = users[6];

    await lendingPool.withSigner(owner).tx.grantRole(PARAMETERS_ADMIN, parametersAdmin.address);
    await lendingPool
      .withSigner(parametersAdmin)
      .tx.addMarketRule(1, [
        { collateralCoefficientE6: 970000, borrowCoefficientE6: 1030000, penaltyE6: 150000 },
        { collateralCoefficientE6: 970000, borrowCoefficientE6: 1030000, penaltyE6: 150000 },
        null,
        null,
      ]);
  });
  describe('User poses 10_000 of USDC,DAI and 1 WETH. User deposits 5_000 each stable coin and 0.5WETH and set them all as collaterals. Then user takes loan 2_500 of USDC and DAI and 0.25 of WETH. Then...', () => {
    let daiContract: PSP22Emitable;
    let wethContract: PSP22Emitable;
    let usdcContract: PSP22Emitable;

    let daiUserBalance: BN;
    let usdcUserBalance: BN;
    let wethUserBalance: BN;

    beforeEach('make deposits and take loans', async () => {
      daiContract = testEnv.reserves['DAI'].underlying;
      usdcContract = testEnv.reserves['USDC'].underlying;
      wethContract = testEnv.reserves['WETH'].underlying;

      daiUserBalance = await convertToCurrencyDecimals(daiContract, 10000);
      usdcUserBalance = await convertToCurrencyDecimals(usdcContract, 10000);
      wethUserBalance = await convertToCurrencyDecimals(wethContract, 1);
      // mint tokens
      await daiContract.tx.mint(user.address, daiUserBalance);
      await usdcContract.tx.mint(user.address, usdcUserBalance);
      await wethContract.tx.mint(user.address, wethUserBalance);
      // aprove lending pool
      await daiContract.withSigner(user).tx.approve(lendingPool.address, daiUserBalance);
      await usdcContract.withSigner(user).tx.approve(lendingPool.address, usdcUserBalance);
      await wethContract.withSigner(user).tx.approve(lendingPool.address, wethUserBalance);
      // deposit
      await lendingPool.withSigner(user).tx.deposit(daiContract.address, user.address, daiUserBalance.divn(2), []);
      await lendingPool.withSigner(user).tx.deposit(usdcContract.address, user.address, usdcUserBalance.divn(2), []);
      await lendingPool.withSigner(user).tx.deposit(wethContract.address, user.address, wethUserBalance.divn(2), []);
      // set as collateral
      await lendingPool.withSigner(user).tx.setAsCollateral(daiContract.address, true);
      await lendingPool.withSigner(user).tx.setAsCollateral(usdcContract.address, true);
      await lendingPool.withSigner(user).tx.setAsCollateral(wethContract.address, true);

      await lendingPool.withSigner(user).tx.borrow(daiContract.address, user.address, daiUserBalance.divn(4), []);
      await lendingPool.withSigner(user).tx.borrow(usdcContract.address, user.address, usdcUserBalance.divn(4), []);
      await lendingPool.withSigner(user).tx.borrow(wethContract.address, user.address, wethUserBalance.divn(4), []);
    });

    it('User tries to switch market mode to stablecoin only mode. Fails with Err(LendingPoolError::RuleCollateralDisable)', async () => {
      const queryRes = (await lendingPool.withSigner(user).query.changeMarketRule(1)).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.RuleCollateralDisable());
    });

    describe(`User turn off WETH as uncollateral. Then`, () => {
      beforeEach('removes collateral', async () => {
        await lendingPool.withSigner(user).tx.setAsCollateral(wethContract.address, false);
      });
      it('User tries to switch market mode to stablecoin only mode. Fails with Err(LendingPoolError::RuleBorrowDisable)', async () => {
        const queryRes = (await lendingPool.withSigner(user).query.changeMarketRule(1)).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.RuleBorrowDisable());
      });
      describe(`User repays WETH debt. Then`, () => {
        beforeEach('repays WETH debt', async () => {
          await lendingPool.withSigner(user).tx.repay(wethContract.address, user.address, null, []);
        });
        it('User tries to switch market mode and succeeds as user has enough collateral. Event should be emitted.', async () => {
          const txRes = await lendingPool.withSigner(user).tx.changeMarketRule(1);
          expect(txRes.events).to.deep.equal([
            {
              name: 'MarketRuleChosen',
              args: {
                user: user.address,
                marketRuleId: 1,
              },
            },
          ]);
          const userCollateral = (await lendingPool.query.getUserFreeCollateralCoefficient(user.address)).value.ok!;
          expect(userCollateral[0]).to.be.equal(true);
        });

        it(`After user chooses stablecoin market ParametersAdmin decreases collateralCoefficient of USDC to 0. User gets undercollateralized`, async () => {
          await lendingPool.withSigner(user).tx.changeMarketRule(1);
          const txRes = await lendingPool.withSigner(parametersAdmin).tx.modifyAssetRule(1, usdcContract.address, 0, 1030000, 15000);
          expect(txRes.events).to.deep.equal([
            {
              name: 'AssetRulesChanged',
              args: {
                marketRuleId: 1,
                asset: testEnv.reserves['USDC'].underlying.address,
                collateralCoefficientE6: 0,
                borrowCoefficientE6: 1030000,
                penaltyE6: 15000,
              },
            },
          ]);
          const userCollateral = (await lendingPool.query.getUserFreeCollateralCoefficient(user.address)).value.ok!;
          expect(userCollateral[0]).to.be.equal(false);
        });
      });
    });
  });
});
