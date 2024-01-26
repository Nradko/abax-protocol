import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';

const REPLACE_REGEX = /import \{ ContractAbi \} from '\.\.\/contract-info\/([^']+)';/g;

const replaceABIImportPaths = (contractsRootPath: string) => {
  const paths = glob.sync(`${contractsRootPath}/*.ts`);
  for (const p of paths) {
    const data = fs.readFileSync(p, 'utf8');
    const replaced = data.replace(REPLACE_REGEX, "import ContractAbi from 'artifacts/$1.json'");
    fs.writeFileSync(p, replaced, 'utf8');
  }
};

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const typechainOutputPath = process.argv[2] ?? './typechain';
  const contractPaths = path.join(typechainOutputPath, 'contracts');
  replaceABIImportPaths(contractPaths);

  console.log('Finished!');
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
