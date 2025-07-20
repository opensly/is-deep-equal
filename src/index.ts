/**
 * Ultra-fast deep equality checker with comprehensive TypeScript support
 * Optimized hybrid version combining fast paths with modular structure
 */

import type { DeepEqualOptions, RequiredDeepEqualOptions } from './types';
import { deepEqualCore } from './core/deep-equal-core';

/**
 * Ultra-fast deep equality checker
 * 
 * Optimized hybrid implementation that combines:
 * - Fast inline optimizations for primitives, arrays, dates, and regex
 * - Modular structure for complex cases like sets, maps, and objects
 * - Circular reference detection and TypeScript support
 * 
 * @param a - First value to compare
 * @param b - Second value to compare  
 * @param options - Comparison options
 * @returns true if values are deeply equal, false otherwise
 * 
 * @example
 * ```typescript
 * import { isDeepEqual } from 'is-deep-equal';
 * 
 * // Basic usage
 * isDeepEqual({a: 1}, {a: 1}); // true
 * isDeepEqual([1, 2, 3], [1, 2, 3]); // true
 * 
 * // With options
 * isDeepEqual(NaN, NaN, { nanEqual: true }); // true
 * isDeepEqual(+0, -0, { strictZero: true }); // false
 * 
 * // Complex objects
 * const obj1 = { 
 *   date: new Date('2023-01-01'),
 *   regex: /test/gi,
 *   set: new Set([1, 2, 3]),
 *   map: new Map([['key', 'value']])
 * };
 * const obj2 = { 
 *   date: new Date('2023-01-01'),
 *   regex: /test/gi,
 *   set: new Set([1, 2, 3]),
 *   map: new Map([['key', 'value']])
 * };
 * isDeepEqual(obj1, obj2); // true
 * ```
 */
export function isDeepEqual<T = unknown>(
  a: T, 
  b: T, 
  options: DeepEqualOptions = {}
): boolean {
  const opts: RequiredDeepEqualOptions = {
    nanEqual: options.nanEqual ?? true,
    checkPrototypes: options.checkPrototypes ?? false,
    strictZero: options.strictZero ?? false,
    maxDepth: options.maxDepth ?? 1000,
  };
  
  return deepEqualCore(a, b, opts, new WeakMap(), 0);
}

// Re-export types
export type { DeepEqualOptions, BenchmarkResult } from './types';

// Export default for ES6 modules
export default isDeepEqual;