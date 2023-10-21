import { BN } from 'bn.js';

export function toE18String(num: number): string {
  let bnum = new BN('1000000000000000000');
  bnum = bnum.muln(num);
  return bnum.toString();
}
