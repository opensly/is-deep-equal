import { deepEqualCore } from './deep-equal-core';

describe('compareIterables (Set comparison via deepEqualCore)', () => {
  // Helper to call compareIterables via deepEqualCore
  const defaultOptions = {
    maxDepth: 10,
    checkPrototypes: true,
    nanEqual: true,
    strictZero: false,
  } as any;

  function callCompareIterables(a: Set<any>, b: Set<any>, options = defaultOptions) {
    // Use deepEqualCore, which will call compareIterables for Sets
    return deepEqualCore(a, b, options, new WeakMap(), 0);
  }

  it('returns true for two empty sets', () => {
    expect(callCompareIterables(new Set(), new Set())).toBe(true);
  });

  it('returns true for sets with same primitives', () => {
    expect(callCompareIterables(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true);
  });

  it('returns false for sets with different sizes', () => {
    expect(callCompareIterables(new Set([1, 2]), new Set([1, 2, 3]))).toBe(false);
  });

  it('returns false for sets with different elements', () => {
    expect(callCompareIterables(new Set([1, 2, 3]), new Set([4, 5, 6]))).toBe(false);
  });

  it('returns true for sets with deeply equal objects', () => {
    const a = new Set([{ x: 1 }, { y: 2 }]);
    const b = new Set([{ y: 2 }, { x: 1 }]);
    expect(callCompareIterables(a, b)).toBe(true);
  });

  it('returns false for sets with objects that are not deeply equal', () => {
    const a = new Set([{ x: 1 }, { y: 2 }]);
    const b = new Set([{ x: 1 }, { y: 3 }]);
    expect(callCompareIterables(a, b)).toBe(false);
  });

  it('returns true for sets with NaN values', () => {
    expect(callCompareIterables(new Set([NaN]), new Set([NaN]))).toBe(true);
  });

  it('returns true for sets with +0 and -0 if handleZero returns true', () => {
    // handleZero is called inside deepEqualCore, which by default treats +0 and -0 as equal
    expect(callCompareIterables(new Set([+0]), new Set([-0]))).toBe(true);
  });

  it('returns true for large sets with same elements', () => {
    const arr = Array.from({ length: 20 }, (_, i) => i);
    expect(callCompareIterables(new Set(arr), new Set([...arr].reverse()))).toBe(true);
  });

  it('returns false for large sets with one different element', () => {
    const arrA = Array.from({ length: 20 }, (_, i) => i);
    const arrB = Array.from({ length: 20 }, (_, i) => i);
    arrB[10] = 999;
    expect(callCompareIterables(new Set(arrA), new Set(arrB))).toBe(false);
  });

  it('returns false if compared to a non-set', () => {
    expect(deepEqualCore(new Set([1, 2]), [1, 2], defaultOptions, new WeakMap(), 0)).toBe(false);
  });
});
describe('deepEqualCore (general object and type handling)', () => {
  const defaultOptions = {
    maxDepth: 10,
    checkPrototypes: true,
    nanEqual: true,
    strictZero: false,
  } as any;

  function callDeepEqual(a: unknown, b: unknown, options = defaultOptions) {
    return deepEqualCore(a, b, options, new WeakMap(), 0);
  }

  it('returns true for strictly equal primitives', () => {
    expect(callDeepEqual(42, 42)).toBe(true);
    expect(callDeepEqual('foo', 'foo')).toBe(true);
    expect(callDeepEqual(true, true)).toBe(true);
    expect(callDeepEqual(null, null)).toBe(true);
    expect(callDeepEqual(undefined, undefined)).toBe(true);
  });

  it('returns false for primitives of different types or values', () => {
    expect(callDeepEqual(42, '42')).toBe(false);
    expect(callDeepEqual(true, false)).toBe(false);
    expect(callDeepEqual(null, undefined)).toBe(false);
  });

  it('handles NaN equality', () => {
    expect(callDeepEqual(NaN, NaN)).toBe(true);
  });

  it('handles +0 and -0 as equal', () => {
    expect(callDeepEqual(+0, -0)).toBe(true);
  });

  it('returns false for objects with different constructors when checkPrototypes is true', () => {
    function Foo(this: any) { this.x = 1; }
    function Bar(this: any) { this.x = 1; }
    expect(callDeepEqual(new (Foo as any)(), new (Bar as any)())).toBe(false);
  });

  it('returns true for objects with different constructors when checkPrototypes is false', () => {
    function Foo(this: any) { this.x = 1; }
    function Bar(this: any) { this.x = 1; }
    expect(callDeepEqual(new (Foo as any)(), new (Bar as any)(), { ...defaultOptions, checkPrototypes: false })).toBe(true);
  });

  it('returns true for deeply equal plain objects', () => {
    expect(callDeepEqual({ a: 1, b: { c: 2 } }, { b: { c: 2 }, a: 1 })).toBe(true);
  });

  it('returns false for objects with different keys', () => {
    expect(callDeepEqual({ a: 1 }, { b: 1 })).toBe(false);
  });

  it('returns false for objects with same keys but different values', () => {
    expect(callDeepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('returns true for deeply equal arrays', () => {
    expect(callDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
  });

  it('returns false for arrays with different lengths', () => {
    expect(callDeepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('returns false for arrays with same length but different elements', () => {
    expect(callDeepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
  });

  it('returns true for deeply equal nested arrays', () => {
    expect(callDeepEqual([[1], [2, 3]], [[1], [2, 3]])).toBe(true);
  });

  it('returns true for deeply equal Dates', () => {
    expect(callDeepEqual(new Date('2020-01-01'), new Date('2020-01-01'))).toBe(true);
  });

  it('returns false for Dates with different times', () => {
    expect(callDeepEqual(new Date('2020-01-01'), new Date('2021-01-01'))).toBe(false);
  });

  it('returns true for deeply equal RegExps', () => {
    expect(callDeepEqual(/abc/gi, /abc/gi)).toBe(true);
  });

  it('returns false for RegExps with different patterns or flags', () => {
    expect(callDeepEqual(/abc/g, /abc/i)).toBe(false);
    expect(callDeepEqual(/abc/, /def/)).toBe(false);
  });

  it('returns true for boxed primitives with same value', () => {
    expect(callDeepEqual(new String('foo'), new String('foo'))).toBe(true);
    expect(callDeepEqual(new Number(42), new Number(42))).toBe(true);
    expect(callDeepEqual(new Boolean(true), new Boolean(true))).toBe(true);
  });

  it('returns false for boxed primitives with different values', () => {
    expect(callDeepEqual(new String('foo'), new String('bar'))).toBe(false);
    expect(callDeepEqual(new Number(1), new Number(2))).toBe(false);
    expect(callDeepEqual(new Boolean(true), new Boolean(false))).toBe(false);
  });

  it('returns true for deeply equal Errors', () => {
    expect(callDeepEqual(new Error('fail'), new Error('fail'))).toBe(true);
  });

  it('returns false for Errors with different messages', () => {
    expect(callDeepEqual(new Error('fail'), new Error('other'))).toBe(false);
  });

  it('returns true for deeply equal ArrayBuffers', () => {
    const bufA = new ArrayBuffer(8);
    const bufB = new ArrayBuffer(8);
    new Uint8Array(bufA).set([1,2,3,4,5,6,7,8]);
    new Uint8Array(bufB).set([1,2,3,4,5,6,7,8]);
    expect(callDeepEqual(bufA, bufB)).toBe(true);
  });

  it('returns false for ArrayBuffers with different contents', () => {
    const bufA = new ArrayBuffer(8);
    const bufB = new ArrayBuffer(8);
    new Uint8Array(bufA).set([1,2,3,4,5,6,7,8]);
    new Uint8Array(bufB).set([8,7,6,5,4,3,2,1]);
    expect(callDeepEqual(bufA, bufB)).toBe(false);
  });

  it('returns true for deeply equal TypedArrays', () => {
    expect(callDeepEqual(new Uint8Array([1,2,3]), new Uint8Array([1,2,3]))).toBe(true);
    expect(callDeepEqual(new Float32Array([1.1,2.2]), new Float32Array([1.1,2.2]))).toBe(true);
  });

  it('returns false for TypedArrays with different contents', () => {
    expect(callDeepEqual(new Uint8Array([1,2,3]), new Uint8Array([3,2,1]))).toBe(false);
  });

  it('returns true for deeply equal Maps', () => {
    const a = new Map<any, any>([[{ x: 1 }, 2], ['foo', 3]]);
    const b = new Map<any, any>([[{ x: 1 }, 2], ['foo', 3]]);
    // Use objects with same structure but different references
    const c = new Map<any, any>([[{ x: 1 }, 2], ['foo', 3]]);
    expect(callDeepEqual(a, c)).toBe(true);
  });

  it('returns false for Maps with different keys or values', () => {
    const a = new Map<any, any>([[{ x: 1 }, 2], ['foo', 3]]);
    const b = new Map<any, any>([[{ x: 2 }, 2], ['foo', 3]]);
    expect(callDeepEqual(a, b)).toBe(false);
  });

  it('returns false for objects with circular references and different structure', () => {
    const a: any = { foo: 1 };
    a.self = a;
    const b: any = { foo: 2 };
    b.self = b;
    expect(callDeepEqual(a, b)).toBe(false);
  });

  it('returns true for objects with circular references and same structure', () => {
    const a: any = { foo: 1 };
    a.self = a;
    const b: any = { foo: 1 };
    b.self = b;
    expect(callDeepEqual(a, b)).toBe(true);
  });

  it('returns false if maxDepth is exceeded', () => {
    const a: any = { foo: { bar: { baz: { qux: 1 } } } };
    const b: any = { foo: { bar: { baz: { qux: 1 } } } };
    expect(callDeepEqual(a, b, { ...defaultOptions, maxDepth: 2 })).toBe(false);
  });

  it('returns false for functions', () => {
    const fnA = () => {};
    const fnB = () => {};
    expect(callDeepEqual(fnA, fnB)).toBe(false);
    expect(callDeepEqual(fnA, fnA)).toBe(true);
  });
});