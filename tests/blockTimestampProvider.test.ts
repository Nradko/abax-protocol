import BlockTimestampProvider from '../typechain/contracts/block_timestamp_provider';
import { expect } from './setup/chai';
import { deployBlockTimestampProvider } from './setup/deploymentHelpers';
import { apiProviderWrapper, getSigners } from './setup/helpers';
import { makeSuite } from './scenarios/utils/make-suite';

makeSuite('BlockTimestampProvider', () => {
  let timestampProvider: BlockTimestampProvider;
  beforeEach(async () => {
    await apiProviderWrapper.getAndWaitForReady();
    const [owner] = getSigners();
    timestampProvider = await deployBlockTimestampProvider(owner);
  });

  it('If mock value is set to true should return mock timestamp value', async () => {
    await timestampProvider.tx.setShouldReturnMockValue(true);
    await timestampProvider.tx.setBlockTimestamp(123);
    const value = (await timestampProvider.query.getBlockTimestamp()).value.ok;
    const timestamp = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
    expect(value).to.equal(123);
    expect(value).not.to.equal(timestamp);
  });

  it('If mock value is set to false should return block timestamp', async () => {
    await timestampProvider.tx.setShouldReturnMockValue(false);
    await timestampProvider.tx.setBlockTimestamp(123);
    const timestamp = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
    const value = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
    expect(value.toString()).to.equal(timestamp.toString());
  });
  describe('Speed multiplier is set to 120', () => {
    const AVG_MS_PER_BLOCK = 20;
    beforeEach(async () => {
      await timestampProvider.tx.setShouldReturnMockValue(false);
      await timestampProvider.tx.setSpeedMultiplier(120);
    });

    it('Speed multiplier is correctly set', async () => {
      const value = (await timestampProvider.query.getSpeedMultiplier()).value.ok!;
      expect(value).to.equal(120);
    });
    it('Speed multiplier 1 works', async function (this) {
      const AVG_EPS_PER_BLOCK = 20;
      await timestampProvider.tx.setSpeedMultiplier(1);
      const apiTimestamp1 = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
      const value1 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      await timestampProvider.tx.setShouldReturnMockValue(false); //dummy action to produce new block
      const apiTimestamp2 = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
      const value2 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      await timestampProvider.tx.setShouldReturnMockValue(false); //dummy action to produce new block
      const apiTimestamp3 = await (await apiProviderWrapper.getAndWaitForReady()).query.timestamp.now();
      const value3 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      expect(value1.toString()).to.equal(apiTimestamp1.toString());
      expect(value2.toString()).to.equal(apiTimestamp2.toString());
      expect(value3.toString()).to.equal(apiTimestamp3.toString());
    });
    it('Speed multiplier 120 works', async function (this) {
      const AVG_EPS_PER_BLOCK = 20 * 60;
      const value1 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      await timestampProvider.tx.setShouldReturnMockValue(false); //dummy action to produce new block
      const value2 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      await timestampProvider.tx.setShouldReturnMockValue(false); //dummy action to produce new block
      const value3 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      await timestampProvider.tx.setShouldReturnMockValue(false); //dummy action to produce new block
      const value4 = (await timestampProvider.query.getBlockTimestamp()).value.ok!;
      expect(value2 - value1).to.be.almostEqualOrEqualNumber(AVG_MS_PER_BLOCK * 120, AVG_EPS_PER_BLOCK);
      expect(value3 - value2).to.be.almostEqualOrEqualNumber(AVG_MS_PER_BLOCK * 120, AVG_EPS_PER_BLOCK);
      expect(value4 - value3).to.be.almostEqualOrEqualNumber(AVG_MS_PER_BLOCK * 120, AVG_EPS_PER_BLOCK);
    });
  });
});
