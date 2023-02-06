// import { BN } from 'bn.js';
// import { ChildProcess } from 'child_process';
// import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
// import { getUserReserveDataWithTimestamp, getTxTimestamp } from './scenarios/utils/actions';
// import { calcExpectedReserveDataAfterDeposit, calcExpectedUserDataAfterDeposit } from './scenarios/utils/calculations';
// import { TestEnv } from './scenarios/utils/make-suite';
// import { expect } from './setup/chai';
// import { apiProviderWrapper } from './setup/helpers';
// import { readContractsFromFile, restartAndRestoreNodeState } from './setup/nodePersistence';

// describe.skip('TEST-TEMPLATE', () => {
//   let testEnv: TestEnv;
//   let getContractsNodeProcess: () => ChildProcess | undefined = () => undefined;
//   after(async () => {
//     return await apiProviderWrapper.closeApi();
//   });
//   afterEach(async () => {
//     await apiProviderWrapper.closeApi();
//     getContractsNodeProcess()?.kill();
//   });
//   beforeEach(async () => {
//     getContractsNodeProcess = await restartAndRestoreNodeState(getContractsNodeProcess);
//     await apiProviderWrapper.getAndWaitForReady();
//     // testEnv = await deployAndConfigureSystem();
//     testEnv = await readContractsFromFile();
//   });

//   it('TEST_TITLE', async () => {
//     //Arrange
//     const depositAmount = new BN('1000');
//     const user = testEnv.users[0];
//     const reserve = testEnv.reserves['DAI'].underlying;
//     await reserve.tx.mint(user.address, depositAmount);
//     await reserve.withSigner(user).tx.approve(testEnv.lendingPool.address, depositAmount);

//     const { reserveData: reserveDataBefore, userReserveData: userDataBefore } = await getUserReserveDataWithTimestamp(
//       reserve,
//       user,
//       testEnv.lendingPool,
//       testEnv.blockTimestampProvider,
//     );

//     //Act
//     const tx = await testEnv.lendingPool.withSigner(user).tx.deposit(reserve.address, user.address, depositAmount, []);

//     //Assert
//     const { reserveData: reserveDataAfter, userReserveData: userDataAfter } = await getUserReserveDataWithTimestamp(
//       reserve,
//       user,
//       testEnv.lendingPool,
//       testEnv.blockTimestampProvider,
//     );
//     const { txTimestamp } = await getTxTimestamp(tx);
//     const expectedReserveData = calcExpectedReserveDataAfterDeposit(depositAmount, reserveDataBefore, txTimestamp);

//     const expectedUserReserveData = calcExpectedUserDataAfterDeposit(
//       depositAmount,
//       reserveDataBefore,
//       expectedReserveData,
//       userDataBefore,
//       txTimestamp,
//       txTimestamp,
//     );

//     // checks...
//   });
// });
