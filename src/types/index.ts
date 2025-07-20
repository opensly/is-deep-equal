/**
 * Type definitions for the deep equality library
 */

export type Primitive = string | number | boolean | null | undefined | symbol | bigint;

export interface DeepEqualOptions {
  /** Whether to treat NaN as equal to NaN (default: true) */
  nanEqual?: boolean;
  /** Whether to check object prototypes (default: false) */
  checkPrototypes?: boolean;
  /** Whether to treat +0 and -0 as different (default: false) */
  strictZero?: boolean;
  /** Maximum recursion depth to prevent stack overflow (default: 1000) */
  maxDepth?: number;
}

export interface RequiredDeepEqualOptions extends Required<DeepEqualOptions> {}

export interface BenchmarkResult {
  totalOperations: number;
  timeTaken: number;
  operationsPerSecond: number;
  averageTimePerOperation: number;
}

export type TypedArrayConstructor = 
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor
  | BigInt64ArrayConstructor
  | BigUint64ArrayConstructor;

export type TypedArray = 
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | BigInt64Array
  | BigUint64Array;
