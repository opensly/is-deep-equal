#!/usr/bin/env ts-node

import { compareBenchmark } from './benchmark';
import { isDeepEqual } from '../src/index';
import isEqual from 'lodash/isEqual';
// @ts-ignore - deep-eql doesn't have TypeScript definitions
import deepEqual from 'deep-eql';
import fastDeepEqual from 'fast-deep-equal';

console.log('🔍 Deep Equality Library Performance Comparison\n');

// Safe wrapper for fast-deep-equal to handle circular references
const safeFastDeepEqual = (a: unknown, b: unknown): boolean => {
  try {
    return fastDeepEqual(a, b);
  } catch (error) {
    // Return false for cases that cause stack overflow
    return false;
  }
};

// Test cases covering various scenarios (excluding problematic circular refs)
const testCases: Array<{ name: string; a: unknown; b: unknown }> = [
  // Primitives
  { name: 'Primitives (same)', a: 42, b: 42 },
  { name: 'Primitives (different)', a: 42, b: 43 },
  { name: 'Strings', a: 'hello world', b: 'hello world' },
  { name: 'Booleans', a: true, b: true },
  { name: 'Null/Undefined', a: null, b: null },
  
  // Arrays
  { name: 'Simple Arrays', a: [1, 2, 3], b: [1, 2, 3] },
  { name: 'Nested Arrays', a: [1, [2, [3, 4]]], b: [1, [2, [3, 4]]] },
  { name: 'Mixed Arrays', a: [1, 'hello', true, null], b: [1, 'hello', true, null] },
  
  // Objects
  { name: 'Simple Objects', a: { a: 1, b: 2 }, b: { a: 1, b: 2 } },
  { name: 'Nested Objects', a: { a: { b: { c: 1 } } }, b: { a: { b: { c: 1 } } } },
  { name: 'Mixed Objects', a: { a: 1, b: 'hello', c: true }, b: { a: 1, b: 'hello', c: true } },
  
  // Special Types
  { name: 'Dates', a: new Date('2023-01-01'), b: new Date('2023-01-01') },
  { name: 'RegExps', a: /test/gi, b: /test/gi },
  { name: 'Sets', a: new Set([1, 2, 3]), b: new Set([3, 2, 1]) },
  { name: 'Maps', a: new Map([['a', 1], ['b', 2]]), b: new Map([['b', 2], ['a', 1]]) },
  
  // Complex Scenarios
  { name: 'Complex Mixed', a: { 
    arr: [1, { nested: true }, new Date('2023-01-01')],
    set: new Set([1, 2, 3]),
    map: new Map([['key', 'value']]),
    regex: /test/gi
  }, b: { 
    arr: [1, { nested: true }, new Date('2023-01-01')],
    set: new Set([1, 2, 3]),
    map: new Map([['key', 'value']]),
    regex: /test/gi
  }},
  
  // Edge Cases
  { name: 'NaN Values', a: NaN, b: NaN },
  { name: 'Empty Objects', a: {}, b: {} },
  { name: 'Empty Arrays', a: [], b: [] },
  { name: 'Large Objects', a: Object.fromEntries(Array.from({length: 1000}, (_, i) => [`key${i}`, i])), 
    b: Object.fromEntries(Array.from({length: 1000}, (_, i) => [`key${i}`, i])) }
];

// Create competitors array
const competitors = [
  {
    name: 'is-deep-equal',
    fn: (a: unknown, b: unknown) => isDeepEqual(a, b)
  },
  {
    name: 'lodash/isEqual',
    fn: (a: unknown, b: unknown) => isEqual(a, b)
  },
  {
    name: 'deep-eql',
    fn: (a: unknown, b: unknown) => deepEqual(a, b)
  },
  {
    name: 'fast-deep-equal',
    fn: (a: unknown, b: unknown) => safeFastDeepEqual(a, b)
  }
];

// Run comprehensive benchmark
console.log('📊 Performance Comparison (100,000 iterations)');
console.log('=' .repeat(80));

compareBenchmark(competitors, 100000);

// Individual test case performance
console.log('\n🔬 Individual Test Case Performance (10,000 iterations each)');
console.log('=' .repeat(80));

const summary: Array<{ name: string; wins: number; avgRank: number; totalTime: number }> = [];

for (const competitor of competitors) {
  summary.push({
    name: competitor.name,
    wins: 0,
    avgRank: 0,
    totalTime: 0
  });
}

for (const testCase of testCases) {
  console.log(`\n${testCase.name}:`);
  console.log('-'.repeat(40));
  
  const results: Array<{ name: string; time: number; opsPerSec: number }> = [];
  
  for (const { name, fn } of competitors) {
    const start = performance.now();
    
    for (let i = 0; i < 10000; i++) {
      fn(testCase.a, testCase.b);
    }
    
    const end = performance.now();
    const timeTaken = end - start;
    const opsPerSecond = 10000 / (timeTaken / 1000);
    
    results.push({ name, time: timeTaken, opsPerSec: opsPerSecond });
    
    // Update summary
    const summaryItem = summary.find(s => s.name === name);
    if (summaryItem) {
      summaryItem.totalTime += timeTaken;
    }
  }
  
  // Sort by performance (fastest first)
  results.sort((a, b) => b.opsPerSec - a.opsPerSec);
  
  // Update summary stats
  results.forEach((result, index) => {
    const summaryItem = summary.find(s => s.name === result.name);
    if (summaryItem) {
      if (index === 0) summaryItem.wins++;
      summaryItem.avgRank += index + 1;
    }
  });
  
  for (const result of results) {
    console.log(`${result.name.padEnd(20)}: ${result.time.toFixed(2)}ms (${result.opsPerSec.toFixed(0)} ops/sec)`);
  }
}

// Calculate final summary
summary.forEach(item => {
  item.avgRank = item.avgRank / testCases.length;
});

// Sort by wins, then by average rank
summary.sort((a, b) => {
  if (b.wins !== a.wins) return b.wins - a.wins;
  return a.avgRank - b.avgRank;
});

console.log('\n🏆 Performance Summary');
console.log('=' .repeat(80));
console.log('Rank | Library         | Wins | Avg Rank | Total Time');
console.log('-'.repeat(60));

summary.forEach((item, index) => {
  console.log(`${(index + 1).toString().padStart(4)} | ${item.name.padEnd(15)} | ${item.wins.toString().padStart(4)} | ${item.avgRank.toFixed(1).padStart(8)} | ${item.totalTime.toFixed(1)}ms`);
});

// Feature comparison
console.log('\n📋 Feature Comparison');
console.log('=' .repeat(80));
console.log('Feature              | is-deep-equal | lodash | deep-eql | fast-deep-equal');
console.log('-'.repeat(80));
console.log('Circular References  |      ✓        |   ✓    |    ✓     |       ✗');
console.log('ES6+ Types (Set/Map) |      ✓        |   ✓    |    ✓     |       ✓');
console.log('Date Objects         |      ✓        |   ✓    |    ✓     |       ✓');
console.log('RegExp Objects       |      ✓        |   ✓    |    ✓     |       ✓');
console.log('NaN Handling         |      ✓        |   ✓    |    ✓     |       ✓');
console.log('TypeScript Support   |      ✓        |   ✓    |    ✗     |       ✓');
console.log('Bundle Size          |    ~15KB      | ~50KB  |  ~25KB   |     ~8KB');

console.log('\n✅ Benchmark completed!'); 