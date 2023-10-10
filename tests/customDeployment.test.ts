import { ChildProcess } from 'child_process';
import { deployAndConfigureSystem, DeploymentConfig } from 'tests/setup/deploymentHelpers';
import { TestEnv } from './scenarios/utils/make-suite';
import { E6 } from '@abaxfinance/utils';
import { expect } from './setup/chai';
import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './setup/helpers';
import { restartAndRestoreNodeState } from './setup/nodePersistence';

describe('Custom deployment', () => {
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  after(async () => {
    return await apiProviderWrapper.closeApi();
  });
  before(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
  });

  describe('Completely new custom deployment', async () => {
    let testEnv: TestEnv;
    before(async () => {
      const signers = getSigners();
      //Arrange
      const customDeploymentConfig: Partial<DeploymentConfig> = {
        testReserveTokensToDeploy: [
          {
            decimals: 7,
            feeD6: 100,
            name: 'BOI',
            stableBaseRate: 100,
            collateralCoefficient: 0.9,
            maximalTotalDeposit: null,
            maximalTotalDebt: null,
            borrowCoefficient: 1.1,
            minimalCollateral: 0,
            minimalDebt: 0,
            penalty: 0.05,
          },
          {
            decimals: 9,
            feeD6: 200,
            name: 'WMN',
            stableBaseRate: 200,
            collateralCoefficient: 0.9,
            maximalTotalDeposit: null,
            maximalTotalDebt: null,
            borrowCoefficient: 1.1,
            minimalCollateral: 0,
            minimalDebt: 0,
            penalty: 0.05,
          },
        ],
        priceOverridesE8: { BOI: 500 * E6, WMN: 0.5 * E6 },
        shouldUseMockTimestamp: false,
        users: getSignersWithoutOwner(signers, 5),
        owner: signers[5],
      };
      testEnv = await deployAndConfigureSystem(customDeploymentConfig);
    });
    it('BlockTimestampProvider does not use mocked timestamp', async () => {
      const queryRes = (await testEnv.blockTimestampProvider.query.getShouldReturnMockValue()).value.ok;
      expect(queryRes).to.be.equal(false);
    });
    it('Contains deployed reserves', async () => {
      const reserveBOI = (await testEnv.lendingPool.query.viewUnupdatedReserveData(testEnv.reserves['BOI'].underlying.address)).value.ok;
      const aTokensBOI = (await testEnv.lendingPool.query.viewReserveTokens(testEnv.reserves['BOI'].underlying.address)).value.ok;

      expect.soft(reserveBOI).to.be.not.null;
      expect.soft(aTokensBOI?.aTokenAddress).to.be.ok;
      expect.flushSoft();
    });
  });

  describe('Partial overrides', () => {
    it('Price override', async () => {
      const priceToOverride = 50 * E6;
      const reserveSymbol = 'WETH';
      //Arrange
      const customDeploymentConfig: Partial<DeploymentConfig> = {
        priceOverridesE8: { [reserveSymbol]: priceToOverride },
      };
      const testEnv = await deployAndConfigureSystem(customDeploymentConfig);

      const price = (await testEnv.lendingPool.query.getReserveTokenPriceE8(testEnv.reserves['WETH'].underlying.address)).value.ok!;
      expect(price.toString()).to.equal(priceToOverride.toString());
    });
  });
});
