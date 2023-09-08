import { ChildProcess } from 'child_process';
import { setupDiamondContract } from 'tests/setup/deploymentHelpers';
import LendingPool from 'typechain/contracts/lending_pool';
import LendingPoolManageFacet from 'typechain/contracts/lending_pool_v0_manage_facet';
import { TestEnv } from './scenarios/utils/make-suite';
import { apiProviderWrapper } from './setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';
import { expect } from 'tests/setup/chai';

describe('Diamond Contract', () => {
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

  // eslint-disable-next-line complexity
  it('setupUpgradableContract', async function (this) {
    const SHOW_ERRORS = false;
    const initFacet = 'lending_pool_v0_initialize_facet';
    const functionalFacets = [
      'lending_pool_v0_manage_facet',
      'lending_pool_v0_borrow_facet',
      'lending_pool_v0_deposit_facet',
      'lending_pool_v0_flash_facet',
      'lending_pool_v0_liquidate_facet',
      'lending_pool_v0_maintain_facet',
      'lending_pool_v0_a_token_interface_facet',
      'lending_pool_v0_v_token_interface_facet',
      'lending_pool_v0_view_facet',
    ];
    const lendingPool = await setupDiamondContract(LendingPool, testEnv.owner, testEnv.owner, initFacet, functionalFacets);
    const api = await apiProviderWrapper.getAndWaitForReady();
    const manageFacet = new LendingPoolManageFacet(lendingPool.address, testEnv.owner, api);

    const failedFacets: string[] = [];
    //lending_pool_v0_manage_facet
    try {
      const res = await manageFacet.query.setBlockTimestampProvider(testEnv.blockTimestampProvider.address);
      await manageFacet.tx.setBlockTimestampProvider(testEnv.blockTimestampProvider.address);
      if (res.value.err) failedFacets.push('lending_pool_v0_manage_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_manage_facet');
    }
    //lending_pool_v0_borrow_facet
    try {
      const res = await lendingPool.query.borrow(testEnv.owner.address, testEnv.owner.address, 1, []);
      if (res.value.err) failedFacets.push('lending_pool_v0_borrow_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_borrow_facet');
    }
    //lending_pool_v0_deposit_facet
    try {
      const res = await lendingPool.query.deposit(testEnv.owner.address, testEnv.owner.address, 1, []);
      if (res.value.err) failedFacets.push('lending_pool_v0_deposit_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_deposit_facet');
    }
    //lending_pool_v0_flash_facet //TODO
    // try {
    //   const reserveWETH = testEnv.reserves['WETH'];
    //   const res = await lendingPool.query.flashLoan(testEnv.owner.address, [reserveWETH.underlying.address], [1], []);
    //   if (res.value.err) failedFacets.push('lending_pool_v0_flash_facet');
    // } catch (e) {
    //   if (SHOW_ERRORS) console.log(e);
    //   failedFacets.push('lending_pool_v0_flash_facet');
    // }

    //lending_pool_v0_liquidate_facet
    try {
      const res = await lendingPool.query.liquidate(testEnv.owner.address, testEnv.owner.address, testEnv.owner.address, '0', '0', []);
      if (res.value.err) failedFacets.push('lending_pool_v0_liquidate_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_liquidate_facet');
    }
    //lending_pool_v0_maintain_facet
    try {
      const res = await lendingPool.query.accumulateInterest(testEnv.owner.address);
      if (res.value.err) failedFacets.push('lending_pool_v0_maintain_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_maintain_facet');
    }

    //lending_pool_v0_view_facet
    try {
      const res = await lendingPool.query.viewRegisteredAssets();
      if (res.value.err) failedFacets.push('lending_pool_v0_view_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_view_facet');
    }
    //lending_pool_v0_a_token_interface_facet
    try {
      const res = await lendingPool.query.totalSupplyOf(testEnv.owner.address);
      if (res.value.err) failedFacets.push('lending_pool_v0_a_token_interface_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_a_token_interface_facet');
    }
    //lending_pool_v0_v_token_interface_facet
    try {
      const res = await lendingPool.query.totalVariableDebtOf(testEnv.owner.address);
      if (res.value.err) failedFacets.push('lending_pool_v0_v_token_interface_facet');
    } catch (e) {
      if (SHOW_ERRORS) console.log(e);
      failedFacets.push('lending_pool_v0_v_token_interface_facet');
    }

    expect(
      failedFacets.length,
      `Not all facets loaded succesfully. Facets loaded properly: ${JSON.stringify(
        functionalFacets.filter((f) => !failedFacets.includes(f)),
        null,
        2,
      )}.\n\n Failed facets: ${JSON.stringify(failedFacets, null, 2)} `,
    ).to.eq(0);
  });
});
