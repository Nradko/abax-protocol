import { ReturnNumber } from '@727-ventures/typechain-types';
import { fromE12, fromE18 } from '@abaxfinance/utils';
import BN from 'bn.js';
import { ChartConfiguration, ChartDataset, ScatterDataPoint } from 'chart.js';
import chroma from 'chroma-js';
import { isNil } from 'lodash';
import { ReserveData, UserReserveData } from 'typechain/types-returns/lending_pool';

export const seriesToMoveToSecondPlot: (keyof UserReserveData | keyof ReserveData)[] = ['currentDepositRateE24', 'currentDebtRateE24'];
export type AnyReserveDataValueMutator = (val: any, reserveData: ReserveData) => number;
export const geUserReserveDataValueMutator = <TData extends UserReserveData, K extends Extract<keyof TData, string>>(
  seriesName: K,
): AnyReserveDataValueMutator => {
  switch (seriesName) {
    case 'supplied':
      return (val: UserReserveData['supplied'], reserveData: ReserveData) => val.rawNumber.div(reserveData.decimals.rawNumber).toNumber() / 10_000;
    case 'debt':
      return (val: UserReserveData['debt'], reserveData: ReserveData) => val.rawNumber.div(reserveData.decimals.rawNumber).toNumber() / 10_000;
    case 'appliedCumulativeDepositRateIndexE18':
      return (val: UserReserveData['appliedCumulativeDepositRateIndexE18']) => fromE12(val.rawNumber);
    case 'appliedCumulativeDebtRateIndexE18':
      return (val: UserReserveData['appliedCumulativeDebtRateIndexE18']) => fromE12(val.rawNumber);
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
    case 'cumulativeDepositIndexE18':
      return (val: ReserveData['cumulativeDepositIndexE18']) => fromE12(val.rawNumber);
    case 'currentDepositRateE24':
      return (val: ReserveData['currentDepositRateE24']) => fromE18(val.rawNumber);
    case 'totalDebt':
      return (val: ReserveData['totalDebt']) => fromE12(val.rawNumber);
    case 'cumulativeDebtIndexE18':
      return (val: ReserveData['cumulativeDebtIndexE18']) => fromE12(val.rawNumber);
    case 'currentDebtRateE24':
      return (val: ReserveData['currentDebtRateE24']) => fromE18(val.rawNumber);
    case 'indexesUpdateTimestamp':
      return (val: ReserveData['indexesUpdateTimestamp']) => val;
    case 'incomeForSuppliersPartE6':
      return (val: ReserveData['incomeForSuppliersPartE6']) => fromE12(val.rawNumber);
    // case 'interestRateModel':
    //   return (val: ReserveData['interestRateModel']) => val;
    case 'decimals':
      return (val: ReserveData['decimals']) => fromE12(val.rawNumber);
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
  return (data as UserReserveData).appliedCumulativeDebtRateIndexE18 !== undefined;
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
