import fs from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { getArgvObj } from '@abaxfinance/utils';
import chalk from 'chalk';

const cleanUpDuplicateTypes = (contractsRootPath: string) => {
  const paths = glob.sync(`${contractsRootPath}/types-returns/*.ts`);
  for (const p of paths) {
    const data = fs.readFileSync(p, 'utf8');
    const typeRegex = /^(export (type|interface|enum|class) [\s\|\S]*?}(;|\n\n|\n)?)/gm;

    // Find all type declarations
    const matches = data.match(typeRegex);

    if (matches) {
      // Store unique declarations
      const uniqueTypes = new Set<string>();

      matches.forEach((type) => {
        // Using the type declaration as the key ensures uniqueness
        uniqueTypes.add(type);
      });

      // Reconstruct the file content without duplicates
      const cleanedData = Array.from(uniqueTypes).join('\n\n');

      // Write the cleaned content to a new file
      console.log(p, cleanedData.length);
      fs.writeFileSync(p, cleanedData, 'utf8');
    }
  }
};

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  const typechainOutputPath = process.argv[2] ?? './typechain';
  cleanUpDuplicateTypes(typechainOutputPath);

  console.log('Finished!');
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(0);
});
