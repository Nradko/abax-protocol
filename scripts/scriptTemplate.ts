import { argvObj } from './compile/common';
import chalk from 'chalk';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  //code
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
