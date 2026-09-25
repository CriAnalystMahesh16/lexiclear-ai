/**
 * LexiClear AI - Server Cache & Request Coalescer
 * Phase 4 Efficiency Engine
 *
 * Implements:
 * 1. Deterministic recursive canonical request hashing (prevents key collision or property loss)
 * 2. In-flight request coalescing (prevents duplicate concurrent AI calls)
 * 3. Bounded in-memory cache with Time-To-Live (TTL)
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/**
 * Deterministically serializes any JS object or array with recursively sorted keys.
 * Fixes the issue where native JSON.stringify with an array replacer strips nested properties.
 */
export function canonicalJsonStringify(val: unknown): string {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  const pairs = keys.map(
    (k) => JSON.stringify(k) + ':' + canonicalJsonStringify((val as Record<string, unknown>)[k])
  );
  return '{' + pairs.join(',') + '}';
}

export class RequestCacheAndCoalescer {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private readonly maxCapacity: number;
  private readonly defaultTtlMs: number;
  private hitCount = 0;
  private missCount = 0;

  constructor(options?: { maxCapacity?: number; defaultTtlMs?: number }) {
    this.maxCapacity = options?.maxCapacity ?? 500;
    this.defaultTtlMs = options?.defaultTtlMs ?? 1000 * 60 * 60; // 1 hour
  }

  /**
   * Generates a deterministic SHA-256 hash key for a request payload.
   * Utilizes recursive canonical serialization to guarantee full payload coverage.
   */
  public generateKey(prefix: string, payload: unknown): string {
    const serialized = canonicalJsonStringify(payload);
    const hash = createHash('sha256').update(serialized).digest('hex').substring(0, 32);
    return `${prefix}:${hash}`;
  }

  /**
   * Executes an async operation with caching and in-flight request coalescing.
   */
  public async execute<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const now = Date.now();

    // 1. Check existing cache
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    if (cached) {
      if (cached.expiresAt > now) {
        this.hitCount++;
        return cached.value;
      }
      this.cache.delete(key);
    }

    this.missCount++;

    // 2. Check in-flight duplicate requests (coalescing)
    const inFlight = this.inFlightRequests.get(key) as Promise<T> | undefined;
    if (inFlight) {
      return inFlight;
    }

    // 3. Launch operation and register in in-flight registry
    const promise = (async () => {
      try {
        const result = await operation();

        // Enforce cache capacity limit (LRU eviction of oldest key)
        if (this.cache.size >= this.maxCapacity) {
          const oldestKey = this.cache.keys().next().value;
          if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
          value: result,
          expiresAt: now + (ttlMs ?? this.defaultTtlMs),
        });

        return result;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  public getStats() {
    return {
      size: this.cache.size,
      inFlightCount: this.inFlightRequests.size,
      hits: this.hitCount,
      misses: this.missCount,
    };
  }

  public clear(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

export const globalSynthesisCache = new RequestCacheAndCoalescer();
