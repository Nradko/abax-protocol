// import { ChildProcess } from 'child_process';
// import { deployAndConfigureSystem, DeploymentConfig } from 'tests/setup/deploymentHelpers';
// import { makeSuite, TestEnv } from './scenarios/utils/make-suite';
// import { E6, E8 } from './scenarios/utils/misc';
// import { expect } from './setup/chai';
// import { apiProviderWrapper, getSigners, getSignersWithoutOwner } from './setup/helpers';
// import { restartAndRestoreNodeState, sleep, waitFor } from './setup/nodePersistence';
// import { Keypair } from '@polkadot/util-crypto/types';
// import PSP22Emitable from 'typechain/contracts/psp22_emitable';
// import LendingPoolContract from '../typechain/contracts/lending_pool';
// import BlockTimestampProvider from '../typechain/contracts/block_timestamp_provider';
// import { KeyringPair } from '@polkadot/keyring/types';
// import BN from 'bn.js';

// makeSuite('Testing protocol income', () => {
//   let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
//   after(async () => {
//     return await apiProviderWrapper.closeApi();
//   });
//   before(async () => {
//     getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
//     await apiProviderWrapper.getAndWaitForReady();
//   });

//   const feesD6 = [0, 100000];
//   for (const feeD6 of feesD6) {
//     describe(`USDC is going to be used as collateral. USDA is going to be borrowed and has feeE6 = ${feeD6}. And ...
//     1 milion of USDA is supplied by user1 and 1 milion of USDC is supplied by user2. Then ...`, () => {
//       let testEnv: TestEnv;
//       let user1: KeyringPair;
//       let user2: KeyringPair;
//       let user3: KeyringPair;
//       let lendingPool: LendingPoolContract;
//       let usdcContract: PSP22Emitable;
//       let usdaContract: PSP22Emitable;
//       let blockTimestampProvider: BlockTimestampProvider;
//       let millionUsda: BN;
//       let millionUsdc: BN;
//       const MIN100 = 10000 * 1000;

//       beforeEach('setup Env', async () => {
//         const customDeploymentConfig: Partial<DeploymentConfig> = {
//           testReserveTokensToDeploy: [
//             {
//               decimals: 6,
//               feeD6: 0,
//               name: 'USDC',
//               stableBaseRate: 0,
//               flashLoanFeeE6: 0,
//               collateralCoefficient: 1,
//               borrowCoefficient: 1,
//             },
//             {
//               decimals: 8,
//               feeD6: feeD6,
//               name: 'USDA',
//               stableBaseRate: 0,
//               flashLoanFeeE6: 0,
//               collateralCoefficient: 1,
//               borrowCoefficient: 1,
//             },
//           ],
//           priceOverridesE8: { USDC: E8, USDA: E8 },
//           shouldUseMockTimestamp: true,
//           owner: getSigners()[0],
//           users: getSignersWithoutOwner(getSigners(), 0),
//         };
//         testEnv = await deployAndConfigureSystem(customDeploymentConfig);
//         millionUsda = new BN(10).pow(new BN(6 + testEnv.reserves['USDA'].decimals));
//         millionUsdc = new BN(10).pow(new BN(6 + testEnv.reserves['USDC'].decimals));
//         lendingPool = testEnv.lendingPool;
//         blockTimestampProvider = testEnv.blockTimestampProvider;
//         user1 = testEnv.users[0];
//         user2 = testEnv.users[1];
//         user3 = testEnv.users[2];
//         usdcContract = testEnv.reserves['USDC'].underlying;
//         usdaContract = testEnv.reserves['USDA'].underlying;

//         await usdaContract.tx.mint(user1.address, millionUsda);
//         await usdaContract.withSigner(user1).tx.approve(lendingPool.address, millionUsda);
//         await lendingPool.withSigner(user1).tx.deposit(usdaContract.address, user1.address, millionUsda, []);
//         await usdcContract.tx.mint(user2.address, millionUsdc);
//         await usdcContract.withSigner(user2).tx.approve(lendingPool.address, millionUsdc);
//         await lendingPool.withSigner(user2).tx.deposit(usdcContract.address, user2.address, millionUsdc, []);
//       });

//       describe(' Then 10000 seconds passes and reserves are updated. Then ... ', () => {
//         beforeEach('', async () => {
//           await blockTimestampProvider.tx.increaseBlockTimestamp(MIN100);
//           await lendingPool.tx.accumulateInterest(usdaContract.address);
//           await lendingPool.tx.accumulateInterest(usdcContract.address);
//         });

//         it('ViewProtocolIncome should return 0 for USDC', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.flushSoft();
//         });

//         it('ViewProtocolIncome should return 0 for USDA', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdaContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN('0').toString());
//           expect.flushSoft();
//         });

//         it('ViewProtocolIncome should return [0,0] for [USDC,USDA]', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, usdaContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.soft(res[1][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[1][1].toString()).to.equal(new BN('0').toString());
//           expect.flushSoft();
//         });

//         it('ViewProtocolIncome should return [0,0] for []', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, usdaContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.soft(res[1][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[1][1].toString()).to.equal(new BN('0').toString());
//           expect.flushSoft();
//         });
//       });

//       describe.only(`User2 borrows 0.5 milion of USDA against his USDC. And ...
//       10000 seconds passes and reserves are updated. Then ... `, () => {
//         beforeEach('', async () => {
//           await lendingPool.withSigner(user2).tx.setAsCollateral(usdcContract.address, true);
//           await lendingPool.withSigner(user2).tx.borrow(usdaContract.address, user2.address, millionUsda.divn(2), [0]);
//           await blockTimestampProvider.tx.increaseBlockTimestamp(MIN100);
//           await lendingPool.query.accumulateInterest(usdaContract.address);
//           await lendingPool.query.accumulateInterest(usdcContract.address);
//           await lendingPool.tx.accumulateInterest(usdaContract.address);
//           await lendingPool.tx.accumulateInterest(usdcContract.address);
//         });

//         it('ViewProtocolIncome should return 0 for USDC', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.flushSoft();
//         });

//         it.only('ViewProtocolIncome should return X for USDA', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdaContract.address])).value;
//           await lendingPool.tx.viewProtocolIncome([usdaContract.address]);
//           expect.soft(res[0][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.flushSoft();
//         });

//         it('ViewProtocolIncome should return [0,X] for [USDC,USDA]', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, usdaContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.soft(res[1][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[1][1].toString()).to.equal(new BN(0).toString());
//           expect.flushSoft();
//         });

//         it('ViewProtocolIncome should return [0,X] for []', async () => {
//           const res = (await lendingPool.query.viewProtocolIncome([usdcContract.address, usdaContract.address])).value;
//           expect.soft(res[0][0].toString()).to.equal(usdcContract.address);
//           expect.soft(res[0][1].toString()).to.equal(new BN(0).toString());
//           expect.soft(res[1][0].toString()).to.equal(usdaContract.address);
//           expect.soft(res[1][1].toString()).to.equal(new BN(0).toString());
//           expect.flushSoft();
//         });

//         // it('TakeProtocolIncome should fail for not an owner', async () => {
//         //   await lendingPool.withSigner(user1).takeProtocolIncome([],user1);
//         // });

//         // it('TakeProtocolIncome should succed for an owner and transfer tokens X of USDA to the user3', async () => {
//         //   await lendingPool.withSigner(owner).takeProtocolIncome([], user3);

//         //   expect.flushSoft();
//         // });
//       });
//     });
//   }
// });
