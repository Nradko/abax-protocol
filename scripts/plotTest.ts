import chalk from 'chalk';
import { ChartConfiguration } from 'chart.js';
import { ChartCallback, ChartJSNodeCanvas } from 'chartjs-node-canvas';
import fs from 'fs-extra';
import path from 'path';

const saveDataAsJson = async (data) => {
  await fs.writeJSON(path.join(__dirname, 'output_json.json'), data);
};

const saveDataAsPlot = async (configuration: ChartConfiguration) => {
  const width = 1000;
  const height = 800;
  const chartCallback: ChartCallback = (ChartJS) => {
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  };
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, chartCallback, backgroundColour: 'white' });
  const buffer = await chartJSNodeCanvas.renderToBuffer(configuration);
  await fs.writeFile(path.join(__dirname, 'output_plot.png'), buffer, 'base64');
};

(async () => {
  if (require.main !== module) return;

  const config: ChartConfiguration = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Scatter Dataset',
          data: [
            {
              x: -10,
              y: 0,
            },
            {
              x: 0,
              y: 10,
            },
            {
              x: 10,
              y: 5,
            },
            {
              x: 0.5,
              y: 5.5,
            },
          ],
          backgroundColor: 'rgb(255, 99, 132)',
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
        },
      },
    },
  };
  await saveDataAsPlot(config);
  await saveDataAsJson([1, 2, 34]);
  console.log('done');
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
