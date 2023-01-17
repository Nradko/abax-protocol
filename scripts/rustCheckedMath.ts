import { argvObj } from './compile/common';
import chalk from 'chalk';
import glob from 'glob';
import fs from 'fs-extra';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const contractsRootPath = '.';
  const filesChanged: string[] = [];
  let subUnderflowCounter = 1;
  // let mulOverflowCounter = 4;
  let addOverflowCounter = 5;
  //code
  const paths = glob.sync(`${contractsRootPath}/**/*.rs`);
  for (const p of paths) {
    let hasTheFileGotChanged = false;
    const data = fs.readFileSync(p, 'utf8');
    const replacedSub = data.replace(/(.*) -= (.*);/gm, (match, p1, p2) => {
      const valueToInsert = `${p1} = u128::try_from(checked_math!(${p1.trim()} - ${p2}).ok_or(LendingPoolError::MathError)?;`;
      hasTheFileGotChanged = true;
      subUnderflowCounter += 1;
      return valueToInsert;
    });
    const replacedAdd = replacedSub.replace(/(.*) \+= (.*);/gm, (match, p1, p2) => {
      const valueToInsert = `${p1} = u128::try_from(checked_math!(${p1.trim()} + ${p2}).ok_or(LendingPoolError::MathError)?;`;
      hasTheFileGotChanged = true;
      addOverflowCounter += 1;
      return valueToInsert;
    });

    fs.writeFileSync(p, replacedAdd, 'utf8');
    if (hasTheFileGotChanged) filesChanged.push(p);
  }
  console.log(filesChanged);
  process.exit(0);
})(argvObj).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
