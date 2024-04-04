import { ChildProcess } from 'child_process';
import { deployAndConfigureSystem, DeploymentConfig } from 'tests/setup/deploymentHelpers';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './setup/helpers';
import { restartAndRestoreNodeState } from './setup/nodePersistence';
import PSP22Emitable from 'typechain/contracts/psp22_emitable';
import StableToken from 'typechain/contracts/stable_token';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { KeyringPair } from '@polkadot/keyring/types';
import BN from 'bn.js';
import { DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING, E6 } from './setup/tokensToDeployForTesting';
import { E18bn, E6bn, time } from '@c-forge/polkahat-network-helpers';
import { bnToBn } from '@polkadot/util';

makeSuite.skip('Testing protocol income', () => {
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  after(async () => {
    return await apiProviderWrapper.closeApi();
  });
  before(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
  });

  const feesD6 = [10_000, 100_000];
  for (const feeD6 of feesD6) {
    describe(` fee is set to ${feeD6}, 1 milion of DAI and USDC are supplied by account1 and account2. Then ...`, () => {
      let testEnv: TestEnv;
      let account1: KeyringPair;
      let account2: KeyringPair;
      let lendingPool: LendingPoolContract;
      let usdcContract: PSP22Emitable;
      let daiContract: PSP22Emitable;
      let usdaxContract: StableToken;
      const millionUsda: BN = E6bn.mul(bnToBn(1_000_000));
      const millionUsdc: BN = E6bn.mul(bnToBn(100_000_000));
      const millionUsdax: BN = E6bn.mul(bnToBn(1_000_000));
      let customDeploymentConfig: Partial<DeploymentConfig>;
      const MIN100 = 10000 * 1000;

      beforeEach('setup Env', async () => {
        customDeploymentConfig = {
          testTokensToDeploy: {
            reserveTokens: [
              {
                metadata: {
                  name: 'DAI',
                  symbol: 'DAI',
                  decimals: 6,
                },

                fees: {
                  depositFeeE6: feeD6,
                  debtFeeE6: feeD6,
                },
                interestRateModelE18: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,

                defaultRule: {
                  collateralCoefficientE6: 0.97 * E6,
                  borrowCoefficientE6: 1.03 * E6,
                  penaltyE6: 0.015 * E6,
                },
                restrictions: {
                  maximalTotalDeposit: null,
                  maximalTotalDebt: null,
                  minimalCollateral: '2000000',
                  minimalDebt: '1000000',
                },
              },
              {
                metadata: {
                  name: 'USDC',
                  symbol: 'USDC',
                  decimals: 8,
                },
                fees: {
                  depositFeeE6: feeD6,
                  debtFeeE6: feeD6,
                },
                interestRateModelE18: DEFAULT_INTEREST_RATE_MODEL_FOR_TESTING,
                defaultRule: {
                  collateralCoefficientE6: 0.98 * E6,
                  borrowCoefficientE6: 1.02 * E6,
                  penaltyE6: 0.01 * E6,
                },
                restrictions: {
                  maximalTotalDeposit: null,
                  maximalTotalDebt: null,
                  minimalCollateral: '2000',
                  minimalDebt: '1000',
                },
              },
            ],
            stableTokens: [
              {
                metadata: {
                  name: 'USDax',
                  symbol: 'USDax',
                  decimals: 6,
                },
                defaultRule: {
                  collateralCoefficientE6: null,
                  borrowCoefficientE6: 1.1 * E6,
                  penaltyE6: 0.05 * E6,
                },
                restrictions: {
                  maximalTotalDeposit: '0',
                  maximalTotalDebt: '1000000000000',
                  minimalCollateral: '2000',
                  minimalDebt: '1000000',
                },
                fees: {
                  depositFeeE6: 0,
                  debtFeeE6: feeD6,
                },
                debtRate: '350000',
              },
            ],
          },
          priceOverridesE18: { USDC: E18bn.toString(), DAI: E18bn.toString() },
          owner: getSigners()[0],
          accounts: getSignersWithoutOwner(getSigners(), 0),
        };

        testEnv = await deployAndConfigureSystem(customDeploymentConfig);

        lendingPool = testEnv.lendingPool;
        account1 = testEnv.accounts[0];
        account2 = testEnv.accounts[1];
        usdcContract = testEnv.reserves['USDC'].underlying;
        daiContract = testEnv.reserves['DAI'].underlying;
        usdaxContract = testEnv.stables['USDax'].underlying;

        await usdcContract.tx.mint(account1.address, millionUsdc);
        await usdcContract.withSigner(account1).tx.approve(lendingPool.address, millionUsdc);
        await lendingPool.withSigner(account1).tx.deposit(usdcContract.address, account1.address, millionUsdc, []);

        await daiContract.tx.mint(account1.address, millionUsda);
        await daiContract.withSigner(account1).tx.approve(lendingPool.address, millionUsda);
        await lendingPool.withSigner(account1).tx.deposit(daiContract.address, account1.address, millionUsda, []);

        await usdcContract.tx.mint(account2.address, millionUsdc);
        await usdcContract.withSigner(account2).tx.approve(lendingPool.address, millionUsdc);
        await lendingPool.withSigner(account2).tx.deposit(usdcContract.address, account1.address, millionUsdc, []);

        await daiContract.tx.mint(account2.address, millionUsda);
        await daiContract.withSigner(account2).tx.approve(lendingPool.address, millionUsda);
        await lendingPool.withSigner(account2).tx.deposit(daiContract.address, account1.address, millionUsda, []);
      });
      describe('Then Account1 and Account2 set USDC an DAI as collateral and borrows.\n Account1 Borrows 1 million USDC, Account2 Borrows 1 million USDax', () => {
        beforeEach('', async () => {
          await lendingPool.withSigner(account1).tx.setAsCollateral(usdcContract.address, true);
          await lendingPool.withSigner(account1).tx.borrow(usdcContract.address, account1.address, millionUsdc, [0]);
          await lendingPool.withSigner(account2).tx.setAsCollateral(usdcContract.address, true);
          await lendingPool.withSigner(account2).tx.borrow(usdaxContract.address, account2.address, millionUsdax, [0]);
        });

        describe(' Then 10000 seconds passes and reserves are updated. Then ... ', () => {
          beforeEach('', async () => {
            await time.increase(MIN100);
            await lendingPool.tx.accumulateInterest(daiContract.address);
            await lendingPool.tx.accumulateInterest(usdcContract.address);
            await lendingPool.tx.accumulateInterest(usdaxContract.address);
          });

          it('ViewProtocolIncome should return 0 for USDC', async () => {
            const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value;
            expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
            expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
            expect.flushSoft();
          });

          it('ViewProtocolIncome should return 0 for DAI', async () => {
            const res = (await lendingPool.query.viewProtocolIncome([daiContract.address])).value;
            expect.soft(res[0][0].toString()).to.equal(daiContract.address);
            expect.soft(res[0][1].toString()).to.equal(new BN('0').toString());
            expect.flushSoft();
          });

          it('ViewProtocolIncome should return 0 for USDax', async () => {
            const res = (await lendingPool.query.viewProtocolIncome([usdaxContract.address])).value;
            expect.soft(res[0][0].toString()).to.equal(usdaxContract.address);
            expect.soft(res[0][1].toString()).to.equal(new BN('0').toString());
            expect.flushSoft();
          });

          it('ViewProtocolIncome should return [0,0] for [USDC,DAI]', async () => {
            const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, daiContract.address])).value;
            expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
            expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
            expect.soft(res[1][0].toString()).to.equal(daiContract.address);
            expect.soft(res[1][1].toString()).to.equal(new BN('0').toString());
            expect.flushSoft();
          });

          it('ViewProtocolIncome should return [0,0,0] for []', async () => {
            const res = (await lendingPool.query.viewProtocolIncome(null)).value;
            expect.soft(res[0][0].toString()).to.equal(daiContract.address);
            expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
            expect.soft(res[1][0].toString()).to.equal(usdcContract.address);
            expect.soft(res[1][1].toString()).to.equal(new BN('0').toString());
            expect.soft(res[2][0].toString()).to.equal(usdaxContract.address);
            expect.soft(res[2][1].toString()).to.equal(new BN('0').toString());
            expect.flushSoft();
          });
        });
      });
    });
  }

  //TODO, check if the income is calculated correctly
  //TODO, check if reduction fee works
});
