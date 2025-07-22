import type { DeepEqualOptions, RequiredDeepEqualOptions } from './types';

function deepEqualCore(
  a: unknown, 
  b: unknown, 
  options: RequiredDeepEqualOptions,
  seen: WeakMap<object, object>,
  depth: number
): boolean {
  // Fast path: reference equality (most common case)
  // Handles all strictly equal primitives, including null, undefined, etc.
  // Special case for +0 and -0 if needed
  if (a === b) {
    return !options.strictZero || (a !== 0 || 1 / (a as number) === 1 / (b as number));
  }

  // Fast path: handle NaN (fast-deep-equal style)
  if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
    return options.nanEqual;
  }

  // Fast path: if both are primitives (not objects/functions), return false
  if (
    (a === null || typeof a !== 'object' && typeof a !== 'function') &&
    (b === null || typeof b !== 'object' && typeof b !== 'function')
  ) {
    return false;
  }

  // Stack overflow protection
  if (depth > options.maxDepth) return false;

  // Fast path: different types
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  // Fast path: different constructors (with option to check prototypes)
  if (a.constructor !== b.constructor && options.checkPrototypes) {
    return false;
  }

  // Circular reference detection
  if (seen.has(a)) {
    return seen.get(a) === b;
  }
  seen.set(a, b);

  // Handle arrays (most common case after primitives) - ULTRA APPROACH
  if (Array.isArray(a)) {
    const arrA = a as any[];
    const arrB = b as any[];
    const length = arrA.length;
    if (length !== arrB.length) return false;
    
    // Ultra approach: inline reverse loop for maximum speed
    for (let i = length; i-- !== 0;) {
      if (!deepEqualCore(arrA[i], arrB[i], options, seen, depth + 1)) {
        return false;
      }
    }
    return true;
  }

  // Handle RegExp (ULTRA APPROACH - inline for speed)
  if (a.constructor === RegExp) {
    const regexA = a as RegExp;
    const regexB = b as RegExp;
    return regexA.source === regexB.source && regexA.flags === regexB.flags;
  }

  // Handle Date (ULTRA APPROACH - inline for speed)
  if (a.constructor === Date) {
    const dateA = a as Date;
    const dateB = b as Date;
    return dateA.getTime() === dateB.getTime();
  }

  // Handle ArrayBuffer (inline for speed) - check before constructor comparison
  if (a.constructor === ArrayBuffer) {
    const bufA = a as ArrayBuffer;
    const bufB = b as ArrayBuffer;
    if (bufA.byteLength !== bufB.byteLength) return false;
    const viewA = new Uint8Array(bufA);
    const viewB = new Uint8Array(bufB);
    for (let i = 0; i < viewA.length; i++) {
      if (viewA[i] !== viewB[i]) return false;
    }
    return true;
  }

  // Handle TypedArrays (inline for speed) - check before constructor comparison
  if (ArrayBuffer.isView(a)) {
    const arrA = a as any;
    const arrB = b as any;
    if (arrA.constructor !== arrB.constructor || arrA.length !== arrB.length) {
      return false;
    }
    
    for (let i = 0; i < arrA.length; i++) {
      const valA = arrA[i];
      const valB = arrB[i];
      
      if (valA !== valB) {
        // Handle NaN in typed arrays
        if (!(options.nanEqual && 
              typeof valA === 'number' && typeof valB === 'number' &&
              Number.isNaN(valA) && Number.isNaN(valB))) {
          return false;
        }
      }
    }
    return true;
  }

  // Handle boxed primitives (ULTRA APPROACH - inline for speed)
  if (a.valueOf !== Object.prototype.valueOf) {
    return a.valueOf() === b.valueOf();
  }

  // Handle Error (inline for speed)
  if (a.constructor === Error) {
    const errA = a as Error;
    const errB = b as Error;
    return errA.name === errB.name && errA.message === errB.message;
  }

  // Handle Sets (OPTIMIZED APPROACH - keep modular for complexity)
  if (a.constructor === Set) {
    const setA = a as Set<any>;
    const setB = b as Set<any>;
    if (setA.size !== setB.size) return false;
    return compareSetOptimized(setA, setB, options, seen, depth);
  }

  // Handle Maps (OPTIMIZED APPROACH - keep modular for complexity)
  if (a.constructor === Map) {
    const mapA = a as Map<any, any>;
    const mapB = b as Map<any, any>;
    if (mapA.size !== mapB.size) return false;
    return compareMapOptimized(mapA, mapB, options, seen, depth);
  }

  // Handle plain objects (HYBRID APPROACH - inline for speed but keep structure)
  return compareObjectOptimized(a as Record<PropertyKey, unknown>, b as Record<PropertyKey, unknown>, options, seen, depth);
}

