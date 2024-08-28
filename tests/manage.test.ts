import { KeyringPair } from '@polkadot/keyring/types';

import { LendingPoolErrorBuilder } from 'typechain/types-returns/lending_pool';
import LendingPoolContract from '../typechain/contracts/lending_pool';
import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
import { expect } from './setup/chai';
import { AccessControlError } from 'typechain/types-arguments/lending_pool';
import { ROLE_NAMES, ROLES } from './consts';
import { getAbaxTokenMetadata } from './helpers/abacusTokenData';
import { apiProviderWrapper } from 'tests/setup/helpers';
import BN from 'bn.js';
import { stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';
import { time } from '@c-forge/polkahat-network-helpers';

makeSuite('Manage tests', (getTestEnv) => {
  const adminOf: Record<string, KeyringPair> = {};
  let testEnv: TestEnv;
  let accounts: KeyringPair[];
  let owner: KeyringPair;
  let lendingPool: LendingPoolContract;
  beforeEach('grant roles', async () => {
    testEnv = getTestEnv();
    lendingPool = testEnv.lendingPool;
    owner = testEnv.owner;
    accounts = testEnv.accounts;
    adminOf['ROLE_ADMIN'] = accounts[0];
    adminOf['ASSET_LISTING_ADMIN'] = accounts[1];
    adminOf['PARAMETERS_ADMIN'] = accounts[2];
    adminOf['STABLECOIN_RATE_ADMIN'] = accounts[3];
    adminOf['EMERGENCY_ADMIN'] = accounts[4];
    adminOf['TREASURY'] = accounts[5];

    for (const role_name of ROLE_NAMES.filter((role) => role !== 'ROLE_ADMIN' && adminOf[role])) {
      const role = ROLES[role_name];
      const qq = await lendingPool.withSigner(owner).query.grantRole(role, adminOf[role_name].address);
      const tkqr = await lendingPool.withSigner(owner).query.viewRegisteredAssets();
      const tx = await lendingPool.withSigner(owner).tx.grantRole(role, adminOf[role_name].address);
    }
  });
  // assetListingAdmin, globalAdmin are allowed to
  describe('While changing a flash loan fee', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    const flashLoanFeeE6 = '123456';
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::FlashLoanFeeChanged',
            args: {
              flashLoanFeeE6: flashLoanFeeE6,
            },
          },
        ]);
        const querryRes = (await lendingPool.query.viewFlashLoanFeeE6()).value.ok!;
        expect.soft(querryRes).to.equal(flashLoanFeeE6);
        expect.flushSoft();
      });
    }
  });

  // assetListingAdmin, globalAdmin are allowed to
  describe('While registering an aasset', () => {
    const ROLES_WITH_ACCESS: string[] = ['ASSET_LISTING_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerAsset>;
    const PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      aTokenCodeHash: '',
      vTokenCodeHash: '',
      name: 'abax_contracts::lending_pool::events::TOKEN NAME XAYR',
      symbol: 'XAYR',
      decimals: '6',
      assetRules: {
        collateralCoefficientE6: '500000',
        borrowCoefficientE6: '3000000',
        penaltyE6: '300000',
      },
      reserveRestrictions: {
        maximalTotalDeposit: '111',
        maximalTotalDebt: '222',
        minimalCollateral: '200000',
        minimalDebt: '500000',
      },
      reserveFees: { depositFeeE6: '100000', debtFeeE6: '100000' },
      interestRateModel: {
        targetUrE6: 1,
        minRateAtTargetE18: 2,
        maxRateAtTargetE18: 3,
        rateAtMaxUrE18: 4,
        minimalTimeBetweenAdjustments: 5,
      },
    };

    beforeEach(() => {
      PARAMS.aTokenCodeHash = testEnv.aTokenCodeHash;
      PARAMS.vTokenCodeHash = testEnv.vTokenCodeHash;
    });

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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

        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::AssetRegistered',
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
            name: 'abax_contracts::lending_pool::events::ReserveInterestRateModelChanged',
            args: {
              asset: PARAMS.asset,
              interestRateModelParams: {
                targetUrE6: '1',
                minRateAtTargetE18: '2',
                maxRateAtTargetE18: '3',
                rateAtMaxUrE18: '4',
                minimalTimeBetweenAdjustments: '5',
              },
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              reserveRestrictions: PARAMS.reserveRestrictions,
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::AssetRulesChanged',
            args: {
              marketRuleId: '0',
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.assetRules.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.assetRules.borrowCoefficientE6,
              penaltyE6: PARAMS.assetRules.penaltyE6,
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::ReserveFeesChanged',
            args: {
              asset: PARAMS.asset,
              reserveFees: PARAMS.reserveFees,
            },
          },
        ]);
        const api = await apiProviderWrapper.getAndWaitForReady();
        const timestamp = await api.query.timestamp.now();
        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        const reserveModel = (await lendingPool.query.viewInterestRateModel(PARAMS.asset)).value.ok!;
        const reserveFees = (await lendingPool.query.viewReserveFees(PARAMS.asset)).value.ok!;
        const reserveIndexes = (await lendingPool.query.viewReserveIndexes(PARAMS.asset)).value.ok!;
        const reserveTokens = (await lendingPool.query.viewReserveTokens(PARAMS.asset)).value.ok!;
        const reserveDecimalMultiplier = (await lendingPool.query.viewReserveDecimalMultiplier(PARAMS.asset)).value.ok!.toString();
        expect.soft(stringifyNumericProps(reserveData)).to.deep.equal({
          activated: true,
          frozen: false,
          totalDeposit: '0',
          currentDepositRateE18: '0',
          totalDebt: '0',
          currentDebtRateE18: '0',
        });
        expect.soft(stringifyNumericProps(reserveRestrictions)).to.deep.equal(PARAMS.reserveRestrictions);
        expect.soft(stringifyNumericProps(reserveModel)).to.deep.equal({
          targetUrE6: '1',
          minRateAtTargetE18: '2',
          maxRateAtTargetE18: '3',
          rateAtTargetUrE18: '2',
          rateAtMaxUrE18: '4',
          minimalTimeBetweenAdjustments: '5',
          lastAdjustmentTimestamp: (await time.latest()).toString(),
        });
        expect.soft(stringifyNumericProps(reserveFees)).to.deep.equal({ ...PARAMS.reserveFees, earnedFee: '0' });
        expect.soft(stringifyNumericProps(reserveIndexes)).to.deep.equal({
          depositIndexE18: '1000000000000000000',
          debtIndexE18: '1000000000000000000',
          updateTimestamp: timestamp.toString(),
        });
        expect.soft(reserveDecimalMultiplier).to.equal(Math.pow(10, Number(PARAMS.decimals)).toString());
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
    const ROLES_WITH_ACCESS: string[] = ['ASSET_LISTING_ADMIN'];
    type params = Parameters<typeof lendingPool.query.registerAsset>;
    const PARAMS = {
      asset: '5E2kzu11ycTw6kZG3XTj2ax8BTNA8ZfAPmex8jkT6CmCfBNy',
      aTokenCodeHash: '',
      vTokenCodeHash: '',
      name: 'abax_contracts::lending_pool::events::TOKEN NAME XAYR',
      symbol: 'XAYR',
      decimals: '6',
      assetRules: {
        collateralCoefficientE6: '500000',
        borrowCoefficientE6: '3000000',
        penaltyE6: '300000',
      },
      reserveRestrictions: {
        maximalTotalDeposit: '111',
        maximalTotalDebt: '222',
        minimalCollateral: '200000',
        minimalDebt: '500000',
      },
      reserveFees: {
        depositFeeE6: '10000',
        debtFeeE6: '10000',
      },
      interestRateModel: null,
    };
    beforeEach(() => {
      PARAMS.aTokenCodeHash = testEnv.aTokenCodeHash;
      PARAMS.vTokenCodeHash = testEnv.vTokenCodeHash;
    });

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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

        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::AssetRegistered',
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
            name: 'abax_contracts::lending_pool::events::ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              reserveRestrictions: PARAMS.reserveRestrictions,
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::AssetRulesChanged',
            args: {
              marketRuleId: '0',
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.assetRules.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.assetRules.borrowCoefficientE6,
              penaltyE6: PARAMS.assetRules.penaltyE6,
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::ReserveFeesChanged',
            args: {
              asset: PARAMS.asset,
              reserveFees: PARAMS.reserveFees,
            },
          },
        ]);
        const api = await apiProviderWrapper.getAndWaitForReady();
        const timestamp = await api.query.timestamp.now();
        const reserveData = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        const reserveIndexes = (await lendingPool.query.viewReserveIndexes(PARAMS.asset)).value.ok!;
        const reserveDecimalMultiplier = (await lendingPool.query.viewReserveDecimalMultiplier(PARAMS.asset)).value.ok!.toString();
        expect.soft(stringifyNumericProps(reserveData)).to.deep.equal({
          activated: true,
          frozen: false,
          totalDeposit: '0',
          currentDepositRateE18: '0',
          totalDebt: '0',
          currentDebtRateE18: '0',
        });
        expect.soft(stringifyNumericProps(reserveRestrictions)).to.deep.equal(PARAMS.reserveRestrictions);
        expect.soft(stringifyNumericProps(reserveIndexes)).to.deep.equal({
          depositIndexE18: '1000000000000000000',
          debtIndexE18: '1000000000000000000',
          updateTimestamp: timestamp.toString(),
        });
        expect.soft(reserveDecimalMultiplier).to.equal(Math.pow(10, Number(PARAMS.decimals)).toString());
        expect.flushSoft();
      });
    }
    it(`that was already register with signer ASSET_LISTING_ADMIN tx should fail with Err AlreadyRegistered`, async () => {
      const tx = lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).tx.registerAsset(...(Object.values(PARAMS) as params));
      await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
      const res = (await lendingPool.withSigner(adminOf['ASSET_LISTING_ADMIN']).query.registerAsset(...(Object.values(PARAMS) as params))).value.ok;
      expect(res, 'stablecoin already registered').to.have.deep.property('err', LendingPoolErrorBuilder.AlreadyRegistered());
    });
  });

  // emergencyAdmin, globalAdmin are allowed to
  describe('While changing reserve activness', () => {
    const ROLES_WITH_ACCESS: string[] = ['EMERGENCY_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveIsActive>;
    const PARAMS = {
      asset: '',
      active: false,
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::ReserveActivated',
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
        expect.soft(queryRes).to.have.deep.property('err', { reserveDataError: 'AlreadySet' });
      }
      expect.flushSoft();
    });
  });

  // emergencyAdmin, globalAdmin are allowed to
  describe('While changing reserve is frozen', () => {
    const ROLES_WITH_ACCESS: string[] = ['EMERGENCY_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveIsFrozen>;
    const PARAMS = {
      asset: '',
      active: true,
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsFrozen(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const reserveDataBefore = (await lendingPool.query.viewReserveData(PARAMS.asset)).value.ok!;
        expect.soft(reserveDataBefore.activated).to.equal(true);

        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveIsFrozen(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::ReserveFrozen',
            args: {
              asset: PARAMS.asset,
              frozen: PARAMS.active,
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
          await lendingPool.withSigner(adminOf[role_name]).query.setReserveIsFrozen(...(Object.values({ ...PARAMS, active: false }) as params))
        ).value.ok;
        expect.soft(queryRes).to.have.deep.property('err', { reserveDataError: 'AlreadySet' });
      }
      expect.flushSoft();
    });
  });

  // parametersAdmin, globalAdmin are allowed
  describe('While changing interest rate model', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setInterestRateModel>;
    const PARAMS = {
      asset: '',
      interestRateModel: {
        targetUrE6: 1,
        minRateAtTargetE18: 2,
        maxRateAtTargetE18: 3,
        rateAtMaxUrE18: 4,
        minimalTimeBetweenAdjustments: 5,
      },
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setInterestRateModel(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setInterestRateModel(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::ReserveInterestRateModelChanged',
            args: {
              asset: PARAMS.asset,
              interestRateModelParams: {
                targetUrE6: '1',
                minRateAtTargetE18: '2',
                maxRateAtTargetE18: '3',
                rateAtMaxUrE18: '4',
                minimalTimeBetweenAdjustments: '5',
              },
            },
          },
        ]);

        const interestRateModel = (await lendingPool.query.viewInterestRateModel(PARAMS.asset)).value.ok!;
        expect.soft(stringifyNumericProps(interestRateModel)).to.deep.equal({
          targetUrE6: '1',
          minRateAtTargetE18: '2',
          maxRateAtTargetE18: '3',
          rateAtTargetUrE18: '2',
          rateAtMaxUrE18: '4',
          minimalTimeBetweenAdjustments: '5',
          lastAdjustmentTimestamp: (await time.latest()).toString(),
        });

        expect.flushSoft();
      });

      it(role_name + 'should fail if asset is a stableToken', async () => {
        PARAMS.asset = testEnv.stables['USDax'].underlying.address;
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setInterestRateModel(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AssetIsProtocolStablecoin());
      });
    }
  });

  describe('While changing reserve fees', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveFees>;
    const PARAMS = {
      asset: '',
      reserveFees: { depositFeeE6: '10000', debtFeeE6: '10000' },
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setReserveFees(...(Object.values(PARAMS) as params))).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed, event should be emitted, storage should be modified', async () => {
        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setReserveFees(...(Object.values(PARAMS) as params));
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');

        const txRes = await tx;
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::ReserveFeesChanged',
            args: {
              asset: PARAMS.asset,
              reserveFees: PARAMS.reserveFees,
            },
          },
        ]);

        const reserveFees = (await lendingPool.query.viewReserveFees(PARAMS.asset)).value.ok!;
        expect.soft(stringifyNumericProps(reserveFees)).to.deep.equal({ ...PARAMS.reserveFees, earnedFee: '0' });

        expect.flushSoft();
      });
    }
  });
  // parametersAdmin, globalAdmin are allowed to
  describe('While changing reserve restrictions', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setReserveRestrictions>;
    const PARAMS = {
      asset: '',
      reserveRestrictions: {
        maximalTotalDeposit: '123456789',
        maximalTotalDebt: '23456789',
        minimalCollateral: '3456789',
        minimalDebt: '456789',
      },
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::ReserveRestrictionsChanged',
            args: {
              asset: PARAMS.asset,
              reserveRestrictions: PARAMS.reserveRestrictions,
            },
          },
        ]);

        const reserveRestrictions = (await lendingPool.query.viewReserveRestrictions(PARAMS.asset)).value.ok!;
        expect.soft(stringifyNumericProps(reserveRestrictions)).to.deep.equal(PARAMS.reserveRestrictions);

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
      PARAMS.to = accounts[4].address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        // expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([]);
        expect.flushSoft();
      });
    }
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('While modyfing asset rules', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    type params = Parameters<typeof lendingPool.query.modifyAssetRule>;
    const PARAMS = {
      marketRuleId: '0',
      asset: '',
      assetRules: {
        collateralCoefficientE6: '500000',
        borrowCoefficientE6: '1750000',
        penaltyE6: '400000',
      },
    };
    beforeEach(() => {
      PARAMS.asset = testEnv.reserves['DAI'].underlying.address;
    });
    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::AssetRulesChanged',
            args: {
              marketRuleId: PARAMS.marketRuleId,
              asset: PARAMS.asset,
              collateralCoefficientE6: PARAMS.assetRules.collateralCoefficientE6,
              borrowCoefficientE6: PARAMS.assetRules.borrowCoefficientE6,
              penaltyE6: PARAMS.assetRules.penaltyE6,
            },
          },
        ]);

        const marketRules = (await lendingPool.query.viewMarketRule(PARAMS.marketRuleId)).value.ok!;
        const assetId = (await lendingPool.query.viewAssetId(PARAMS.asset)).value.ok!;
        expect.soft(stringifyNumericProps(marketRules[assetId.toString()]!)).to.deep.equal({
          collateralCoefficientE6: PARAMS.assetRules.collateralCoefficientE6,
          borrowCoefficientE6: PARAMS.assetRules.borrowCoefficientE6,
          penaltyE6: PARAMS.assetRules.penaltyE6,
        });
        expect.flushSoft();
      });
    }
  });

  // parametersAdmin, globalAdmin are allowed to
  describe('While adding market rules', () => {
    const ROLES_WITH_ACCESS: string[] = ['PARAMETERS_ADMIN'];
    type params = Parameters<typeof lendingPool.query.addMarketRule>;
    const marketRule: any[] = [
      null,
      { collateralCoefficientE6: '900000', borrowCoefficientE6: null, penaltyE6: '500000' },
      null,
      { collateralCoefficientE6: null, borrowCoefficientE6: '1100000', penaltyE6: '500000' },
    ];

    it('roles with no permission should fail with Err MissingRole', async () => {
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
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
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::AssetRulesChanged',
            args: {
              marketRuleId: '1',
              asset: testEnv.reserves['USDC'].underlying.address,
              collateralCoefficientE6: marketRule[1].collateralCoefficientE6,
              borrowCoefficientE6: marketRule[1].borrowCoefficientE6,
              penaltyE6: marketRule[1].penaltyE6,
            },
          },
          {
            name: 'abax_contracts::lending_pool::events::AssetRulesChanged',
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
        expect.soft(stringifyNumericProps(queryMarketRule!)).to.deep.equal(marketRule);
        expect.flushSoft();
      });
    }
  });

  // stablecoin rate admin is allowed to
  describe('While changing stablecoin rate', () => {
    const ROLES_WITH_ACCESS: string[] = ['STABLECOIN_RATE_ADMIN'];
    type params = Parameters<typeof lendingPool.query.setStablecoinDebtRateE18>;
    const debtRateE18: BN = new BN('123456789');

    it('roles with no permission should fail with Err MissingRole', async () => {
      const stableAddress = testEnv.stables['USDax'].underlying.address;
      const ROLES_WITH_NO_ACCESS = ROLE_NAMES.filter((role_name) => !ROLES_WITH_ACCESS.includes(role_name) && adminOf[role_name]);
      for (const role_name of ROLES_WITH_NO_ACCESS) {
        const res = (await lendingPool.withSigner(adminOf[role_name]).query.setStablecoinDebtRateE18(stableAddress, debtRateE18)).value.ok;
        expect.soft(res, role_name).to.have.deep.property('err', LendingPoolErrorBuilder.AccessControlError(AccessControlError.missingRole));
      }
      expect.flushSoft();
    });
    for (const role_name of ROLES_WITH_ACCESS) {
      it(role_name + ' should succeed', async () => {
        const stableAddress = testEnv.stables['USDax'].underlying.address;

        const tx = lendingPool.withSigner(adminOf[role_name]).tx.setStablecoinDebtRateE18(stableAddress, debtRateE18);
        await expect(tx).to.eventually.be.fulfilled.and.not.to.have.deep.property('error');
        const txRes = await tx;
        expect.soft(stringifyNumericProps(txRes.events)).to.deep.equal([
          {
            name: 'abax_contracts::lending_pool::events::StablecoinDebtRateChanged',
            args: {
              asset: stableAddress,
              debtRateE18: debtRateE18.toString(),
            },
          },
        ]);

        const reserveData = (await lendingPool.query.viewReserveData(stableAddress)).value.ok!;
        expect.soft(reserveData.currentDebtRateE18.toString()).to.deep.equal(debtRateE18.toString());
        expect.soft(reserveData.currentDepositRateE18.toString()).to.deep.equal('0');

        expect.flushSoft();
      });
    }
  });
});
