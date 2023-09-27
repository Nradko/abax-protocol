import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';
import { ReturnNumber } from '@727-ventures/typechain-types';
import { ROLE_NAMES, ROLES } from './consts';
import { TupleType } from 'typescript';
import { BN, objectValues } from '@polkadot/util';
const isValidObject = (obj: any) => typeof obj === 'object' && obj !== null;
/* eslint-disable */
const replaceRNBNPropsWithStrings = function (obj: any) {
  if (obj?.rawNumber) {
    return obj.rawNumber.toString();
  }
  let tmpObj = obj;
  if (isValidObject(obj)) {
    for (const key in obj) {
      if (obj[key]?.rawNumber) {
        tmpObj[key] = obj[key].rawNumber.toString();
      } else if (BN.isBN(obj[key])) {
        tmpObj[key] = obj[key].toString();
      } else if (typeof obj[key] === 'number') {
        tmpObj[key] = String(obj[key]);
      } else if (isValidObject(obj[key])) {
        tmpObj[key] = replaceRNBNPropsWithStrings(obj[key]);
      }
    }
  }

  return tmpObj;
};

makeSuite('Menage tests', (getTestEnv) => {
  const adminOf: Record<string, KeyringPair> = {};
  const ROLES_NAMES = ROLE_NAMES.filter((name) => name !== 'FLASH_BORROWER');
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
    adminOf['ROLE_ADMIN'] = users[0];
    adminOf['GLOBAL_ADMIN'] = users[1];
    adminOf['ASSET_LISTING_ADMIN'] = users[2];
    adminOf['PARAMETERS_ADMIN'] = users[3];
    adminOf['STABLECOIN_RATE_ADMIN'] = users[4];
    adminOf['EMERGENCY_ADMIN'] = users[5];
    adminOf['TREASURY'] = users[6];

    for (const role_name of ROLES_NAMES.filter((role) => role !== 'ROLE_ADMIN')) {
      const role = ROLES[role_name];
      const qq = await lendingPool.withSigner(owner).query.grantRole(role, adminOf[role_name].address);
      const tx = await lendingPool.withSigner(owner).tx.grantRole(role, adminOf[role_name].address);
    }
  });
  // assetListingAdmin, globalAdmin are allowed to
  describe('While changing a flash loan fee', () => {
    const ROLES_WITH_PERMISSION: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    const flashLoanFeeE6 = '123456';
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_PERMISSION.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setFlashLoanFeeE6(flashLoanFeeE6)).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_PERMISSION) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setFlashLoanFeeE6(flashLoanFeeE6);
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'FlashLoanFeeChanged',
            args: {
              flashLoanFeeE6: flashLoanFeeE6,
            },
          },
        ]);
        const querryRes = (await lendingPool.query.viewFlashLoanFeeE6()).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(querryRes)).to.equal(flashLoanFeeE6);
        expect.flushSoft();
      });
    }
  });

  // assetListingAdmin, globalAdmin are allowed to
  describe('While registering an aasset', () => {
    const ROLES_WITH_PERMISSION: string[] = ['ASSET_LISTING_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerAsset>;
    const PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      decimals: '100000',
      collateralCoefficientE6: '500000',
      borrowCoefficientE6: '3000000',
      penaltyE6: '300000',
      maximalTotalSupply: '111',
      maximalTotalDebt: '222',
      minimalCollateral: '200000',
      minimalDebt: '500000',
      incomeForSuppliersPartE6: '800000',
      interestRateModel: ['1', '2', '3', '4', '5', '6', '7'],
      aTokenAddress: '5HA6b9t4DnVD7vmSX6fpU6W6qxc1pS9wKnV1Ee57fQAbNx3H',
      vTokenAddress: '5G4bxHzTmuNtuYUYhwCEyKui83mvW4kooK6RR8Rh1wJGhHce',
    };

    it.only('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_PERMISSION.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.registerAsset(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_PERMISSION) {
      it.only(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.registerAsset(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRegistered',
            args: {
              asset: PARAMS.asset,
              decimals: PARAMS.decimals,
              aTokenAddress: PARAMS.aTokenAddress,
              vTokenAddress: PARAMS.vTokenAddress,
            },
          },
          {
            name: 'ParametersChanged',
            args: {
              asset: PARAMS.asset,
              interestRateModel: [
                PARAMS.interestRateModel[0],
                PARAMS.interestRateModel[1],
                PARAMS.interestRateModel[2],
                PARAMS.interestRateModel[3],
                PARAMS.interestRateModel[4],
                PARAMS.interestRateModel[5],
                PARAMS.interestRateModel[6],
              ],
              incomeForSuppliersPartE6: PARAMS.incomeForSuppliersPartE6,
            },
          },
          {
            name: 'RestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              maximalTotalSupply: PARAMS.maximalTotalSupply,
              maximalTotalDebt: PARAMS.maximalTotalDebt,
              minimalCollateral: PARAMS.minimalCollateral,
              minimalDebt: PARAMS.minimalDebt,
            },
          },
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: '0',
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.borrowCoefficientE6,
              penaltyE6: PARAMS.penaltyE6,
            },
          },
        ]);
        const timestamp = (await testEnv.blockTimestampProvider.query.getBlockTimestamp()).value.ok!;
        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        const reserveParameters = (await lendingPool.query.viewReserveParameters(PARAMS.asset)).value.ok!;
        const reserveIndexes = (await lendingPool.query.viewReserveIndexes(PARAMS.asset)).value.ok!;
        const reserveTokens = (await lendingPool.query.viewReserveTokens(PARAMS.asset)).value.ok!;
        const reservePrices = (await lendingPool.query.viewReservePrices(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(reserveData)).to.deep.equal({
          activated: true,
          freezed: false,
          totalDeposit: '0',
          currentSupplyRateE24: '0',
          totalDebt: '0',
          currentDebtRateE24: '0',
          indexesUpdateTimestamp: timestamp.toString(),
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveRestrictions)).to.deep.equal({
          maximalTotalSupply: PARAMS.maximalTotalSupply,
          maximalTotalDebt: PARAMS.maximalTotalDebt,
          minimalCollateral: PARAMS.minimalCollateral,
          minimalDebt: PARAMS.minimalDebt,
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveParameters)).to.deep.equal({
          interestRateModel: PARAMS.interestRateModel,
          incomeForSuppliersPartE6: PARAMS.incomeForSuppliersPartE6,
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveIndexes)).to.deep.equal({
          cumulativeSupplyIndexE18: '1000000000000000000',
          cumulativeDebtIndexE18: '1000000000000000000',
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveTokens)).to.deep.equal({
          aTokenAddress: PARAMS.aTokenAddress,
          vTokenAddress: PARAMS.vTokenAddress,
        });
        expect.soft(replaceRNBNPropsWithStrings(reservePrices)).to.deep.equal({
          decimals: PARAMS.decimals,
          tokenPriceE8: null,
        });
        expect.flushSoft();
      });
    }
    it(`that was already register with signer ASSET_LISTING_ADMIN tx should fail with Err AlreadyRegistered`, async () => {
      const tx = lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).tx.registerAsset(...(Object.values(PARAMS) as params));
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const res = (await lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).query.registerAsset(...(Object.values(PARAMS) as params))).value.ok;
      expect(res, 'asset already registered').to.have.deep.property('err', LendingPoolErrorBuilder.AlreadyRegistered());
    });
  });

  // assetListingAdmin, globalAdmin are allowed to
  describe('While registering a protocol stablecoin', () => {
    const ROLES_WITH_PERMISSION: string[] = ['ASSET_LISTING_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerStablecoin>;
    const PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      decimals: '100000',
      collateralCoefficientE6: '500000',
      borrowCoefficientE6: '3000000',
      penaltyE6: '300000',
      maximalTotalSupply: '111',
      maximalTotalDebt: '222',
      minimalCollateral: '200000',
      minimalDebt: '500000',
      aTokenAddress: '5HA6b9t4DnVD7vmSX6fpU6W6qxc1pS9wKnV1Ee57fQAbNx3H',
      vTokenAddress: '5G4bxHzTmuNtuYUYhwCEyKui83mvW4kooK6RR8Rh1wJGhHce',
    };

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_PERMISSION.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.registerStablecoin(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_PERMISSION) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.registerStablecoin(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRegistered',
            args: {
              asset: PARAMS.asset,
              decimals: PARAMS.decimals,
              aTokenAddress: PARAMS.aTokenAddress,
              vTokenAddress: PARAMS.vTokenAddress,
            },
          },
          {
            name: 'RestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              maximalTotalSupply: PARAMS.maximalTotalSupply,
              maximalTotalDebt: PARAMS.maximalTotalDebt,
              minimalCollateral: PARAMS.minimalCollateral,
              minimalDebt: PARAMS.minimalDebt,
            },
          },
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: '0',
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.borrowCoefficientE6,
              penaltyE6: PARAMS.penaltyE6,
            },
          },
        ]);
        const timestamp = (await testEnv.blockTimestampProvider.query.getBlockTimestamp()).value.ok!;
        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        const reserveParameters = (await lendingPool.query.viewReserveParameters(PARAMS.asset)).value.ok!;
        const reserveIndexes = (await lendingPool.query.viewReserveIndexes(PARAMS.asset)).value.ok!;
        const reserveTokens = (await lendingPool.query.viewReserveTokens(PARAMS.asset)).value.ok!;
        const reservePrices = (await lendingPool.query.viewReservePrices(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(reserveData)).to.deep.equal({
          activated: true,
          freezed: false,
          totalDeposit: '0',
          currentSupplyRateE24: '0',
          totalDebt: '0',
          currentDebtRateE24: '0',
          indexesUpdateTimestamp: timestamp.toString(),
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveRestrictions)).to.deep.equal({
          maximalTotalSupply: PARAMS.maximalTotalSupply,
          maximalTotalDebt: PARAMS.maximalTotalDebt,
          minimalCollateral: PARAMS.minimalCollateral,
          minimalDebt: PARAMS.minimalDebt,
        });
        expect.soft(reserveParameters).to.deep.equal(null);
        expect.soft(replaceRNBNPropsWithStrings(reserveIndexes)).to.deep.equal({
          cumulativeSupplyIndexE18: '1000000000000000000',
          cumulativeDebtIndexE18: '1000000000000000000',
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveTokens)).to.deep.equal({
          aTokenAddress: PARAMS.aTokenAddress,
          vTokenAddress: PARAMS.vTokenAddress,
        });
        expect.soft(replaceRNBNPropsWithStrings(reservePrices)).to.deep.equal({
          decimals: PARAMS.decimals,
          tokenPriceE8: null,
        });
        expect.flushSoft();
      });
    }
    it(`that was already register with signer ASSET_LISTING_ADMIN tx should fail with Err AlreadyRegistered`, async () => {
      const tx = lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).tx.registerStablecoin(...(Object.values(PARAMS) as params));
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const res = (await lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).query.registerStablecoin(...(Object.values(PARAMS) as params))).value
        .ok;
      expect(res, 'stablecoin already registered').to.have.deep.property('err', LendingPoolErrorBuilder.AlreadyRegistered());
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
        await lendingPool.withSigner(flashBorrower).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('assetListingAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool
          .withSigner(assetListingAdmin)
          .query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('parametersAdmin should succed and event should be emitted', async () => {
      const tx = lendingPool
        .withSigner(parametersAdmin)
        .tx.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 10);
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
          },
        },
      ]);
    });
    it('emergancyAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(emergancyAdmin).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('globalAdmin should succeed and event should be emitted', async () => {
      const tx = lendingPool.withSigner(globalAdmin).tx.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 10);
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
          },
        },
      ]);
    });

    it('roleAdmin should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(roleAdmin).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
    it('treasury should return Err(MissingRole)', async () => {
      const queryResult = (
        await lendingPool.withSigner(treasury).query.setReserveParameters(testEnv.reserves['DAI'].underlying.address, [1, 2, 3, 4, 5, 6, 7], 0)
      ).value.ok;
      expect(queryResult).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
    });
  });
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
