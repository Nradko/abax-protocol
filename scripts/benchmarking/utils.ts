import { ReturnNumber } from '@727-ventures/typechain-types';
import BN from 'bn.js';
import { ChartConfiguration, ChartDataset, ScatterDataPoint } from 'chart.js';
import { fromE12, fromE18 } from 'tests/scenarios/utils/misc';
import { ReserveData, UserReserveData } from 'typechain/types-returns/lending_pool';
import chroma from 'chroma-js';
import { isNil } from 'lodash';

export const seriesToMoveToSecondPlot: (keyof UserReserveData | keyof ReserveData)[] = ['currentSupplyRateE24', 'currentVariableBorrowRateE24'];
export type AnyReserveDataValueMutator = (val: any, reserveData: ReserveData) => number;
export const geUserReserveDataValueMutator = <TData extends UserReserveData, K extends Extract<keyof TData, string>>(
  seriesName: K,
): AnyReserveDataValueMutator => {
  switch (seriesName) {
    case 'supplied':
      return (val: UserReserveData['supplied'], reserveData: ReserveData) => val.rawNumber.div(reserveData.decimals.rawNumber).toNumber() / 10_000;
    case 'variableBorrowed':
      return (val: UserReserveData['variableBorrowed'], reserveData: ReserveData) =>
        val.rawNumber.div(reserveData.decimals.rawNumber).toNumber() / 10_000;
    case 'stableBorrowed':
      return (val: UserReserveData['stableBorrowed']) => fromE12(val.rawNumber);
    case 'appliedCumulativeSupplyRateIndexE18':
      return (val: UserReserveData['appliedCumulativeSupplyRateIndexE18']) => fromE12(val.rawNumber);
    case 'appliedCumulativeVariableBorrowRateIndexE18':
      return (val: UserReserveData['appliedCumulativeVariableBorrowRateIndexE18']) => fromE12(val.rawNumber);
    case 'stableBorrowRateE24':
      return (val: UserReserveData['stableBorrowRateE24']) => fromE18(val.rawNumber);
    case 'updateTimestamp':
      return (val: UserReserveData['updateTimestamp']) => val;
    case 'useAsCollateral':
      return (val: UserReserveData['useAsCollateral']) => (val ? 1 : 0);
    default:
      return (val: any) => parseFloat(val.toString());
  }
};
export const getReserveDataValueMutator = <K extends keyof ReserveData>(seriesName: K): AnyReserveDataValueMutator => {
  switch (seriesName) {
    case 'activated':
      return (val: ReserveData['activated']) => (val ? 1 : 0);
    case 'freezed':
      return (val: ReserveData['freezed']) => (val ? 1 : 0);
    case 'totalSupplied':
      return (val: ReserveData['totalSupplied']) => fromE12(val.rawNumber);
    case 'cumulativeSupplyRateIndexE18':
      return (val: ReserveData['cumulativeSupplyRateIndexE18']) => fromE12(val.rawNumber);
    case 'currentSupplyRateE24':
      return (val: ReserveData['currentSupplyRateE24']) => fromE18(val.rawNumber);
    case 'totalVariableBorrowed':
      return (val: ReserveData['totalVariableBorrowed']) => fromE12(val.rawNumber);
    case 'cumulativeVariableBorrowRateIndexE18':
      return (val: ReserveData['cumulativeVariableBorrowRateIndexE18']) => fromE12(val.rawNumber);
    case 'currentVariableBorrowRateE24':
      return (val: ReserveData['currentVariableBorrowRateE24']) => fromE18(val.rawNumber);
    case 'sumStableDebt':
      return (val: ReserveData['sumStableDebt']) => fromE12(val.rawNumber);
    case 'accumulatedStableBorrow':
      return (val: ReserveData['accumulatedStableBorrow']) => fromE12(val.rawNumber);
    case 'avarageStableRateE24':
      return (val: ReserveData['avarageStableRateE24']) => fromE18(val.rawNumber);
    case 'indexesUpdateTimestamp':
      return (val: ReserveData['indexesUpdateTimestamp']) => val;
    case 'stableRateBaseE24':
      return (val: ReserveData['stableRateBaseE24']) => fromE18(val.rawNumber);
    case 'incomeForSuppliersPartE6':
      return (val: ReserveData['incomeForSuppliersPartE6']) => fromE12(val.rawNumber);
    // case 'interestRateModel':
    //   return (val: ReserveData['interestRateModel']) => val;
    case 'decimals':
      return (val: ReserveData['decimals']) => fromE12(val.rawNumber);
    case 'maximumSupply':
      return (val: ReserveData['maximumSupply']) => fromE12(val.rawNumber);
    case 'maximumBorrowPowerPriceE8':
      return (val: ReserveData['maximumBorrowPowerPriceE8']) => fromE12(val.rawNumber);
    default:
      throw new Error('Unsupported chart value!');
  }
};

