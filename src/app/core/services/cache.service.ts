import { Injectable } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';

interface CacheEntry<T> {
  data: Observable<T>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data or execute the provided observable
   * @param key Cache key
   * @param source$ Observable to execute if cache miss
   * @param ttl Time to live in milliseconds (optional)
   */
  get<T>(key: string, source$: Observable<T>, ttl?: number): Observable<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Check if cache exists and is still valid
    if (cached && (now - cached.timestamp) < cached.ttl) {
      console.log(`🔵 Cache HIT: ${key}`);
      return cached.data as Observable<T>;
    }

    console.log(`🟡 Cache MISS: ${key}`);

    // Cache miss or expired - execute source and cache result
    const data$ = source$.pipe(
      shareReplay(1) // Share the result among multiple subscribers
    );

    this.cache.set(key, {
      data: data$,
      timestamp: now,
      ttl: ttl || this.defaultTTL
    });

    return data$;
  }

  /**
   * Check if a key exists in cache and is valid
   */
  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    const now = Date.now();
    const isValid = (now - cached.timestamp) < cached.ttl;

    if (!isValid) {
      this.cache.delete(key);
    }

    return isValid;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🔴 Cache INVALIDATED: ${key}`);
  }

  /**
   * Invalidate all cache keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🔴 Cache INVALIDATED (pattern): ${key}`);
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🔴 Cache CLEARED: All entries removed');
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache CLEANUP: Removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Set data directly in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data: of(data),
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
