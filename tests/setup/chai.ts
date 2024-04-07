import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { AccountId } from '@polkadot/types/interfaces';
import BN from 'bn.js';
import { flush, proxy } from 'tests/soft-assert';
import '@c-forge/polkahat-chai-matchers';
import { bnToBn } from '@polkadot/util';
import deepEqual from 'deep-eql';
import util from 'util';
import { stringifyNumericProps } from '@c-forge/polkahat-chai-matchers';

const softExpect = proxy(chai.expect);

export interface ExpectStaticWithSoft extends Chai.ExpectStatic {
  soft: (val: any, message?: string) => Chai.Assertion;
  flushSoft: () => void;
  toBeDefined<T>(val: T): asserts val is NonNullable<T>;
  notToBeDefined(val: unknown): asserts val is undefined | null;
}
declare global {
  export namespace Chai {
    interface Assertion {
      output(value: AccountId | string | number | boolean | string[] | number[] | unknown, msg?: string): void;
      almostEqualOrEqualToInteger<TData extends BN | number | string>(expected: TData, intEpsilon?: string | number | BN): void;
      equalUpTo1Digit<TData extends BN | number | string>(expected: TData): void;
      almostDeepEqual<TData>(expected: TData): void;
    }
  }
}

chai.use(chaiAsPromised);

const almostEqualOrEqualToInteger = function <TData extends BN | number | string>(
  this: Chai.AssertionPrototype,
  actual: TData,
  expected: TData,
  intEpsilon: string | number | BN = 1,
) {
  // check if epsilon is integer
  if (typeof intEpsilon === 'string' && parseFloat(intEpsilon) % 1 !== 0) {
    throw new Error('Epsilon must be an integer');
  }
  if (typeof intEpsilon === 'number' && intEpsilon % 1 !== 0) {
    throw new Error('Epsilon must be an integer');
  }

  const actualValueBN = new BN(actual);
  const expectedValueBN = new BN(expected);
  const epsilonParsed = bnToBn(intEpsilon);

  const diff = actualValueBN.sub(expectedValueBN).abs();
  this.assert(
    diff.lte(epsilonParsed),
    `expected #{act} to be almost equal or equal #{exp} | diff: ${diff} | epsilon: ${epsilonParsed}`,
    `expected #{act} not to be almost equal or equal #{exp} | diff: ${diff} | epsilon: ${epsilonParsed}`,
    actualValueBN.toString(0),
    expectedValueBN.toString(0),
    true,
  );
};

const almostDeepEqual = function <TData extends { [index: string]: any } | undefined>(this: Chai.AssertionPrototype, actual: TData, expected: TData) {
  const comparator = (a: any, b: any): boolean | null => {
    const isComparableToString = (n: any) => {
      return typeof n === 'number' || typeof n === 'string' || (n && BN.isBN(n));
    };
    const isComparableToInteger = (n: any) => {
      return (typeof n === 'number' && n % 1 === 0) || (typeof n === 'string' && parseFloat(n) % 1 !== 0) || (n && BN.isBN(n));
    };

    try {
      if (isComparableToInteger(a) && isComparableToInteger(b)) {
        const actualValueBN = new BN(a);
        const expectedValueBN = new BN(b);
        // x + 1 >= y >= x -1
        return actualValueBN.addn(1).gte(expectedValueBN) && expectedValueBN.gte(actualValueBN.subn(1));
      }
      if (isComparableToString(a) && isComparableToString(b)) {
        return a.toString() === b.toString();
      }
      return null;
    } catch (e) {
      // use default comparator
      return null;
    }
  };
  // "ssfi" stands for "start stack function indicator", it's a chai concept
  // used to control which frames are included in the stack trace
  // this pattern here was taken from chai's implementation of .deep.equal
  this.assert(
    deepEqual(actual, expected, { comparator }),
    `expected #{act} to be almost equal or equal #{exp} (up to 1 digit) ${util.inspect(stringifyNumericProps(expected))} but got ${util.inspect(
      stringifyNumericProps(actual),
    )}`,
    `expected #{act} not to be almost equal or equal #{exp} (up to 1 digit) ${util.inspect(stringifyNumericProps(expected))} but got ${util.inspect(
      stringifyNumericProps(actual),
    )}`,
    actual,
    expected,
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
chai.use((c, utils) => {
  c.Assertion.addMethod(
    'almostEqualOrEqualToInteger',
    function (this: Chai.AssertionPrototype, expected: BN | number | string, intEpsilon: string | number | BN) {
      const actual = (expected as BN) ? <BN>this._obj : (expected as string) ? <string>this._obj : <number>this._obj;
      almostEqualOrEqualToInteger.apply(this, [expected, actual, intEpsilon]);
    },
  );
  c.Assertion.addMethod('equalUpTo1Digit', function (this: Chai.AssertionPrototype, expected: BN | number | string) {
    const actual = (expected as BN) ? <BN>this._obj : (expected as string) ? <string>this._obj : <number>this._obj;
    almostEqualOrEqualToInteger.apply(this, [actual, expected, 1]);
  });
  c.Assertion.addMethod('almostDeepEqual', function (this: Chai.AssertionPrototype, expected: any) {
    almostDeepEqual.apply(this, [expected, this._obj]);
  });
});

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined;
      }
      seen.add(value);
    }
    return value;
  };
};

chai.config.truncateThreshold = 0;
chai.use(
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('chai-formatter-monkeypatch')(function (obj) {
    return `:\n${JSON.stringify(obj, getCircularReplacer(), 2)}`;
  }),
);

const expectWithSoft = chai.expect as ExpectStaticWithSoft;
expectWithSoft.soft = function (val: any, message?: string) {
  return softExpect(val, message);
};
expectWithSoft.flushSoft = flush;

expectWithSoft.toBeDefined = function <T>(val: T | null): asserts val is NonNullable<T> {
  chai.assert(val !== null && val !== undefined, `expected ${val} not to be null or undefined`);
};
expectWithSoft.notToBeDefined = function (val: unknown): asserts val is undefined | null {
  chai.assert(val === null || val === undefined, `expected ${val} to be null or undefined`);
};

export const expect: ExpectStaticWithSoft = expectWithSoft;

export function assertExists<T>(maybe: T): asserts maybe is NonNullable<T> {
  if (maybe === null || maybe === undefined) throw new Error(`${maybe} doesn't exist`);
}
export function expectExists<T>(maybe: T): asserts maybe is NonNullable<T> {
  if (maybe === null || maybe === undefined) throw new Error(`${maybe} doesn't exist`);
}