export const pushDataPoint = <TData extends UserReserveData | ReserveData, K extends keyof TData>(
  dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>>,
  reserveData: ReserveData,
  data: TData,
  seriesName: K,
  timestamp: number | ReturnNumber | BN,
) => {
  const value = data[seriesName];
  const valueMutator = isReserveData(data)
    ? getReserveDataValueMutator(seriesName as keyof ReserveData)
    : geUserReserveDataValueMutator(seriesName as keyof UserReserveData);
  const dataSetKey = seriesName.toString();
  if (!dataSets[dataSetKey]) dataSets[dataSetKey] = { data: [], backgroundColor: getColorFromName(dataSetKey) };

  dataSets[dataSetKey].data.push({
    x: typeof timestamp === 'number' ? timestamp : timestamp.toNumber(),
    y: valueMutator(value, reserveData),
  });
};

export const createPushDataPoint =
  (dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>>) =>
  (reserveData: ReserveData, timestamp: number | ReturnNumber | BN) =>
  <TData extends UserReserveData | ReserveData, K extends keyof TData>(data: TData, seriesName: K) =>
    pushDataPoint(dataSets, reserveData, data, seriesName, timestamp);

export const isReserveData = (data: ReserveData | UserReserveData): data is ReserveData => {
  return (data as ReserveData).interestRateModel !== undefined;
};

export const isUserReserveData = (data: ReserveData | UserReserveData): data is UserReserveData => {
  return (data as UserReserveData).useAsCollateral !== undefined;
};

export const logProgress = (total: number, current: number) => {
  const currentProgress = (current * 100) / total;
  if (currentProgress !== 0 && currentProgress % 5 === 0) {
    console.log(`${currentProgress}% done... (${current} out of ${total} data points)`);
  }
};

export const measureTime = async <T>(sampleSize: number, markId: string, benchmarkFunc: () => Promise<T>) => {
  console.log('Starting benchmarking func...');
  const start = Date.now();
  for (let i = 0; i <= sampleSize; i++) {
    await benchmarkFunc();
    // logProgress(i, sampleSize);
  }
  const end = Date.now();

  return { name: markId, start, end, duration: end - start };
};

export const measureTime2 = async <T>(sampleSize: number, markId: string, benchmarkFunc: () => Promise<T>) => {
  console.log('Starting benchmarking func...');
  const start = Date.now();
  for (let i = 0; i <= sampleSize; i++) {
    await benchmarkFunc();
    // logProgress(i, sampleSize);
  }
  const end = Date.now();

  return { name: markId, start, end, duration: end - start };
};

const colorsWithUsedNames = chroma
  .scale(['aqua', 'black', 'blue', 'fuchsia', 'gray', 'green', 'lime', 'maroon', 'navy', 'olive', 'purple', 'red', 'silver', 'teal', 'yellow'])
  .mode('lch')
  .colors(20)
  .map((c) => ({ color: c, name: null } as { color: string; name: null | string }));

export const getColorFromName = (name: string) => {
  const existingColorAssociatedWithName = colorsWithUsedNames.find((cn) => cn.name === name);
  if (existingColorAssociatedWithName) return existingColorAssociatedWithName.color;
  const firstUnusedColorIndex = colorsWithUsedNames.findIndex((cn) => isNil(cn.name));
  if (firstUnusedColorIndex === -1) throw new Error('Not enough colors! All already used!');
  colorsWithUsedNames[firstUnusedColorIndex].name = name;
  return colorsWithUsedNames[firstUnusedColorIndex].color;
};

export function getBasicChartConfig(
  dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>>,
  title: string,
): ChartConfiguration<'line', (number | ScatterDataPoint | null)[], unknown> {
  return {
    type: 'line',
    data: {
      datasets: Object.entries(dataSets)
        .filter(([_, dataSet]) => dataSet.data.length > 0)
        .map(([label, dataSet]) => ({ label, data: dataSet.data, backgroundColor: dataSet.backgroundColor })),
    },
    options: {
      scales: {
        x: {
          bounds: 'data',
          title: { text: 'timestamp' },
          type: 'linear',
          position: 'bottom',
          ticks: {
            callback: (tVal) => new Date(tVal).toISOString().replace('.000Z', ''),
          },
        },
      },
      plugins: {
        title: {
          text: title,
          display: true,
        },
        subtitle: {
          text: `${Object.values(dataSets)[0].data.length} data points`,
          display: true,
        },
      },
    },
  };
}
