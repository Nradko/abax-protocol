import chalk from 'chalk';
import { ChartConfiguration, ChartDataset, ScatterDataPoint } from 'chart.js';
import { saveBenchamrkData } from 'scripts/chartUtils/utils';
import { convertToCurrencyDecimals, getUserReserveDataWithTimestamp, mint } from 'tests/scenarios/utils/actions';
import { advanceBlockTimestamp, E6 } from 'tests/scenarios/utils/misc';
import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { createPushDataPoint, getBasicChartConfig, getColorFromName, logProgress } from './utils';
import LendingPool from 'typechain/contracts/lending_pool';
import { AccountId } from 'typechain/types-arguments/lending_pool';

const getAmountToRepay = async (desiredUtilizationRate: number, reserveAddress: AccountId, lendingPool: LendingPool) => {
  const { value: reserveData } = await lendingPool.query.viewReserveData(reserveAddress);
  const totalDebt = reserveData.sumStableDebt.rawNumber
    .add(reserveData.accumulatedStableBorrow.rawNumber)
    .add(reserveData.totalVariableBorrowed.rawNumber);

  return totalDebt.sub(reserveData.totalSupplied.rawNumber.muln(desiredUtilizationRate));
};

(async () => {
  if (require.main !== module) return;

  await apiProviderWrapper.getAndWaitForReady();
  console.log('Benchmark setup...');
  const {
    lendingPool,
    users: [supplier, borrower, borrower2, borrower3],
    blockTimestampProvider,
    reserves,
  } = await deployAndConfigureSystem();
  const reserveDAI = reserves['DAI'].underlying;
  const reserveWETH = reserves['WETH'].underlying;

  const SAMPLE_SIZE = 365 * 2; // 2 years;
  const minimumPeriod = (await apiProviderWrapper.getAndWaitForReady()).consts.timestamp.minimumPeriod; // ~5
  const STEP = 1000 * 60 * 60 * 24; // a day
  //Setup
  const daiDepositAmount = 10_000;
  const wethDepositAmount = 100;

  await mint(reserveDAI, daiDepositAmount, supplier);
  await mint(reserveDAI, daiDepositAmount, borrower);
  await mint(reserveDAI, daiDepositAmount, borrower2);
  await mint(reserveDAI, daiDepositAmount, borrower3);
  const borrowersRepayAmountInCurrency = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount);
  await reserveDAI.withSigner(borrower).tx.approve(lendingPool.address, borrowersRepayAmountInCurrency);
  await reserveDAI.withSigner(borrower2).tx.approve(lendingPool.address, borrowersRepayAmountInCurrency);
  await reserveDAI.withSigner(borrower3).tx.approve(lendingPool.address, borrowersRepayAmountInCurrency);

  const depositAmountInCurrency = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount);
  await reserveDAI.withSigner(supplier).tx.approve(lendingPool.address, depositAmountInCurrency);
  await lendingPool.withSigner(supplier).tx.deposit(reserveDAI.address, supplier.address, depositAmountInCurrency, []);

  await mint(reserveWETH, wethDepositAmount, borrower);
  const wethAmountInCurrency = await convertToCurrencyDecimals(reserveWETH, wethDepositAmount);
  await reserveWETH.withSigner(borrower).tx.approve(lendingPool.address, wethAmountInCurrency);
  await lendingPool.withSigner(borrower).tx.deposit(reserveWETH.address, borrower.address, wethAmountInCurrency, []);
  await lendingPool.withSigner(borrower).tx.setAsCollateral(reserveWETH.address, true);
  const amountToBorrowInCurrency = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount * 0.4);
  await lendingPool.withSigner(borrower).tx.borrow(reserveDAI.address, borrower.address, amountToBorrowInCurrency, [0]);

  await mint(reserveWETH, wethDepositAmount, borrower2);
  await reserveWETH.withSigner(borrower2).tx.approve(lendingPool.address, wethAmountInCurrency);
  await lendingPool.withSigner(borrower2).tx.deposit(reserveWETH.address, borrower2.address, wethAmountInCurrency, []);
  await lendingPool.withSigner(borrower2).tx.setAsCollateral(reserveWETH.address, true);
  const amountToBorrowInCurrency2 = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount * 0.35);

  await mint(reserveWETH, wethDepositAmount, borrower3);
  await reserveWETH.withSigner(borrower3).tx.approve(lendingPool.address, wethAmountInCurrency);
  await lendingPool.withSigner(borrower3).tx.deposit(reserveWETH.address, borrower3.address, wethAmountInCurrency, []);
  await lendingPool.withSigner(borrower3).tx.setAsCollateral(reserveWETH.address, true);
  const amountToBorrowInCurrency3 = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount * 0.2);
  console.log('Running...');

  const dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>> = {
    utilizationRate: { data: [], backgroundColor: getColorFromName('utilizationRate') },
  };
  const dataSetsPointStorageCreator = createPushDataPoint(dataSets);

  const inflectionPoint1 = Math.floor((SAMPLE_SIZE * 2) / 9);
  const inflectionPoint2 = Math.floor((SAMPLE_SIZE * 4) / 9);
  const inflectionPoint3 = inflectionPoint2 + 20; //simulating 20 days of 95+ usage
  for (let i = 0; i <= SAMPLE_SIZE; i++) {
    //Move to next data point
    await advanceBlockTimestamp(blockTimestampProvider, STEP);
    //Action
    if (i === inflectionPoint1) {
      await lendingPool.withSigner(borrower2).query.borrow(reserveDAI.address, borrower2.address, amountToBorrowInCurrency2, [0]);
      await lendingPool.withSigner(borrower2).tx.borrow(reserveDAI.address, borrower2.address, amountToBorrowInCurrency2, [0]);
    } else if (i === inflectionPoint2) {
      await lendingPool.withSigner(borrower3).query.borrow(reserveDAI.address, borrower3.address, amountToBorrowInCurrency3, [0]);
      await lendingPool.withSigner(borrower3).tx.borrow(reserveDAI.address, borrower3.address, amountToBorrowInCurrency3, [0]);
    } else if (i === inflectionPoint3) {
      await lendingPool.withSigner(borrower3).query.repay(reserveDAI.address, borrower3.address, amountToBorrowInCurrency3, [1]);
      await lendingPool.withSigner(borrower3).tx.repay(reserveDAI.address, borrower3.address, amountToBorrowInCurrency3, [1]);
      await lendingPool.withSigner(borrower2).query.repay(reserveDAI.address, borrower2.address, amountToBorrowInCurrency2, [1]);
      await lendingPool.withSigner(borrower2).tx.repay(reserveDAI.address, borrower2.address, amountToBorrowInCurrency2, [1]);
      const amountToRepay = await getAmountToRepay(0.3, reserveDAI.address, lendingPool);
      await lendingPool.withSigner(borrower).query.repay(reserveDAI.address, borrower.address, amountToRepay, [1]);
      await lendingPool.withSigner(borrower).tx.repay(reserveDAI.address, borrower.address, amountToRepay, [1]);
    } else {
      // await lendingPool.query.accumulateInterest(reserveDAI.address);
      await lendingPool.tx.accumulateInterest(reserveDAI.address);
      // await lendingPool.query.accumulateUserInterest(reserveDAI.address, supplier.address);
      await lendingPool.tx.accumulateUserInterest(reserveDAI.address, supplier.address);
      // await lendingPool.query.accumulateUserInterest(reserveDAI.address, borrower.address);
      await lendingPool.tx.accumulateUserInterest(reserveDAI.address, borrower.address);
    }

    //Data retrieval
    const { timestamp, reserveData, userData } = await getUserReserveDataWithTimestamp(reserveDAI, supplier, lendingPool, blockTimestampProvider);
    const { userReserveData: borrowerUserData } = await getUserReserveDataWithTimestamp(reserveDAI, borrower, lendingPool, blockTimestampProvider);
    const timestampNum = timestamp.toNumber();
    const normalizeAndPushPoint = dataSetsPointStorageCreator(reserveData, timestamp);
    normalizeAndPushPoint(userData, 'appliedCumulativeSupplyRateIndexE18');
    normalizeAndPushPoint(reserveData, 'cumulativeSupplyRateIndexE18');
    normalizeAndPushPoint(reserveData, 'currentSupplyRateE24');
    normalizeAndPushPoint(borrowerUserData, 'variableBorrowed');
    normalizeAndPushPoint(reserveData, 'currentVariableBorrowRateE24');
    normalizeAndPushPoint(reserveData, 'cumulativeVariableBorrowRateIndexE18');

    const totalDebt = reserveData.sumStableDebt.rawNumber
      .add(reserveData.accumulatedStableBorrow.rawNumber)
      .add(reserveData.totalVariableBorrowed.rawNumber);
    const utilizationRate = totalDebt.muln(E6).div(reserveData.totalSupplied.rawNumber).toNumber() / E6;
    dataSets.utilizationRate.data.push({ x: timestampNum, y: utilizationRate });
    logProgress(SAMPLE_SIZE, i);
  }

  const chartData = getBasicChartConfig(dataSets, 'Reactivity to different reserve utilization levels (40% => 75% => 95% => 30%)');
  console.log('Plotting...');
  await saveBenchamrkData(chartData, dataSets, __filename);

  await (await apiProviderWrapper.getAndWaitForReady()).disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
