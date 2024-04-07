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
import FeeReductionProviderMockDeployer from 'typechain/deployers/fee_reduction_provider_mock';
import { ROLES } from './consts';

makeSuite('Testing protocol income', () => {
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  after(async () => {
    return await apiProviderWrapper.closeApi();
  });
  before(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
  });

  const USDaXRate = 1_000_000;
  const feesD6 = [
    [0, 10_000],
    [10_000, 0],
    [100_000, 100_000],
  ];
  const feesReductions = [
    [0, 500_000],
    [500_000, 0],
    [1_000_000, 1_000_000],
  ];
  for (const feeD6 of feesD6) {
    for (const feeReductionsD6 of feesReductions) {
      describe(` deposit fee is set to ${feeD6[0]}, debt fee is set to ${feeD6[1]}. \n depositFeeReduction is ${feeReductionsD6[0]}, debt fee reduction in ${feeReductionsD6[1]}.\n Depositor deposits 1 million USDC, borrower deposits 2 millions DAI and uses it as collateral. Then ...`, () => {
        let testEnv: TestEnv;
        let depositor: KeyringPair;
        let borrower: KeyringPair;
        let other: KeyringPair;

        let lendingPool: LendingPoolContract;
        let usdcContract: PSP22Emitable;
        let daiContract: PSP22Emitable;
        let usdaxContract: StableToken;
        const millionUsdc: BN = E6bn.mul(bnToBn(100_000_000));
        const millionUsdax: BN = E6bn.mul(bnToBn(1_000_000));
        const millionDai: BN = E6bn.mul(bnToBn(1_000_000));
        let customDeploymentConfig: Partial<DeploymentConfig>;
        const SECONDS1000 = 1000 * 1000;

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
                    depositFeeE6: feeD6[0],
                    debtFeeE6: feeD6[1],
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
                    minimalDebt: '100000',
                  },
                },
                {
                  metadata: {
                    name: 'USDC',
                    symbol: 'USDC',
                    decimals: 8,
                  },
                  fees: {
                    depositFeeE6: feeD6[0],
                    debtFeeE6: feeD6[1],
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
                    maximalTotalDebt: '10000000000000',
                    minimalCollateral: '2000',
                    minimalDebt: '100000',
                  },
                  fees: {
                    depositFeeE6: 0,
                    debtFeeE6: feeD6[1],
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
          depositor = testEnv.accounts[1];
          borrower = testEnv.accounts[2];
          other = testEnv.accounts[3];

          usdcContract = testEnv.reserves['USDC'].underlying;
          daiContract = testEnv.reserves['DAI'].underlying;
          usdaxContract = testEnv.stables['USDax'].underlying;

          await lendingPool.withSigner(getSigners()[0]).tx.setStablecoinDebtRateE18(usdaxContract.address, USDaXRate);

          await usdcContract.tx.mint(depositor.address, millionUsdc);
          await usdcContract.withSigner(depositor).tx.approve(lendingPool.address, millionUsdc);
          await lendingPool.withSigner(depositor).tx.deposit(usdcContract.address, depositor.address, millionUsdc, []);

          await daiContract.tx.mint(depositor.address, millionUsdax);
          await daiContract.withSigner(depositor).tx.approve(lendingPool.address, millionUsdax);
          await lendingPool.withSigner(depositor).tx.deposit(daiContract.address, depositor.address, millionUsdax, []);

          await daiContract.tx.mint(borrower.address, millionDai.muln(2));
          await daiContract.withSigner(borrower).tx.approve(lendingPool.address, millionUsdax.muln(2));
          await lendingPool.withSigner(borrower).tx.deposit(daiContract.address, borrower.address, millionDai.muln(2), []);
          await lendingPool.withSigner(borrower).tx.setAsCollateral(daiContract.address, true);

          const feeReductionProviderMock = (await new FeeReductionProviderMockDeployer(testEnv.api, testEnv.owner).new()).contract;

          await lendingPool.withSigner(testEnv.owner).tx.setFeeReductionProvider(feeReductionProviderMock.address);

          await feeReductionProviderMock.withSigner(testEnv.owner).tx.setFeeReduction(depositor.address, [feeReductionsD6[0], feeReductionsD6[1]]);
          await feeReductionProviderMock.withSigner(testEnv.owner).tx.setFeeReduction(borrower.address, [feeReductionsD6[0], feeReductionsD6[1]]);
        });

        describe('Then borrower borrows 0.68 m USDC and 0.68m USDax', () => {
          const USDC68 = new BN('68000000000000');
          const USDax68 = new BN('680000000000');
          beforeEach('borrow', async () => {
            await lendingPool.withSigner(borrower).tx.borrow(usdcContract.address, borrower.address, USDC68, []);
            await lendingPool.withSigner(borrower).tx.borrow(usdaxContract.address, borrower.address, USDax68, []);
          });

          it('state', async () => {
            const usdcReserveData = (await lendingPool.query.viewReserveData(usdcContract.address)).value.ok!;
            const usdaxReserveData = (await lendingPool.query.viewReserveData(usdaxContract.address)).value.ok!;

            expect(usdcReserveData.currentDebtRateE18.toString()).to.equal('300001');
            expect(usdcReserveData.currentDepositRateE18.toString()).to.equal('204000');
            expect(usdaxReserveData.currentDebtRateE18.toString()).to.equal(USDaXRate.toString());
          });

          describe(' Then 1000 seconds passes and reserves are updated. Then ... ', () => {
            beforeEach('accumulate', async () => {
              await time.increase(SECONDS1000);
              await lendingPool.tx.accumulateInterest(daiContract.address);
              await lendingPool.tx.accumulateInterest(usdcContract.address);
              await lendingPool.tx.accumulateInterest(usdaxContract.address);
            });

            it('ViewProtocolIncome should return 0 for USDC', async () => {
              const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
              expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
              expect.soft(res[0][1].toString()).to.equal('0');
              expect.flushSoft();
            });

            it('ViewProtocolIncome should return 0 for DAI', async () => {
              const res = (await lendingPool.query.viewProtocolIncome([daiContract.address])).value.ok!;
              expect.soft(res[0][0].toString()).to.equal(daiContract.address);
              expect.soft(res[0][1].toString()).to.equal('0');
              expect.flushSoft();
            });

            it('ViewProtocolIncome should return 0 for USDax', async () => {
              const res = (await lendingPool.query.viewProtocolIncome([usdaxContract.address])).value.ok!;
              expect.soft(res[0][0].toString()).to.equal(usdaxContract.address);
              expect.soft(res[0][1].toString()).to.equal('0');
              expect.flushSoft();
            });

            it('ViewProtocolIncome should return [0,0] for [USDC,DAI]', async () => {
              const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, daiContract.address])).value.ok!;
              expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
              expect.soft(res[0][1].toString()).to.equal('0');
              expect.soft(res[1][0].toString()).to.equal(daiContract.address);
              expect.soft(res[1][1].toString()).to.equal('0');
              expect.flushSoft();
            });

            it('ViewProtocolIncome should return [0,0,0] for []', async () => {
              const res = (await lendingPool.query.viewProtocolIncome(null)).value.ok!;
              expect.soft(res[0][0].toString()).to.equal(daiContract.address);
              expect.soft(res[0][1].toString()).to.equal('0');
              expect.soft(res[1][0].toString()).to.equal(usdcContract.address);
              expect.soft(res[1][1].toString()).to.equal('0');
              expect.soft(res[2][0].toString()).to.equal(usdaxContract.address);
              expect.soft(res[2][1].toString()).to.equal('0');
              expect.flushSoft();
            });

            describe('Then borrower repays his debts (with no interest) - so the interests are accumulated and fees should be applied', () => {
              beforeEach('repay', async () => {
                await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, USDC68);
                await usdaxContract.withSigner(borrower).tx.approve(lendingPool.address, USDax68);
                await lendingPool.withSigner(borrower).tx.repay(usdcContract.address, borrower.address, USDC68, []);
                await lendingPool.withSigner(borrower).tx.repay(usdaxContract.address, borrower.address, USDax68, []);
              });

              it('Usdc:  borrower debt interest should accumulate', async () => {
                // the current rate is 300_001
                // 0.68 m * 10 ^ 8  * 300_001 * 1000 * 1000 / 10^18 = 20400068
                const expectedInterestNoFee = new BN('20400068');
                let expectedIncome = expectedInterestNoFee
                  .muln(feeD6[1])
                  .divn(1_000_000)
                  .muln(1_000_000 - feeReductionsD6[1])
                  .divn(1_000_000);
                expectedIncome = expectedIncome.isZero() ? expectedIncome : expectedIncome.addn(1);
                const expectedInterest = expectedInterestNoFee.add(expectedIncome);

                const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
                const reserveData = (await lendingPool.query.viewReserveData(usdcContract.address)).value.ok!;
                const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdcContract.address, borrower.address)).value.ok!;

                expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
                expect(reserveData.totalDebt.toString(), 'totalDebt').to.equal(expectedInterest.toString());
                expect(borrowerReserveData.debt.toString(), 'accountDebt').to.equal(expectedInterest.toString());
              });

              it('USDax: borrower debt interest should accumulate', async () => {
                // the current rate is 1_00_000
                // 0.68 m * 10 ^ 6  * 10^6 * 10^6 / 10^18 = 680000
                const expectedInterestNoFee = new BN('680000');
                const expectedIncome = expectedInterestNoFee
                  .muln(feeD6[1])
                  .divn(1_000_000)
                  .muln(1_000_000 - feeReductionsD6[1])
                  .divn(1_000_000);
                const expectedInterest = expectedInterestNoFee.add(expectedIncome);

                const income = (await lendingPool.query.viewProtocolIncome([usdaxContract.address])).value.ok!;
                const reserveData = (await lendingPool.query.viewReserveData(usdaxContract.address)).value.ok!;
                const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdaxContract.address, borrower.address)).value.ok!;

                expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
                expect(reserveData.totalDebt.toString(), 'totalDebt').to.equal(expectedInterest.toString());
                expect(borrowerReserveData.debt.toString(), 'accountDebt').to.equal(expectedInterest.toString());
              });
            });

            describe('Then depositor withdraws 1 token - so the interest is accumulated and fees should be applied', () => {
              beforeEach('withdraw', async () => {
                await lendingPool.withSigner(depositor).tx.withdraw(usdcContract.address, depositor.address, 1, []);
              });

              it('Usdc:  depositor deposit interest should accumulate', async () => {
                // the current rate is 204000
                // 1m * 10 ^ 8  * 204_000 * 1000 * 1000 / 10^18 = 20400000;
                const expectedInterestWithFee = new BN('20400000');
                const expectedIncome = expectedInterestWithFee
                  .muln(feeD6[0])
                  .divn(1_000_000)
                  .muln(1_000_000 - feeReductionsD6[0])
                  .divn(1_000_000);
                const expectedInterest = expectedInterestWithFee.sub(expectedIncome);

                const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
                const reserveData = (await lendingPool.query.viewReserveData(usdcContract.address)).value.ok!;
                const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdcContract.address, depositor.address)).value.ok!;

                expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
                expect(reserveData.totalDeposit.toString(), 'accountDeposit').to.equal(millionUsdc.subn(1).add(expectedInterest).toString());
                expect(borrowerReserveData.deposit.toString(), 'accountDeposit').to.equal(millionUsdc.subn(1).add(expectedInterest).toString());
              });
            });

            describe('Borrower repays USDC debt (with no interest) and depositor withdraws 1 million USDC', () => {
              beforeEach('repay and withdraw', async () => {
                await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, USDC68);
                await lendingPool.withSigner(borrower).tx.repay(usdcContract.address, borrower.address, USDC68, []);
                await lendingPool.withSigner(depositor).tx.withdraw(usdcContract.address, depositor.address, millionUsdc, []);
              });

              it('Usdc: fees should be applied', async () => {
                const expectedDebtInterestNoFee = new BN('20400068');
                let expectedDebtIncome = expectedDebtInterestNoFee
                  .muln(feeD6[1])
                  .divn(1_000_000)
                  .muln(1_000_000 - feeReductionsD6[1])
                  .divn(1_000_000);
                expectedDebtIncome = expectedDebtInterestNoFee.isZero() ? expectedDebtIncome : expectedDebtIncome.addn(1);

                const expectedDepositInterestWithFee = new BN('20400000');
                const expectedDepositIncome = expectedDepositInterestWithFee
                  .muln(feeD6[0])
                  .divn(1_000_000)
                  .muln(1_000_000 - feeReductionsD6[0])
                  .divn(1_000_000);

                const totalIncome = expectedDepositIncome.add(expectedDebtIncome);

                const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
                expect(income[0][1].toString(), 'income').to.almostEqualOrEqualToInteger(totalIncome.toString());
              });
            });
            describe('Borrower repays USDC ans USDax debt (with no interest) and depositor withdraws 0.5 million USDC', () => {
              beforeEach('repay and withdraw', async () => {
                await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, USDC68);
                await lendingPool.withSigner(borrower).tx.repay(usdcContract.address, borrower.address, USDC68, []);
                await usdaxContract.withSigner(borrower).tx.approve(lendingPool.address, USDax68);
                await lendingPool.withSigner(borrower).tx.repay(usdaxContract.address, borrower.address, USDax68, []);
                await lendingPool.withSigner(depositor).tx.withdraw(usdcContract.address, depositor.address, millionUsdc.divn(2), []);

                await lendingPool.withSigner(testEnv.owner).tx.grantRole(ROLES.TREASURY, testEnv.owner.address);
              });

              it('Taking USDC income should work', async () => {
                const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok![0][1];

                const tx = await lendingPool.withSigner(testEnv.owner).tx.takeProtocolIncome([usdcContract.address], other.address);
                await expect(tx).to.changePSP22Balances(usdcContract, [other.address, lendingPool.address], [income, income.neg()]);
                if (income.gt(new BN(0))) {
                  await expect(tx).to.emitEvent(lendingPool, 'IncomeTaken', { asset: usdcContract.address });
                }
              });

              it(' Taking USDax income should work', async () => {
                const income = (await lendingPool.query.viewProtocolIncome([usdaxContract.address])).value.ok![0][1];

                const tx = await lendingPool.withSigner(testEnv.owner).tx.takeProtocolIncome([usdaxContract.address], other.address);
                await expect(tx).to.changePSP22Balances(usdaxContract, [other.address, lendingPool.address], [income, new BN(0)]);
                if (income.gt(new BN(0))) {
                  await expect(tx).to.emitEvent(lendingPool, 'IncomeTaken', { asset: usdaxContract.address });
                }
              });
            });
          });

          describe('Then borrower repeys his debts (with no interest) - so the interests are accumulated and fees should be applied', () => {
            beforeEach('repay', async () => {
              await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, USDC68);
              await usdaxContract.withSigner(borrower).tx.approve(lendingPool.address, USDax68);
              await lendingPool.withSigner(borrower).tx.repay(usdcContract.address, borrower.address, USDC68, []);
              await lendingPool.withSigner(borrower).tx.repay(usdaxContract.address, borrower.address, USDax68, []);
            });

            it('Usdc:  borrower debt interest should accumulate', async () => {
              // the current rate is 300_001
              // 0.68 m * 10 ^ 8  * 300_001 * 1000 * 1000 / 10^18 = 20400068
              const expectedInterestNoFee = new BN('20400068');
              let expectedIncome = expectedInterestNoFee.muln(feeD6[1]).divn(1_000_000);
              expectedIncome = expectedIncome.isZero() ? expectedIncome : expectedIncome.addn(1);
              const expectedInterest = expectedInterestNoFee.add(expectedIncome);

              const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
              const reserveData = (await lendingPool.query.viewReserveData(usdcContract.address)).value.ok!;
              const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdcContract.address, borrower.address)).value.ok!;

              expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
              expect(reserveData.totalDebt.toString(), 'totalDebt').to.equal(expectedInterest.toString());
              expect(borrowerReserveData.debt.toString(), 'accountDebt').to.equal(expectedInterest.toString());
            });

            it('USDax: borrower debt interest should accumulate', async () => {
              // the current rate is 1_00_000
              // 0.68 m * 10 ^ 6  * 10^6 * 10^6 / 10^18 = 680000
              const expectedInterestNoFee = new BN('680000');
              const expectedIncome = expectedInterestNoFee.muln(feeD6[1]).divn(1_000_000);
              const expectedInterest = expectedInterestNoFee.add(expectedIncome);

              const income = (await lendingPool.query.viewProtocolIncome([usdaxContract.address])).value.ok!;
              const reserveData = (await lendingPool.query.viewReserveData(usdaxContract.address)).value.ok!;
              const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdaxContract.address, borrower.address)).value.ok!;

              expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
              expect(reserveData.totalDebt.toString(), 'totalDebt').to.equal(expectedInterest.toString());
              expect(borrowerReserveData.debt.toString(), 'accountDebt').to.equal(expectedInterest.toString());
            });
          });

          describe('Then depositor withdraws 1 token - so the interest is accumulated and fees should be applied', () => {
            beforeEach('withdraw', async () => {
              await lendingPool.withSigner(depositor).tx.withdraw(usdcContract.address, depositor.address, 1, []);
            });

            it('Usdc:  depositor deposit interest should accumulate', async () => {
              // the current rate is 204000
              // 1m * 10 ^ 8  * 204_000 * 1000 * 1000 / 10^18 = 20400000;
              const expectedInterestWithFee = new BN('20400000');
              const expectedIncome = expectedInterestWithFee.muln(feeD6[0]).divn(1_000_000);
              const expectedInterest = expectedInterestWithFee.sub(expectedIncome);

              const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
              const reserveData = (await lendingPool.query.viewReserveData(usdcContract.address)).value.ok!;
              const borrowerReserveData = (await lendingPool.query.viewAccountReserveData(usdcContract.address, depositor.address)).value.ok!;

              expect(income[0][1].toString(), 'income').to.equal(expectedIncome.toString());
              expect(reserveData.totalDeposit.toString(), 'accountDeposit').to.equal(millionUsdc.subn(1).add(expectedInterest).toString());
              expect(borrowerReserveData.deposit.toString(), 'accountDeposit').to.equal(millionUsdc.subn(1).add(expectedInterest).toString());
            });
          });

          describe('Borrower repays USDC debt (with no interest) and depositor withdraws 1 million USDC', () => {
            beforeEach('repay and withdraw', async () => {
              await usdcContract.withSigner(borrower).tx.approve(lendingPool.address, USDC68);
              await lendingPool.withSigner(borrower).tx.repay(usdcContract.address, borrower.address, USDC68, []);
              await lendingPool.withSigner(depositor).tx.withdraw(usdcContract.address, depositor.address, millionUsdc, []);
            });

            it('Usdc: fees should be applied', async () => {
              const expectedDebtInterestNoFee = new BN('20400068');
              let expectedDebtIncome = expectedDebtInterestNoFee.muln(feeD6[1]).divn(1_000_000);
              expectedDebtIncome = expectedDebtInterestNoFee.isZero() ? expectedDebtIncome : expectedDebtIncome.addn(1);

              const expectedInterestWithFee = new BN('20400000');
              const expectedIncome = expectedInterestWithFee.muln(feeD6[0]).divn(1_000_000);

              const totalIncome = expectedIncome.add(expectedDebtIncome);

              const income = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value.ok!;
              expect(income[0][1].toString(), 'income').to.almostEqualOrEqualToInteger(totalIncome.toString());
            });
          });
        });
      });
    }
  }
});

//TODO, check if the income is calculated correctly
//TODO, check if reduction fee works
