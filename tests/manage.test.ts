import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';

export const FLASH_BORROWER = 1112475474;
export const ASSET_LISTING_ADMIN = 1094072439;
export const PARAMETERS_ADMIN = 368001360;
export const EMERGENCY_ADMIN = 297099943;
export const GLOBAL_ADMIN = 2459877095;
export const ROLE_ADMIN = 0;
export const TREASURY = 2434241257;

makeSuite('Access Control tests', (getTestEnv) => {
  let testEnv: TestEnv;
  let users: KeyringPair[];
  let owner: KeyringPair;
  let flashBorrower: KeyringPair;
  let assetListingAdmin: KeyringPair;
  let parametersAdmin: KeyringPair;
  let emergancyAdmin: KeyringPair;
  let globalAdmin: KeyringPair;
  let roleAdmin: KeyringPair;
  let treasury: KeyringPair;
  let lendingPool: LendingPoolContract;
  beforeEach('grant roles', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    owner = testEnv.owner;
    users = testEnv.users;
    flashBorrower = users[0];
    assetListingAdmin = users[1];
    parametersAdmin = users[2];
    emergancyAdmin = users[3];
    globalAdmin = users[4];
    roleAdmin = users[5];
    treasury = users[6];

    await lendingPool.withSigner(owner).tx.grantRole(FLASH_BORROWER, flashBorrower.address);
    await lendingPool.withSigner(owner).tx.grantRole(ASSET_LISTING_ADMIN, assetListingAdmin.address);
    await lendingPool.withSigner(owner).tx.grantRole(PARAMETERS_ADMIN, parametersAdmin.address);
    await lendingPool.withSigner(owner).tx.grantRole(EMERGENCY_ADMIN, emergancyAdmin.address);
    await lendingPool.withSigner(owner).tx.grantRole(GLOBAL_ADMIN, globalAdmin.address);
    await lendingPool.withSigner(owner).tx.grantRole(ROLE_ADMIN, roleAdmin.address);
    await lendingPool.withSigner(owner).tx.grantRole(TREASURY, treasury.address);
  });

  // assetListingAdmin, globalAdmin are allowed to
  describe('Register aasset', () => {
    let asset;
    let aToken;
    let vToken;
    let sToken;
    beforeEach('names', async () => {
      asset = '';
      aToken = '';
      vToken = '';
      sToken = '';
    });

    it('flashLoanBorrower should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(flashBorrower)
          .query.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should succeed', async () => {
      const tx = lendingPool
        .withSigner(assetListingAdmin)
        .tx.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
    it('parametersAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(parametersAdmin)
          .query.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(emergancyAdmin)
          .query.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed', async () => {
      const tx = lendingPool
        .withSigner(globalAdmin)
        .tx.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(roleAdmin)
          .query.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(treasury)
          .query.registerAsset(asset, '100000', null, null, null, 0, 0, 0, '1000000', '1000', aToken, vToken, sToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('set reserve is active with...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(flashBorrower).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(assetListingAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succeed', async () => {
      const res = (await lendingPool.withSigner(parametersAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      await expect(lendingPool.withSigner(emergancyAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).to.eventually
        .be.fulfilled;
    });
    it('globalAdmin should succeed', async () => {
      const tx = lendingPool.withSigner(globalAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(roleAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(treasury).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });

  // emergencyAdmin, globalAdmin are allowed to
  describe('set reserve is freezed with...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(flashBorrower).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(assetListingAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(parametersAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should return Ok()', async () => {
      const tx = lendingPool.withSigner(emergancyAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
    it('globalAdmin should succeed', async () => {
      const tx = lendingPool.withSigner(globalAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(roleAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(treasury).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('set reserve parameters with...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(flashBorrower)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(assetListingAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed', async () => {
      await expect(
        lendingPool
          .withSigner(parametersAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0),
      ).to.eventually.be.fulfilled;
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(emergancyAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed', async () => {
      await expect(
        lendingPool
          .withSigner(globalAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0),
      ).to.eventually.be.fulfilled;
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(roleAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(treasury)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], null, null, null, 0, 0, 0, 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });

  // treasury is allowed
  describe('take protocol income with...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(flashBorrower).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(assetListingAdmin).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(parametersAdmin).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(emergancyAdmin).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(globalAdmin).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const queryResult = (await lendingPool.withSigner(roleAdmin).query.takeProtocolIncome(null, '')).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should succed', async () => {
      const tx = lendingPool.withSigner(treasury).tx.takeProtocolIncome(null, '');
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
    });
  });
});
