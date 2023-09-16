import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';
import { ReturnNumber } from '@727-ventures/typechain-types';
import { ASSET_LISTING_ADMIN, EMERGENCY_ADMIN, FLASH_BORROWER, GLOBAL_ADMIN, PARAMETERS_ADMIN, ROLE_ADMIN, TREASURY } from './consts';

makeSuite('Menage tests', (getTestEnv) => {
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
    beforeEach('names', async () => {
      asset = '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy';
      aToken = '5HA6b9t4DnVD7vmSX6fpU6W6qxc1pS9wKnV1Ee57fQAbNx3H';
      vToken = '5G4bxHzTmuNtuYUYhwCEyKui83mvW4kooK6RR8Rh1wJGhHce';
    });

    it('flashLoanBorrower should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(flashBorrower)
          .query.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [0, 0, 0, 0, 0, 0, 0], aToken, vToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should succeed and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(assetListingAdmin)
        .tx.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [1, 2, 3, 4, 5, 6, 7], aToken, vToken);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRegistered',
          args: {
            asset: asset,
            decimals: new ReturnNumber(100000),
            aTokenAddress: aToken,
            vTokenAddress: vToken,
          },
        },
        {
          name: 'ParametersChanged',
          args: {
            asset: asset,
            interestRateModel: [
              new ReturnNumber(1),
              new ReturnNumber(2),
              new ReturnNumber(3),
              new ReturnNumber(4),
              new ReturnNumber(5),
              new ReturnNumber(6),
              new ReturnNumber(7),
            ],
            incomeForSuppliersPartE6: new ReturnNumber(1000000),
            flashLoanFeeE6: new ReturnNumber(1000),
          },
        },
        {
          name: 'RestrictionsChanged',
          args: {
            asset: asset,
            maximalTotalSupply: null,
            maximalTotalDebt: null,
            minimalCollateral: new ReturnNumber(0),
            minimalDebt: new ReturnNumber(0),
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 0,
            asset: asset,
            collateralCoefficientE6: null,
            borrowCoefficientE6: null,
            penaltyE6: null,
          },
        },
      ]);
    });
    it('parametersAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(parametersAdmin)
          .query.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [0, 0, 0, 0, 0, 0, 0], aToken, vToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(emergancyAdmin)
          .query.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [0, 0, 0, 0, 0, 0, 0], aToken, vToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(globalAdmin)
        .tx.registerAsset(
          asset,
          '1',
          900000,
          1100000,
          50000,
          4000000000,
          2000000000,
          3000000,
          1000000,
          '900000',
          '10000',
          [1, 2, 3, 4, 5, 6, 7],
          aToken,
          vToken,
        );
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRegistered',
          args: {
            asset: asset,
            decimals: new ReturnNumber(1),
            aTokenAddress: aToken,
            vTokenAddress: vToken,
          },
        },
        {
          name: 'ParametersChanged',
          args: {
            asset: asset,
            interestRateModel: [
              new ReturnNumber(1),
              new ReturnNumber(2),
              new ReturnNumber(3),
              new ReturnNumber(4),
              new ReturnNumber(5),
              new ReturnNumber(6),
              new ReturnNumber(7),
            ],
            incomeForSuppliersPartE6: new ReturnNumber(900000),
            flashLoanFeeE6: new ReturnNumber(10000),
          },
        },
        {
          name: 'RestrictionsChanged',
          args: {
            asset: asset,
            maximalTotalSupply: 4000000000,
            maximalTotalDebt: 2000000000,
            minimalCollateral: new ReturnNumber(3000000),
            minimalDebt: new ReturnNumber(1000000),
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 0,
            asset: asset,
            collateralCoefficientE6: 900000,
            borrowCoefficientE6: 1100000,
            penaltyE6: 50000,
          },
        },
      ]);
    });

    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(roleAdmin)
          .query.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [0, 0, 0, 0, 0, 0, 0], aToken, vToken)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(treasury)
          .query.registerAsset(asset, '100000', null, null, null, null, null, 0, 0, '1000000', '1000', [0, 0, 0, 0, 0, 0, 0], aToken, vToken)
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
    it('parametersAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(parametersAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergancyAdmin should succed to disactivate reserve and event should be emitted', async () => {
      const tx = lendingPool.withSigner(emergancyAdmin).tx.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ReserveActivated',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            active: false,
          },
        },
      ]);
    });
    it('emergancyAdmin should fail to activate alread activated reserve with LendingPoolError::AlreadySet', async () => {
      const queryRes = (await lendingPool.withSigner(emergancyAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, true)).value
        .ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
    });

    it('globalAdmin should succeed to disactivate reserve and event should be emitted', async () => {
      const tx = lendingPool.withSigner(globalAdmin).tx.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, false);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ReserveActivated',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            active: false,
          },
        },
      ]);
    });
    it('globalAdmin should fail to activate already activated reserve with LendingPoolError::AlreadySet', async () => {
      const queryRes = (await lendingPool.withSigner(globalAdmin).query.setReserveIsActive(testEnv.reserves['DAI'].underlying.address, true)).value
        .ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
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
    it('emergancyAdmin should succed to freeze unfreezed reserve and event should be emitted', async () => {
      const tx = lendingPool.withSigner(emergancyAdmin).tx.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, true);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ReserveFreezed',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            freezed: true,
          },
        },
      ]);
    });
    it('emergancyAdmin should fail to unfreeze unfreezed reserrve with LendingPoolError::AlreadySet', async () => {
      const queryRes = (await lendingPool.withSigner(emergancyAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false))
        .value.ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
    });
    it('globalAdmin should succeed to freeze unfreezed reserve and event should be emitted', async () => {
      const tx = lendingPool.withSigner(globalAdmin).tx.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, true);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ReserveFreezed',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            freezed: true,
          },
        },
      ]);
    });
    it('globalAdmin should fail to unfreeze unfreezed reserrve with LendingPoolError::AlreadySet', async () => {
      const queryRes = (await lendingPool.withSigner(globalAdmin).query.setReserveIsFreezed(testEnv.reserves['DAI'].underlying.address, false)).value
        .ok;
      expect(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
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
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(assetListingAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(parametersAdmin)
        .tx.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 10, 20);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ParametersChanged',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            interestRateModel: [
              new ReturnNumber(1),
              new ReturnNumber(2),
              new ReturnNumber(3),
              new ReturnNumber(4),
              new ReturnNumber(5),
              new ReturnNumber(6),
              new ReturnNumber(7),
            ],
            incomeForSuppliersPartE6: new ReturnNumber(10),
            flashLoanFeeE6: new ReturnNumber(20),
          },
        },
      ]);
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(emergancyAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(globalAdmin)
        .tx.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 10, 20);
      expect(tx).to.eventually.be.fulfilled;
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'ParametersChanged',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            interestRateModel: [
              new ReturnNumber(1),
              new ReturnNumber(2),
              new ReturnNumber(3),
              new ReturnNumber(4),
              new ReturnNumber(5),
              new ReturnNumber(6),
              new ReturnNumber(7),
            ],
            incomeForSuppliersPartE6: new ReturnNumber(10),
            flashLoanFeeE6: new ReturnNumber(20),
          },
        },
      ]);
    });

    it('roleAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(roleAdmin).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(treasury).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0, 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });
  ////aaa
  // parametersAdmin, globalAdmin are allowed to
  describe('set reserve restrictions with...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(flashBorrower).query.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(flashBorrower).query.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed and event should be emitted', async () => {
      const tx = lendingPool.withSigner(parametersAdmin).tx.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'RestrictionsChanged',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            maximalTotalSupply: 1,
            maximalTotalDebt: 2,
            minimalCollateral: new ReturnNumber(3),
            minimalDebt: new ReturnNumber(4),
          },
        },
      ]);
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(emergancyAdmin).query.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed and event should be emitted', async () => {
      const tx = lendingPool.withSigner(globalAdmin).tx.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4);
      expect(tx).to.eventually.be.fulfilled;
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'RestrictionsChanged',
          args: {
            asset: testEnv.reserves['DAI'].underlying.address,
            maximalTotalSupply: 1,
            maximalTotalDebt: 2,
            minimalCollateral: new ReturnNumber(3),
            minimalDebt: new ReturnNumber(4),
          },
        },
      ]);
    });

    it('roleAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(roleAdmin).query.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(treasury).query.setReserveRestrictions(testEnv.reserves['DAI'].underlying.address, 1, 2, 3, 4)
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
      const txRes = await tx;
      //no generated income
      expect(txRes.events).to.deep.equal([]);
    });
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('modify asset rules ...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(flashBorrower).query.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null))
        .value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool.withSigner(assetListingAdmin).query.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergencyAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool.withSigner(emergancyAdmin).query.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null)
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed to modify asset rules and event should be emitted', async () => {
      const tx = lendingPool.withSigner(parametersAdmin).tx.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 0,
            asset: testEnv.reserves['DAI'].underlying.address,
            collateralCoefficientE6: null,
            borrowCoefficientE6: null,
            penaltyE6: null,
          },
        },
      ]);
    });
    it('globalAdmin should succeed to modify asset rules and event should be emitted', async () => {
      const tx = lendingPool.withSigner(globalAdmin).tx.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, 999000, 1001000, 500);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 0,
            asset: testEnv.reserves['DAI'].underlying.address,
            collateralCoefficientE6: 999000,
            borrowCoefficientE6: 1001000,
            penaltyE6: 500,
          },
        },
      ]);
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(roleAdmin).query.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null))
        .value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (await lendingPool.withSigner(treasury).query.modifyAssetRule(0, testEnv.reserves['DAI'].underlying.address, null, null, null))
        .value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('add market rule ...', () => {
    it('flashBorrower should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(flashBorrower)
          .query.addMarketRule([
            { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
            { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
            null,
            { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
          ])
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(assetListingAdmin)
          .query.addMarketRule([
            { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
            { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
            null,
            { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
          ])
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('emergencyAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(emergancyAdmin)
          .query.addMarketRule([
            { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
            { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
            null,
            { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
          ])
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed to modify asset rules and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(parametersAdmin)
        .tx.addMarketRule([
          { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
          { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
          null,
          { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
        ]);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['DAI'].underlying.address,
            collateralCoefficientE6: null,
            borrowCoefficientE6: null,
            penaltyE6: null,
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['USDC'].underlying.address,
            collateralCoefficientE6: 900000,
            borrowCoefficientE6: null,
            penaltyE6: 500000,
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['LINK'].underlying.address,
            collateralCoefficientE6: null,
            borrowCoefficientE6: 1100000,
            penaltyE6: 500000,
          },
        },
      ]);
    });
    it('globalAdmin should succeed to modify asset rules and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(globalAdmin)
        .tx.addMarketRule([
          { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
          { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
          null,
          { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
        ]);
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const txRes = await tx;
      expect(txRes.events).to.deep.equal([
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['DAI'].underlying.address,
            collateralCoefficientE6: null,
            borrowCoefficientE6: null,
            penaltyE6: null,
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['USDC'].underlying.address,
            collateralCoefficientE6: 900000,
            borrowCoefficientE6: null,
            penaltyE6: 500000,
          },
        },
        {
          name: 'AssetRulesChanged',
          args: {
            marketRuleId: 1,
            asset: testEnv.reserves['LINK'].underlying.address,
            collateralCoefficientE6: null,
            borrowCoefficientE6: 1100000,
            penaltyE6: 500000,
          },
        },
      ]);
    });
    it('roleAdmin should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(roleAdmin)
          .query.addMarketRule([
            { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
            { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
            null,
            { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
          ])
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const res = (
        await lendingPool
          .withSigner(treasury)
          .query.addMarketRule([
            { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
            { collateralCoefficientE6: 900000, borrowCoefficientE6: null, penaltyE6: 500000 },
            null,
            { collateralCoefficientE6: null, borrowCoefficientE6: 1100000, penaltyE6: 500000 },
          ])
      ).value.ok;
      expect(res).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });
});
