import { KeyringPair } from '@polkadot/keyring/types';

import BN from 'bn.js';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { MAX_U128, ROLES } from './consts';
import { convertToCurrencyDecimals } from './scenarios/utils/actions';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';

const PARAMETERS_ADMIN = ROLES['PARAMETERS_ADMIN'];
makeSuite('Market Rule tests. Create MarketRule for Stablecoins only with id 1', (getTestEnv) => {
  let testEnv: TestEnv;
  let accounts: KeyringPair[];
  let owner: KeyringPair;
  let account: KeyringPair;
  let parametersAdmin: KeyringPair;
  let lendingPool: LendingPoolContract;
  beforeEach('create MarketRule for Stablecoins only with id 1', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    owner = testEnv.owner;
    accounts = testEnv.accounts;
    account = accounts[0];
    parametersAdmin = accounts[6];

    await lendingPool.withSigner(owner).tx.grantRole(PARAMETERS_ADMIN, parametersAdmin.address);
    await lendingPool
      .withSigner(parametersAdmin)
      .tx.addMarketRule([
        { collateralCoefficientE6: 970000, borrowCoefficientE6: 1030000, penaltyE6: 150000 },
        { collateralCoefficientE6: 970000, borrowCoefficientE6: 1030000, penaltyE6: 150000 },
        null,
        null,
      ]);
  });
  describe('Account poses 10_000 of USDC,DAI and 1 WETH. Account deposits 5_000 each stable coin and 0.5WETH and set them all as collaterals. Then account takes loan 2_500 of USDC and DAI and 0.25 of WETH. Then...', () => {
    let daiContract: PSP22Emitable;
    let wethContract: PSP22Emitable;
    let usdcContract: PSP22Emitable;

    let daiAccountBalance: BN;
    let usdcAccountBalance: BN;
    let wethAccountBalance: BN;

    beforeEach('make deposits and take loans', async () => {
      daiContract = testEnv.reserves['DAI'].underlying;
      usdcContract = testEnv.reserves['USDC'].underlying;
      wethContract = testEnv.reserves['WETH'].underlying;

      daiAccountBalance = await convertToCurrencyDecimals(daiContract, 10000);
      usdcAccountBalance = await convertToCurrencyDecimals(usdcContract, 10000);
      wethAccountBalance = await convertToCurrencyDecimals(wethContract, 1);
      // mint tokens
      await daiContract.tx.mint(account.address, daiAccountBalance);
      await usdcContract.tx.mint(account.address, usdcAccountBalance);
      await wethContract.tx.mint(account.address, wethAccountBalance);
      // aprove lending pool
      await daiContract.withSigner(account).tx.approve(lendingPool.address, daiAccountBalance);
      await usdcContract.withSigner(account).tx.approve(lendingPool.address, usdcAccountBalance);
      await wethContract.withSigner(account).tx.approve(lendingPool.address, wethAccountBalance);
      // deposit
      await lendingPool.withSigner(account).tx.deposit(daiContract.address, account.address, daiAccountBalance.divn(2), []);
      await lendingPool.withSigner(account).tx.deposit(usdcContract.address, account.address, usdcAccountBalance.divn(2), []);
      await lendingPool.withSigner(account).tx.deposit(wethContract.address, account.address, wethAccountBalance.divn(2), []);
      // set as collateral
      await lendingPool.withSigner(account).tx.setAsCollateral(daiContract.address, true);
      await lendingPool.withSigner(account).tx.setAsCollateral(usdcContract.address, true);
      await lendingPool.withSigner(account).tx.setAsCollateral(wethContract.address, true);

      await lendingPool.withSigner(account).tx.borrow(daiContract.address, account.address, daiAccountBalance.divn(4), []);
      await lendingPool.withSigner(account).tx.borrow(usdcContract.address, account.address, usdcAccountBalance.divn(4), []);
      await lendingPool.withSigner(account).tx.borrow(wethContract.address, account.address, wethAccountBalance.divn(4), []);
    });

    it('Account tries to switch market mode to stablecoin only mode. Fails with Err(LendingPoolError::RuleCollateralDisable)', async () => {
      const queryRes = (await lendingPool.withSigner(account).query.chooseMarketRule(1)).value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.RuleCollateralDisable());
    });

    describe(`Account turns off WETH as uncollateral. Then`, () => {
      beforeEach('removes collateral', async () => {
        await lendingPool.withSigner(account).tx.setAsCollateral(wethContract.address, false);
      });
      it('Account tries to switch market mode to stablecoin only mode. Fails with Err(LendingPoolError::RuleBorrowDisable)', async () => {
        const queryRes = (await lendingPool.withSigner(account).query.chooseMarketRule(1)).value.ok;
        expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.RuleBorrowDisable());
      });
      describe(`Account repays WETH debt. Then`, () => {
        beforeEach('repays WETH debt', async () => {
          const q = await lendingPool.withSigner(account).query.repay(wethContract.address, account.address, MAX_U128, []);
          await lendingPool.withSigner(account).tx.repay(wethContract.address, account.address, MAX_U128, []);
        });
        it('Account tries to switch market mode and succeeds as account has enough collateral. Event should be emitted.', async () => {
          const txRes = await lendingPool.withSigner(account).tx.chooseMarketRule(1);
          expect(stringifyNumericProps(txRes.events)).to.deep.equal([
            {
              name: 'MarketRuleChosen',
              args: {
                caller: account.address,
                marketRuleId: '1',
              },
            },
          ]);
          const accountCollateral = (await lendingPool.query.getAccountFreeCollateralCoefficient(account.address)).value.ok!;
          expect(accountCollateral[0]).to.be.equal(true);
        });

        describe(`Account changes market rule to stablecoins only. Then...`, () => {
          beforeEach('changing market rule', async () => {
            await lendingPool.withSigner(account).tx.chooseMarketRule(1);
          });
          it(`After account chooses stablecoin market ParametersAdmin decreases collateralCoefficient of USDC to 0. Account gets undercollateralized`, async () => {
            const txRes = await lendingPool
              .withSigner(parametersAdmin)
              .tx.modifyAssetRule(1, usdcContract.address, { collateralCoefficientE6: 0, borrowCoefficientE6: 1030000, penaltyE6: 15000 });
            expect(stringifyNumericProps(txRes.events)).to.deep.equal([
              {
                name: 'AssetRulesChanged',
                args: {
                  marketRuleId: '1',
                  asset: testEnv.reserves['USDC'].underlying.address,
                  collateralCoefficientE6: '0',
                  borrowCoefficientE6: '1030000',
                  penaltyE6: '15000',
                },
              },
            ]);
            const accountCollateral = (await lendingPool.query.getAccountFreeCollateralCoefficient(account.address)).value.ok!;
            expect(accountCollateral[0]).to.be.equal(false);
          });
          it('Accounts tries to set WETH as collateral and fails with Err(LendingPoolError::RuleCollateralDisable))', async () => {
            const res = (await lendingPool.withSigner(account).query.setAsCollateral(wethContract.address, true)).value.ok;
            expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.RuleCollateralDisable());
          });
          it('Accounts tries to borrow WETH  fails with Err(LendingPoolError::RuleBorrowDisable))', async () => {
            const res = (await lendingPool.withSigner(account).query.borrow(wethContract.address, account.address, wethAccountBalance.divn(4), []))
              .value.ok;
            expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.RuleBorrowDisable());
          });
        });
      });
    });
  });
});