function compareSetOptimized(
  setA: Set<any>, 
  setB: Set<any>, 
  options: RequiredDeepEqualOptions,
  seen: WeakMap<object, object>,
  depth: number
): boolean {
  // For small sets, use simple iteration with order-independent comparison
  if (setA.size <= 10) {
    const processedB = new Set<number>();
    for (const itemA of setA) {
      let found = false;
      let index = 0;
      for (const itemB of setB) {
        if (!processedB.has(index)) {
          // Create a new seen map for each comparison to avoid interference
          const newSeen = new WeakMap();
          if (deepEqualCore(itemA, itemB, options, newSeen, depth + 1)) {
            processedB.add(index);
            found = true;
            break;
          }
        }
        index++;
      }
      if (!found) return false;
    }
    return true;
  }
  
  // For larger sets, convert to arrays for better performance
  const arrA = Array.from(setA);
  const arrB = Array.from(setB);
  
  if (arrA.length !== arrB.length) return false;
  
  // Use order-independent comparison for larger sets
  const processedB = new Set<number>();
  for (let i = arrA.length; i-- !== 0;) {
    let found = false;
    for (let j = arrB.length; j-- !== 0;) {
      if (!processedB.has(j)) {
        // Create a new seen map for each comparison to avoid interference
        const newSeen = new WeakMap();
        if (deepEqualCore(arrA[i], arrB[j], options, newSeen, depth + 1)) {
          processedB.add(j);
          found = true;
          break;
        }
      }
    }
    if (!found) return false;
  }
  return true;
}

function compareMapOptimized(
  mapA: Map<any, any>, 
  mapB: Map<any, any>, 
  options: RequiredDeepEqualOptions,
  seen: WeakMap<object, object>,
  depth: number
): boolean {
  for (const [keyA, valueA] of mapA) {
    let found = false;
    for (const [keyB, valueB] of mapB) {
      if (deepEqualCore(keyA, keyB, options, seen, depth + 1) && 
          deepEqualCore(valueA, valueB, options, seen, depth + 1)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function compareObjectOptimized(
  objA: Record<PropertyKey, unknown>,
  objB: Record<PropertyKey, unknown>,
  options: RequiredDeepEqualOptions,
  seen: WeakMap<object, object>,
  depth: number
): boolean {
  const keysA = Object.keys(objA);
  const length = keysA.length;
  
  if (length !== Object.keys(objB).length) return false;

  // Fast path: check if all keys exist in b
  for (let i = length; i-- !== 0;) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i])) {
      return false;
    }
  }

  // Compare values using reverse loop for better performance
  for (let i = length; i-- !== 0;) {
    const key = keysA[i];
    if (!deepEqualCore(objA[key], objB[key], options, seen, depth + 1)) {
      return false;
    }
  }

  return true;
}

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
 * import { deepEqualCheck } from 'deep-equal-check';
 * 
 * // Basic usage
 * deepEqualCheck({a: 1}, {a: 1}); // true
 * deepEqualCheck([1, 2, 3], [1, 2, 3]); // true
 * 
 * // With options
 * deepEqualCheck(NaN, NaN, { nanEqual: true }); // true
 * deepEqualCheck(+0, -0, { strictZero: true }); // false
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
 * deepEqualCheck(obj1, obj2); // true
 * ```
 */
export function deepEqualCheck<T = unknown>(
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
export type { DeepEqualOptions } from './types';

// Export default for ES6 modules
export default deepEqualCheck;