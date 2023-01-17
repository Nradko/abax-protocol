import chalk from 'chalk';
import glob from 'glob';
import fs from 'fs-extra';

(async () => {
  if (require.main !== module) return;
  const contractsRootPath = '.';
  const filesChanged: string[] = [];
  //code
  const paths = glob.sync(`${contractsRootPath}/**/*.rs`);
  for (const p of paths) {
    let hasTheFileGotChanged = false;
    const data = fs.readFileSync(p, 'utf8');
    const replaced = data.replace(/(.*use .*{(?:\n|.)*)use /gm, (match, p1) => {
      const valueToInsert = match.replace(p1, `/* jscpd:ignore-start */\n${p1}\n/* jscpd:ignore-end */\n`);
      hasTheFileGotChanged = true;
      return valueToInsert;
    });

    fs.writeFileSync(p, replaced, 'utf8');
    if (hasTheFileGotChanged) filesChanged.push(p);
  }
  console.log(filesChanged);
  process.exit(0);
})().catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
