// TODO: once protocol stablecoin is added to default deploy add test to changing stablecoin rates
import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';
import { ROLE_NAMES, ROLES } from './consts';
import { BN } from '@polkadot/util';
import { getContractObject } from '@abaxfinance/contract-helpers';
import { getAbaxTokenMetadata } from './helpers/abacusTokenData';
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
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    const flashLoanFeeE6 = '123456';
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setFlashLoanFeeE6(flashLoanFeeE6)).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
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
    const ROLES_WITH_ACCESS: string[] = ['ASSET_LISTING_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerAsset>;
    let PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      aTokenCodeHash: [0],
      vTokenCodeHash: [0],
      name: 'TOKEN NAME XAYR',
      symbol: 'XAYR',
      decimals: '6',
      collateralCoefficientE6: '500000',
      borrowCoefficientE6: '3000000',
      penaltyE6: '300000',
      maximalTotalDeposit: '111',
      maximalTotalDebt: '222',
      minimalCollateral: '200000',
      minimalDebt: '500000',
      incomeForSuppliersPartE6: '800000',
      interestRateModel: ['1', '2', '3', '4', '5', '6', '7'],
    };

    beforeEach(() => {
      PARAMS.aTokenCodeHash = testEnv.aTokenCodeHash;
      PARAMS.vTokenCodeHash = testEnv.vTokenCodeHash;
    });

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.registerAsset(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.registerAsset(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;

        const abaxTokensMetadata = await getAbaxTokenMetadata(owner, lendingPool, PARAMS.asset);
        expect.soft(abaxTokensMetadata.aToken.metadata).to.deep.equal({
          name: 'Abax Deposit ' + PARAMS.name,
          symbol: 'a' + PARAMS.symbol,
          decimals: PARAMS.decimals,
        });

        expect.soft(abaxTokensMetadata.vToken.metadata).to.deep.equal({
          name: 'Abax Variable Debt ' + PARAMS.name,
          symbol: 'v' + PARAMS.symbol,
          decimals: PARAMS.decimals,
        });

        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRegistered',
            args: {
              asset: PARAMS.asset,
              decimals: PARAMS.decimals,
              name: PARAMS.name,
              symbol: PARAMS.symbol,
              aTokenCodeHash: PARAMS.aTokenCodeHash,
              vTokenCodeHash: PARAMS.vTokenCodeHash,
              aTokenAddress: abaxTokensMetadata.aToken.address,
              vTokenAddress: abaxTokensMetadata.vToken.address,
            },
          },
          {
            name: 'ReserveParametersChanged',
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
            name: 'ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              maximalTotalDeposit: PARAMS.maximalTotalDeposit,
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
          currentDepositRateE24: '0',
          totalDebt: '0',
          currentDebtRateE24: '0',
          indexesUpdateTimestamp: timestamp.toString(),
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveRestrictions)).to.deep.equal({
          maximalTotalDeposit: PARAMS.maximalTotalDeposit,
          maximalTotalDebt: PARAMS.maximalTotalDebt,
          minimalCollateral: PARAMS.minimalCollateral,
          minimalDebt: PARAMS.minimalDebt,
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveParameters)).to.deep.equal({
          interestRateModel: PARAMS.interestRateModel,
          incomeForSuppliersPartE6: PARAMS.incomeForSuppliersPartE6,
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveIndexes)).to.deep.equal({
          cumulativeDepositIndexE18: '1000000000000000000',
          cumulativeDebtIndexE18: '1000000000000000000',
        });
        expect.soft(replaceRNBNPropsWithStrings(reservePrices)).to.deep.equal({
          decimals: Math.pow(10, Number(PARAMS.decimals)).toString(),

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
    const ROLES_WITH_ACCESS: string[] = ['ASSET_LISTING_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerStablecoin>;
    const PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      aTokenCodeHash: [0],
      vTokenCodeHash: [0],
      name: 'TOKEN NAME XAYR',
      symbol: 'XAYR',
      decimals: '6',
      collateralCoefficientE6: '500000',
      borrowCoefficientE6: '3000000',
      penaltyE6: '300000',
      maximalTotalDeposit: '111',
      maximalTotalDebt: '222',
      minimalCollateral: '200000',
      minimalDebt: '500000',
    };
    beforeEach(() => {
      PARAMS.aTokenCodeHash = testEnv.aTokenCodeHash;
      PARAMS.vTokenCodeHash = testEnv.vTokenCodeHash;
    });

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.registerStablecoin(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.registerStablecoin(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;

        const abaxTokensMetadata = await getAbaxTokenMetadata(owner, lendingPool, PARAMS.asset);
        expect.soft(abaxTokensMetadata.aToken.metadata).to.deep.equal({
          name: 'Abax Deposit ' + PARAMS.name,
          symbol: 'a' + PARAMS.symbol,
          decimals: PARAMS.decimals,
        });

        expect.soft(abaxTokensMetadata.vToken.metadata).to.deep.equal({
          name: 'Abax Variable Debt ' + PARAMS.name,
          symbol: 'v' + PARAMS.symbol,
          decimals: PARAMS.decimals,
        });

        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRegistered',
            args: {
              asset: PARAMS.asset,
              decimals: PARAMS.decimals,
              name: PARAMS.name,
              symbol: PARAMS.symbol,
              aTokenCodeHash: PARAMS.aTokenCodeHash,
              vTokenCodeHash: PARAMS.vTokenCodeHash,
              aTokenAddress: abaxTokensMetadata.aToken.address,
              vTokenAddress: abaxTokensMetadata.vToken.address,
            },
          },
          {
            name: 'ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              maximalTotalDeposit: PARAMS.maximalTotalDeposit,
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
        const reserveIndexes = (await lendingPool.query.viewReserveIndexes(PARAMS.asset)).value.ok!;
        const reservePrices = (await lendingPool.query.viewReservePrices(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(reserveData)).to.deep.equal({
          activated: true,
          freezed: false,
          totalDeposit: '0',
          currentDepositRateE24: '0',
          totalDebt: '0',
          currentDebtRateE24: '0',
          indexesUpdateTimestamp: timestamp.toString(),
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveRestrictions)).to.deep.equal({
          maximalTotalDeposit: PARAMS.maximalTotalDeposit,
          maximalTotalDebt: PARAMS.maximalTotalDebt,
          minimalCollateral: PARAMS.minimalCollateral,
          minimalDebt: PARAMS.minimalDebt,
        });
        expect.soft(replaceRNBNPropsWithStrings(reserveIndexes)).to.deep.equal({
          cumulativeDepositIndexE18: '1000000000000000000',
          cumulativeDebtIndexE18: '1000000000000000000',
        });
        expect.soft(replaceRNBNPropsWithStrings(reservePrices)).to.deep.equal({
          decimals: Math.pow(10, Number(PARAMS.decimals)).toString(),
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

  // emergencyAdmin, globalAdmin are allowed to
  describe('While changing reserve activness', () => {
    const ROLES_WITH_ACCESS: string[] = ['EMERGENCY_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveIsActive>;
    const PARAMS = {
      asset: '',
      active: false,
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsActive(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const reserveDataBefore = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        expect.soft(reserveDataBefore.activated).to.equal(true);

        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveIsActive(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'ReserveActivated',
            args: {
              asset: PARAMS.asset,
              active: PARAMS.active,
            },
          },
        ]);

        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        expect.soft(reserveData.activated).to.equal(PARAMS.active);

        expect.flushSoft();
      });
    }
    it('roles with permission should fail to activate already activated reserve with Err AlreadyActivated', async () => {
      for (const role_name of ROLES_WITH_ACCESS) {
        const queryRes = (
          await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsActive(...(Object.values({ ...PARAMS, active: true }) as params))
        ).value.ok;
        expect.soft(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
      }
      expect.flushSoft();
    });
  });

  // emergencyAdmin, globalAdmin are allowed to
  describe('While changing reserve is freezed', () => {
    const ROLES_WITH_ACCESS: string[] = ['EMERGENCY_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveIsFreezed>;
    const PARAMS = {
      asset: '',
      active: true,
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsFreezed(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const reserveDataBefore = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        expect.soft(reserveDataBefore.activated).to.equal(true);

        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveIsFreezed(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'ReserveFreezed',
            args: {
              asset: PARAMS.asset,
              freezed: PARAMS.active,
            },
          },
        ]);

        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        expect.soft(reserveData.activated).to.equal(PARAMS.active);

        expect.flushSoft();
      });
    }
    it('roles with permission should fail to activate already activated reserve with Err AlreadyActivated', async () => {
      for (const role_name of ROLES_WITH_ACCESS) {
        const queryRes = (
          await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsFreezed(...(Object.values({ ...PARAMS, active: false }) as params))
        ).value.ok;
        expect.soft(queryRes).to.have.deep.property('err', LendingPoolErrorBuilder.AlreadySet());
      }
      expect.flushSoft();
    });
  });

  // parametersAdmin, globalAdmin are allowed
  // TODO: once protocol stablecoin is added to default deploy add test to check that parameters can not be changed
  describe('While changing reserve parameters', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveParameters>;
    const PARAMS = {
      asset: '',
      interestRateModel: ['1', '2', '3', '4', '5', '6', '7'],
      incomeForSuppliersPartE6: '99999',
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveParameters(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveParameters(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'ReserveParametersChanged',
            args: {
              asset: PARAMS.asset,
              interestRateModel: PARAMS.interestRateModel,
              incomeForSuppliersPartE6: PARAMS.incomeForSuppliersPartE6,
            },
          },
        ]);

        const reserveParameters = (await lendingPool.query.viewReserveParameters(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(reserveParameters)).to.deep.equal({
          interestRateModel: PARAMS.interestRateModel,
          incomeForSuppliersPartE6: PARAMS.incomeForSuppliersPartE6,
        });

        expect.flushSoft();
      });
    }
  });
  // parametersAdmin, globalAdmin are allowed to
  describe('While changing reserve restrictions', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveRestrictions>;
    const PARAMS = {
      asset: '',
      maximalTotalDeposit: '123456789',
      maximalTotalDebt: '23456789',
      minimalCollateral: '3456789',
      minimalDebt: '456789',
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveRestrictions(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveRestrictions(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              maximalTotalDeposit: PARAMS.maximalTotalDeposit,
              maximalTotalDebt: PARAMS.maximalTotalDebt,
              minimalCollateral: PARAMS.minimalCollateral,
              minimalDebt: PARAMS.minimalDebt,
            },
          },
        ]);

        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(reserveRestrictions)).to.deep.equal({
          maximalTotalDeposit: PARAMS.maximalTotalDeposit,
          maximalTotalDebt: PARAMS.maximalTotalDebt,
          minimalCollateral: PARAMS.minimalCollateral,
          minimalDebt: PARAMS.minimalDebt,
        });

        expect.flushSoft();
      });
    }
  });

  // treasury is allowed
  describe('While taking a protocol income', () => {
    const ROLES_WITH_ACCESS: string[] = ['TREASURY'];
    type params = Parameters<typeof lendingPool.query.takeProtocolIncome>;
    const PARAMS = {
      assets: null,
      to: '',
    };
    beforeEach(() => {
      PARAMS.to = users[4].address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.takeProtocolIncome(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.takeProtocolIncome(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        // expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([]);
        expect.flushSoft();
      });
    }
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('While modyfing asset rules', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.modifyAssetRule>;
    const PARAMS = {
      marketRuleId: '0',
      asset: '',
      collateralCoefficientE6: '500000',
      borrowCoefficientE6: '1750000',
      penaltyE6: '400000',
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.modifyAssetRule(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.modifyAssetRule(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: PARAMS.marketRuleId,
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.borrowCoefficientE6,
              penaltyE6: PARAMS.penaltyE6,
            },
          },
        ]);

        const marketRules = (await lendingPool.query.viewMarketRule(PARAMS.marketRuleId)).value.ok!;
        const assetId = (await lendingPool.query.viewAssetId(PARAMS.asset)).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(marketRules[assetId]!)).to.deep.equal({
          collateralCoefficientE6: PARAMS.collateralCoefficientE6,
          borrowCoefficientE6: PARAMS.borrowCoefficientE6,
          penaltyE6: PARAMS.penaltyE6,
        });
        expect.flushSoft();
      });
    }
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('While adding market rules', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN', 'GLOBAL_ADMIN'];
    type params = Parameters<typeof lendingPool.query.addMarketRule>;
    const marketRule: any[] = [
      { collateralCoefficientE6: null, borrowCoefficientE6: null, penaltyE6: null },
      { collateralCoefficientE6: '900000', borrowCoefficientE6: null, penaltyE6: '500000' },
      null,
      { collateralCoefficientE6: null, borrowCoefficientE6: '1100000', penaltyE6: '500000' },
    ];

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLES_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name));
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.addMarketRule(marketRule)).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.addMarketRule(marketRule);
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(replaceRNBNPropsWithStrings(txRes.events)).to.deep.equal([
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: '1',
              asset: testEnv.reserves['DAI'].underlying.address,
              collateralCoefficientE6: marketRule[0].collateralCoefficientE6,
              borrowCoefficientE6: marketRule[0].borrowCoefficientE6,
              penaltyE6: marketRule[0].penaltyE6,
            },
          },
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: '1',
              asset: testEnv.reserves['USDC'].underlying.address,
              collateralCoefficientE6: marketRule[1].collateralCoefficientE6,
              borrowCoefficientE6: marketRule[1].borrowCoefficientE6,
              penaltyE6: marketRule[1].penaltyE6,
            },
          },
          {
            name: 'AssetRulesChanged',
            args: {
              marketRuleId: '1',
              asset: testEnv.reserves['LINK'].underlying.address,
              collateralCoefficientE6: marketRule[3].collateralCoefficientE6,
              borrowCoefficientE6: marketRule[3].borrowCoefficientE6,
              penaltyE6: marketRule[3].penaltyE6,
            },
          },
        ]);

        const queryMarketRule = (await lendingPool.query.viewMarketRule('1')).value.ok!;
        expect.soft(replaceRNBNPropsWithStrings(queryMarketRule!)).to.deep.equal(marketRule);
        expect.flushSoft();
      });
    }
  });
});
