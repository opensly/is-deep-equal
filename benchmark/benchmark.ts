/**
 * Performance benchmark utilities
 */

import deepEqualCheck from '../src/index';
import type { BenchmarkResult } from './types';

export function benchmark(iterations = 100000): BenchmarkResult | null {
  if (typeof performance === 'undefined') {
    console.log('Performance API not available');
    return null;
  }

  const testCases: [unknown, unknown][] = [
    [1, 1],
    ['hello', 'hello'],
    [true, false],
    [null, null],
    [undefined, undefined],
    [[1, 2, 3], [1, 2, 3]],
    [{a: 1, b: 2}, {a: 1, b: 2}],
    [new Date('2023-01-01'), new Date('2023-01-01')],
    [/test/gi, /test/gi],
    [new Set([1, 2, 3]), new Set([3, 2, 1])],
    [new Map([['a', 1], ['b', 2]]), new Map([['b', 2], ['a', 1]])],
  ];

  const start = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    for (const [a, b] of testCases) {
      deepEqualCheck(a, b);
    }
  }
  
  const end = performance.now();
  const timeTaken = end - start;
  const totalOperations = iterations * testCases.length;
  const operationsPerSecond = totalOperations / (timeTaken / 1000);
  const averageTimePerOperation = timeTaken / totalOperations;

  const result: BenchmarkResult = {
    totalOperations,
    timeTaken,
    operationsPerSecond,
    averageTimePerOperation
  };
  
  console.log(`Benchmark Results:`);
  console.log(`Total operations: ${result.totalOperations}`);
  console.log(`Time taken: ${result.timeTaken.toFixed(2)}ms`);
  console.log(`Operations per second: ${result.operationsPerSecond.toFixed(0)}`);
  console.log(`Average time per operation: ${result.averageTimePerOperation.toFixed(6)}ms`);

  return result;
}

export function compareBenchmark(
  competitors: Array<{ name: string; fn: (a: unknown, b: unknown) => boolean }>,
  iterations = 10000
): void {
  const testCases: [unknown, unknown][] = [
    [{a: 1, b: {c: 2}}, {a: 1, b: {c: 2}}],
    [new Set([1, 2, 3]), new Set([3, 2, 1])],
    [new Map([['key', 'value']]), new Map([['key', 'value']])],
    [[1, [2, [3, 4]]], [1, [2, [3, 4]]]],
    [new Date('2023-01-01'), new Date('2023-01-01')],
  ];

  console.log(`\nComparative Benchmark (${iterations} iterations):`);
  console.log('=' .repeat(60));

  for (const { name, fn } of competitors) {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      for (const [a, b] of testCases) {
        fn(a, b);
      }
    }
    
    const end = performance.now();
    const timeTaken = end - start;
    const opsPerSecond = (iterations * testCases.length) / (timeTaken / 1000);
    
    console.log(`${name.padEnd(20)}: ${timeTaken.toFixed(2)}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
  }
}
