import { ChildProcess } from 'child_process';
import { deployLendingPool, setupDiamondContract } from 'tests/setup/deploymentHelpers';
import LendingPool from 'typechain/contracts/lending_pool';
import LendingPoolManageFacet from 'typechain/contracts/lending_pool_v0_manage_facet';
import { TestEnv } from './scenarios/utils/make-suite';
import { apiProviderWrapper } from './setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';

// skip for now as we dont use diamond in ink4 yet
describe.skip('Diamond Contract', () => {
  let testEnv: TestEnv;
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  afterEach(async () => {
    await apiProviderWrapper.closeApi();
    getContractsNodeProcess()?.kill();
  });
  beforeEach(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
    testEnv = await readContractsFromFile();
  });

  it('setupUpgradableContract', async () => {
    // const lendingPool = await deployLendingPool(testEnv.owner);
    const lendingPool = await setupDiamondContract(LendingPool, testEnv.owner, testEnv.owner, 'lending_pool_v0_initialize_facet', [
      'lending_pool_v0_borrow_facet',
      'lending_pool_v0_deposit_facet',
      'lending_pool_v0_flash_facet',
      'lending_pool_v0_liquidate_facet',
      'lending_pool_v0_maintain_facet',
      'lending_pool_v0_a_token_interface_facet',
      'lending_pool_v0_v_token_interface_facet',
      'lending_pool_v0_view_facet',
      'lending_pool_v0_manage_facet',
    ]);
    const reserve = testEnv.reserves['DAI'];
    const api = await apiProviderWrapper.getAndWaitForReady();
    const manageFacet = new LendingPoolManageFacet(lendingPool.address, testEnv.owner, api);
    try {
      const res1 = await lendingPool.query.borrow(testEnv.owner.address, testEnv.owner.address, 1, []);
      console.log({ res1 });
    } catch (e) {
      if (e === 1) console.log(e);
    }
    try {
      const res2 = await lendingPool.query.flashLoan(testEnv.owner.address, [], [], []);
      console.log({ res2 });
    } catch (e) {
      if (e === 1) console.log(e);
    }
    try {
      const res3 = await lendingPool.query.accumulateInterest(testEnv.owner.address);
      console.log({ res3 });
    } catch (e) {
      if (e === 1) console.log(e);
    }
    try {
      const res4 = await lendingPool.query.viewRegisteredAssets();
      console.log({ res4 });
    } catch (e) {
      if (e === 1) console.log(e);
    }
    const res = await lendingPool.query.setBlockTimestampProvider(testEnv.blockTimestampProvider.address);
    await manageFacet.tx.setBlockTimestampProvider(testEnv.blockTimestampProvider.address);
    await manageFacet.query.registerAsset(
      reserve.underlying.address,
      1000,
      null,
      null,
      100000,
      null,
      0,
      0,
      12,
      18,
      123,
      reserve.aToken.address,
      reserve.vToken.address,
    );
    await manageFacet.tx.registerAsset(
      reserve.underlying.address,
      1000,
      null,
      null,
      100000,
      null,
      0,
      0,
      12,
      18,
      123,
      reserve.aToken.address,
      reserve.vToken.address,
    );
    await lendingPool.query.insertReserveTokenPriceE8(reserve.underlying.address, '123456789');
    await lendingPool.tx.insertReserveTokenPriceE8(reserve.underlying.address, '123456789');
  });
});
