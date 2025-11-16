import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, retry, timer, throwError, tap } from 'rxjs';
import { CacheService } from './cache.service';

export interface RetryConfig {
  count: number;
  delay: number;
  backoff?: boolean; // Exponential backoff
  excludeStatuses?: number[]; // Don't retry these status codes
}

export interface CacheConfig {
  enabled: boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  skipLoading?: boolean;
  retry?: RetryConfig;
  cache?: CacheConfig;
}

/**
 * Base API Service
 * Provides common HTTP methods with retry logic, caching, and error handling
 */
export abstract class BaseApiService {
  protected http = inject(HttpClient);
  protected cacheService = inject(CacheService);

  protected abstract get baseUrl(): string;

  // Default retry configuration
  private defaultRetryConfig: RetryConfig = {
    count: 2,
    delay: 1000,
    backoff: true,
    excludeStatuses: [400, 401, 403, 404, 422] // Don't retry client errors
  };

  /**
   * GET Request with retry and caching support
   */
  protected get<T>(
    endpoint: string,
    options?: RequestOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Handle caching
    if (options?.cache?.enabled) {
      const cacheKey = this.getCacheKey('GET', url, options.params);
      return this.cacheService.get(
        cacheKey,
        this.executeGet<T>(url, options),
        options.cache.ttl
      );
    }

    return this.executeGet<T>(url, options);
  }

  /**
   * POST Request with retry and cache support
   */
  protected post<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Handle caching for POST (for list/search endpoints)
    if (options?.cache?.enabled) {
      const cacheKey = this.getCacheKey('POST', url, body);
      return this.cacheService.get(
        cacheKey,
        this.executePost<T>(url, body, options),
        options.cache.ttl
      );
    }

    return this.executePost<T>(url, body, options);
  }

  /**
   * Execute POST request
   */
  private executePost<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options);
    // @ts-ignore - HttpClient type inference issue with observe parameter
    const request$: Observable<T> = this.http.post<T>(url, body, httpOptions);

    // Apply retry logic if configured
    if (options?.retry) {
      // @ts-ignore - HttpClient type inference issue with observe parameter
      return this.applyRetry(request$, options.retry);
    }

    // @ts-ignore - HttpClient type inference issue with observe parameter
    return request$;
  }

  /**
   * PUT Request with retry support
   */
  protected put<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    // @ts-ignore - HttpClient type inference issue with observe parameter
    let request$: Observable<T> = this.http.put<T>(url, body, httpOptions);

    // Apply retry logic if configured
    if (options?.retry) {
      request$ = this.applyRetry(request$, options.retry);
    }

    // Invalidate related cache after successful PUT
    // @ts-ignore - HttpClient type inference issue with observe parameter
    return request$.pipe(
      tap(() => this.invalidateRelatedCache('PUT', endpoint))
    );
  }

  /**
   * DELETE Request with retry support
   */
  protected deleteRequest<T>(
    endpoint: string,
    options?: RequestOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    // @ts-ignore - HttpClient type inference issue with observe parameter
    let request$: Observable<T> = this.http.delete<T>(url, httpOptions);

    // Apply retry logic if configured
    if (options?.retry) {
      request$ = this.applyRetry(request$, options.retry);
    }

    // Invalidate related cache after successful DELETE
    // @ts-ignore - HttpClient type inference issue with observe parameter
    return request$.pipe(
      tap(() => this.invalidateRelatedCache('DELETE', endpoint))
    );
  }

  /**
   * PATCH Request with retry support
   */
  protected patch<T>(
    endpoint: string,
    body: any,
    options?: RequestOptions
  ): Observable<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const httpOptions = this.buildHttpOptions(options);

    // @ts-ignore - HttpClient type inference issue with observe parameter
    let request$: Observable<T> = this.http.patch<T>(url, body, httpOptions);

    // Apply retry logic if configured
    if (options?.retry) {
      request$ = this.applyRetry(request$, options.retry);
    }

    // Invalidate related cache after successful PATCH
    // @ts-ignore - HttpClient type inference issue with observe parameter
    return request$.pipe(
      tap(() => this.invalidateRelatedCache('PATCH', endpoint))
    );
  }

  /**
   * Execute GET request
   */
  private executeGet<T>(url: string, options?: RequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options);
    // @ts-ignore - HttpClient type inference issue with observe parameter
    const request$: Observable<T> = this.http.get<T>(url, httpOptions);

    // Apply retry logic if configured
    if (options?.retry) {
      // @ts-ignore - HttpClient type inference issue with observe parameter
      return this.applyRetry(request$, options.retry);
    }

    // @ts-ignore - HttpClient type inference issue with observe parameter
    return request$;
  }

  /**
   * Build HTTP options from RequestOptions
   */
  private buildHttpOptions(options?: RequestOptions): {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: string | string[] };
  } {
    const httpOptions: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
    } = {};

    if (options?.headers) {
      httpOptions.headers = options.headers;
    }

    if (options?.params) {
      httpOptions.params = options.params;
    }

    // Add skipLoading header if specified
    if (options?.skipLoading) {
      httpOptions.headers = httpOptions.headers || {};
      if (httpOptions.headers instanceof HttpHeaders) {
        httpOptions.headers = httpOptions.headers.set('skipLoading', 'true');
      } else {
        httpOptions.headers['skipLoading'] = 'true';
      }
    }

    return httpOptions;
  }

  /**
   * Apply retry logic to observable
   */
  private applyRetry<T>(
    source$: Observable<T>,
    config: RetryConfig
  ): Observable<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };

    return source$.pipe(
      retry({
        count: retryConfig.count,
        delay: (error, retryCount) => {
          // Don't retry for specific status codes
          if (retryConfig.excludeStatuses?.includes(error.status)) {
            return throwError(() => error);
          }

          // Calculate delay with exponential backoff if enabled
          const delay = retryConfig.backoff
            ? retryConfig.delay * Math.pow(2, retryCount - 1)
            : retryConfig.delay;

          console.log(`🔄 Retry attempt ${retryCount} after ${delay}ms...`);

          return timer(delay);
        }
      })
    );
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    method: string,
    url: string,
    params?: HttpParams | { [param: string]: string | string[] }
  ): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramsStr}`;
  }

  /**
   * Invalidate cache related to an endpoint
   */
  private invalidateRelatedCache(method: string, endpoint: string): void {
    // Invalidate all cache entries containing this endpoint
    this.cacheService.invalidatePattern(endpoint);
  }
}
