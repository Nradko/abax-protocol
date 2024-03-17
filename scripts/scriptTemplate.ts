import { getArgvObj } from 'wookashwackomytest-utils';
import chalk from 'chalk';

import { blake2AsHex, blake2AsU8a } from '@polkadot/util-crypto';

(async (args: Record<string, unknown>) => {
  if (require.main !== module) return;
  //code
  console.log('test');
  console.log(blake2AsHex('access_control::RoleGranted(u32,Option<AccountId>,Option<AccountId>)', 256));
  process.exit(0);
})(getArgvObj()).catch((e) => {
  console.log(e);
  console.error(chalk.red(JSON.stringify(e, null, 2)));
  process.exit(1);
});
