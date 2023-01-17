import chalk from 'chalk';
import { ChartConfiguration, ChartDataset, ScatterDataPoint } from 'chart.js';
import { saveBenchamrkData } from 'scripts/chartUtils/utils';
import { convertToCurrencyDecimals, getUserReserveDataWithTimestamp, mint } from 'tests/scenarios/utils/actions';
import { advanceBlockTimestamp, E6 } from 'tests/scenarios/utils/misc';
import { deployAndConfigureSystem } from 'tests/setup/deploymentHelpers';
import { apiProviderWrapper } from 'tests/setup/helpers';
import { createPushDataPoint, getBasicChartConfig, getColorFromName, logProgress } from './utils';

(async () => {
  if (require.main !== module) return;

  await apiProviderWrapper.getAndWaitForReady();
  console.log('Benchmark setup...');
  const {
    lendingPool,
    users: [supplier, borrower],
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
  await mint(reserveWETH, wethDepositAmount, supplier);
  await mint(reserveDAI, daiDepositAmount, borrower);
  await mint(reserveWETH, wethDepositAmount, borrower);
  const depositAmountInCurrency = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount);
  const wethAmountInCurrency = await convertToCurrencyDecimals(reserveWETH, wethDepositAmount);
  await reserveDAI.withSigner(supplier).tx.approve(lendingPool.address, depositAmountInCurrency);
  await reserveWETH.withSigner(supplier).tx.approve(lendingPool.address, wethAmountInCurrency);
  await reserveDAI.withSigner(borrower).tx.approve(lendingPool.address, depositAmountInCurrency);
  await reserveWETH.withSigner(borrower).tx.approve(lendingPool.address, wethAmountInCurrency);

  await lendingPool.withSigner(supplier).tx.deposit(reserveDAI.address, supplier.address, depositAmountInCurrency, []);

  await lendingPool.withSigner(borrower).tx.deposit(reserveWETH.address, borrower.address, wethAmountInCurrency, []);
  await lendingPool.withSigner(borrower).tx.setAsCollateral(reserveWETH.address, true);

  const amountToBorrowInCurrency = await convertToCurrencyDecimals(reserveDAI, daiDepositAmount * 0.7);

  await lendingPool.withSigner(borrower).query.borrow(reserveDAI.address, borrower.address, amountToBorrowInCurrency, [0]);
  await lendingPool.withSigner(borrower).tx.borrow(reserveDAI.address, borrower.address, amountToBorrowInCurrency, [0]);
  console.log('Running...');

  const dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>> = {
    utilizationRate: { data: [], backgroundColor: getColorFromName('utilizationRate') },
  };
  const dataSetsPointStorageCreator = createPushDataPoint(dataSets);
  for (let i = 0; i <= SAMPLE_SIZE; i++) {
    //Move to next data point
    await advanceBlockTimestamp(blockTimestampProvider, STEP);
    //Action
    // await lendingPool.query.accumulateInterest(reserveDAI.address);
    await lendingPool.tx.accumulateInterest(reserveDAI.address);
    // await lendingPool.query.accumulateUserInterest(reserveDAI.address, supplier.address);
    await lendingPool.tx.accumulateUserInterest(reserveDAI.address, supplier.address);
    // await lendingPool.query.accumulateUserInterest(reserveDAI.address, borrower.address);
    await lendingPool.tx.accumulateUserInterest(reserveDAI.address, borrower.address);

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

  const chartData = getBasicChartConfig(dataSets, "Idle deposit's variable interest in time");
  console.log('Plotting...');
  await saveBenchamrkData(chartData, dataSets, __filename);

  await (await apiProviderWrapper.getAndWaitForReady()).disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
