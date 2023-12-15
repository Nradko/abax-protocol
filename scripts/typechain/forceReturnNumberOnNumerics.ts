import fs from 'fs-extra';
import glob from 'glob';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';
import path from 'path';

const forceReturnNumberOnNumerics = (contractsRootPath: string, isDebug = false) => {
  const filesChanged: string[] = [];
  const paths = glob.sync(`${contractsRootPath}/**/*.ts`);
  for (const p of paths) {
    let hasTheFileGotChanged = false;
    const data = fs.readFileSync(p, 'utf8');
    let replaced = data.replace(/\: number/gm, () => {
      hasTheFileGotChanged = true;
      return `: ReturnNumber`;
    });
    if (isDebug) fs.writeFileSync(p + 'old', data, 'utf8');
    fs.writeFileSync(p, replaced, 'utf8');
    if (hasTheFileGotChanged) filesChanged.push(p);
  }
  return filesChanged;
};

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const typechainOutputPath = process.argv[2] ?? './typechain';
  const isDebug = 'debug' in args;
  console.log('Swapping handleReturnType calls for customHandleReturnType calls!');
  const typeReturnsPath = path.join(typechainOutputPath, 'types-returns');
  const filesChanged = forceReturnNumberOnNumerics(typeReturnsPath, isDebug);
  console.log('Finished!\n Changed files:', filesChanged);
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
