import { BN } from 'bn.js';
import { ChildProcess } from 'child_process';
import { deployAndConfigureSystem, deployDiamond, setupUpgradableContract } from 'tests/setup/deploymentHelpers';
import { getUserReserveDataWithTimestamp, getTxTimestamp } from './scenarios/utils/actions';
import { calcExpectedReserveDataAfterDeposit, calcExpectedUserDataAfterDeposit } from './scenarios/utils/calculations';
import { TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { apiProviderWrapper } from './setup/helpers';
import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';
import LendingPool from 'typechain/contracts/lending_pool';

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
    // testEnv = await deployAndConfigureSystem();
    testEnv = await readContractsFromFile();
  });

  it('setupUpgradableContract', async () => {
    const lendingPool = await setupUpgradableContract(LendingPool, testEnv.owner, testEnv.owner, 'lending_pool_v0_initialize_facet', [
      'lending_pool_v0_borrow_facet',
      'lending_pool_v0_deposit_facet',
      'lending_pool_v0_flash_facet',
      'lending_pool_v0_liquidate_facet',
      'lending_pool_v0_maintain_facet',
      'lending_pool_v0_a_token_interface_facet',
      'lending_pool_v0_v_token_interface_facet',
      'lending_pool_v0_s_token_interface_facet',
      'lending_pool_v0_manage_facet',
      'lending_pool_v0_view_facet',
    ]);
    const reserve = testEnv.reserves['DAI'];

    await lendingPool.tx.setBlockTimestampProvider(testEnv.blockTimestampProvider.address);
    await lendingPool.query.registerAsset(
      reserve.underlying.address,
      1000,
      null,
      null,
      100000,
      12,
      18,
      123,
      reserve.aToken.address,
      reserve.vToken.address,
      reserve.sToken.address,
    );
    await lendingPool.tx.registerAsset(
      reserve.underlying.address,
      1000,
      null,
      null,
      100000,
      12,
      18,
      123,
      reserve.aToken.address,
      reserve.vToken.address,
      reserve.sToken.address,
    );
    await lendingPool.query.insertReserveTokenPriceE8(reserve.underlying.address, '123456789');
    await lendingPool.tx.insertReserveTokenPriceE8(reserve.underlying.address, '123456789');
  });
});
