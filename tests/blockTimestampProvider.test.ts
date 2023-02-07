import { ChildProcess } from 'child_process';
import BlockTimestampProvider from '../typechain/contracts/block_timestamp_provider';
import { expect } from './setup/chai';
import { deployBlockTimestampProvider } from './setup/deploymentHelpers';
import { restartAndRestoreNodeState } from './setup/nodePersistence';
import { apiProviderWrapper, getSigners } from './setup/helpers';
import { makeSuite } from './scenarios/utils/make-suite';

makeSuite('BlockTimestampProvider', () => {
  let timestampProvider: BlockTimestampProvider;
  let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
  beforeEach(async () => {
    getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
    await apiProviderWrapper.getAndWaitForReady();
    const [owner] = await getSigners();
    timestampProvider = await deployBlockTimestampProvider(owner);
  });

  it('Given should return mock value is set to true should return mock timestamp value', async () => {
    await timestampProvider.tx.setShouldReturnMockValue(true);
    await timestampProvider.tx.setBlockTimestamp(123);
    const { value } = await timestampProvider.query.getBlockTimestamp();
    const timestamp = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
    expect(value).to.equal(123);
    expect(value).not.to.equal(timestamp);
  });

  it('Given should return mock value is set to false should return block timestamp', async () => {
    await timestampProvider.tx.setShouldReturnMockValue(false);
    await timestampProvider.tx.setBlockTimestamp(123);
    const timestamp = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
    const { value } = await timestampProvider.query.getBlockTimestamp();
    expect(value.toString()).to.equal(timestamp.toString());
  });
});
