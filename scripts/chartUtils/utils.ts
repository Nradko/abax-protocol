import { ChartConfiguration, ScatterDataPoint, ChartDataset, ChartOptions } from 'chart.js';
import chalk from 'chalk';
import { ChartCallback, ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs-extra';
import path from 'path';
import { parseAsync } from 'json2csv';
import { zip } from 'lodash';
import { seriesToMoveToSecondPlot } from 'scripts/benchmarking/utils';

export const saveBenchamrkData = async (
  chartData: ChartConfiguration<'line'>,
  dataSets: Record<string, ChartDataset<'line', ScatterDataPoint[]>>,
  benchmarkSourceFilePath: string,
) => {
  const parsedBenchmarkSourceFilePath = path.parse(benchmarkSourceFilePath);
  const outputFilePath = path.join(parsedBenchmarkSourceFilePath.dir, 'output');
  fs.ensureDirSync(outputFilePath);
  const dataSetsEntries = Object.entries(dataSets);
  const labels = dataSetsEntries.map((dse) => dse[0]);
  const maybeXAxisLabel = chartData.options?.scales?.x?.title?.text;
  const xAxisLabel = maybeXAxisLabel ? (typeof maybeXAxisLabel === 'string' ? maybeXAxisLabel : maybeXAxisLabel.join('_')) : 'x-axis';
  const values = dataSetsEntries.map((dse) => dse[1]);
  const csvDataSet3 = values[0].data.map(
    (_, idx) =>
      Object.fromEntries([...labels.map((__, i) => [labels[i], values[i].data[idx].y]), [xAxisLabel, values[0].data[idx].x]]) as Record<
        string,
        ScatterDataPoint
      >,
  );

  await saveDataAsJson(csvDataSet3, outputFilePath, parsedBenchmarkSourceFilePath.name);
  await saveDataAsCsv(csvDataSet3, outputFilePath, parsedBenchmarkSourceFilePath.name);

  const dataSplit1: ChartConfiguration<'line'> = {
    ...chartData,
    data: { ...chartData.data, datasets: chartData.data.datasets.filter((ds) => ds.label && !seriesToMoveToSecondPlot.includes(ds.label as any)) },
  };

  const dataSplit2: ChartConfiguration<'line'> = {
    ...chartData,
    data: { ...chartData.data, datasets: chartData.data.datasets.filter((ds) => ds.label && seriesToMoveToSecondPlot.includes(ds.label as any)) },
    options: {
      ...chartData.options,
      scales: {
        ...chartData.options?.scales,
        y: {
          ...(chartData.options?.scales?.y ?? {}),
          type: 'logarithmic',
        },
      },
    } as ChartOptions<'line'>,
  };
  await saveDataAsPlot(dataSplit1, outputFilePath, `${parsedBenchmarkSourceFilePath.name}_1`);
  await saveDataAsPlot(dataSplit2, outputFilePath, `${parsedBenchmarkSourceFilePath.name}_2`);
};

export const saveDataAsJson = async (data: any, filePath: string, name: string) => {
  await fs.writeJSON(path.join(filePath, `${name}.json`), data);
};

export const saveDataAsCsv = async (data: Record<string, unknown>[], filePath: string, name: string) => {
  const fileContent = await parseAsync(data, { fields: Object.keys(data[0]) });
  await fs.writeFile(path.join(filePath, `${name}.csv`), fileContent);
};

export const saveDataAsPlot = async (configuration: ChartConfiguration, filePath: string, name: string) => {
  const width = 1920;
  const height = 1200;
  const chartCallback: ChartCallback = (ChartJS) => {
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  };
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback, backgroundColour: 'white' });
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  await fs.writeFile(path.join(filePath, `${name}_plot.png`), buffer, 'base64');
};

export const CHART_COLORS = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)',
  black: 'rgb(0, 0, 0)',
};
