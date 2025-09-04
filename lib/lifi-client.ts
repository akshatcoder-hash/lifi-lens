import {
  StatusRequest,
  StatusResponse,
  ApiClientConfig,
  ApiError,
  BatchStatusRequest,
  BatchStatusResponse,
  RoutesRequest,
  Route,
  QuoteRequest,
  Quote,
} from "@/types/lifi";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class LiFiClient {
  private baseUrl: string;
  private config: Required<ApiClientConfig>;
  private cache = new Map<string, CacheEntry<any>>();

  constructor(config?: ApiClientConfig) {
    this.baseUrl = "/api/lifi";
    this.config = {
      maxRetries: config?.maxRetries ?? 3,
      initialRetryDelay: config?.initialRetryDelay ?? 1000,
      maxRetryDelay: config?.maxRetryDelay ?? 10000,
      timeout: config?.timeout ?? 30000,
      cacheEnabled: config?.cacheEnabled ?? true,
      cacheTTL: config?.cacheTTL ?? 30000, // 30 seconds
    };
  }

  /**
   * Get transaction status with retry logic and caching
   */
  async getStatus(request: StatusRequest): Promise<StatusResponse> {
    const cacheKey = this.createCacheKey("status", request);

    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache<StatusResponse>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.executeWithRetry(async () => {
      const searchParams = new URLSearchParams();
      searchParams.append("txHash", request.txHash);
      if (request.fromChain)
        searchParams.append("fromChain", request.fromChain);
      if (request.toChain) searchParams.append("toChain", request.toChain);
      if (request.bridge) searchParams.append("bridge", request.bridge);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const res = await fetch(
          `${this.baseUrl}/status?${searchParams.toString()}`,
          {
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw await this.createApiError(res);
        }

        const data = await res.json();
        return this.parseStatusResponse(data);
      } finally {
        clearTimeout(timeoutId);
      }
    });

    // Cache successful responses
    if (this.config.cacheEnabled && response) {
      this.setCache(cacheKey, response);
    }

    return response;
  }

  /**
   * Get multiple transaction statuses efficiently
   */
  async getBatchStatus(
    request: BatchStatusRequest
  ): Promise<BatchStatusResponse> {
    // For now, implement as parallel requests
    // In the future, could implement actual batch endpoint
    const promises = request.txHashes.map(async (txHash) => {
      try {
        const data = await this.getStatus({
          txHash,
          fromChain: request.fromChain,
          toChain: request.toChain,
          bridge: request.bridge,
        });
        return { txHash, data, error: null };
      } catch (error) {
        return {
          txHash,
          data: null,
          error: error as ApiError,
        };
      }
    });

    const results = await Promise.all(promises);

    return {
      results,
      totalProcessed: results.length,
      totalSuccessful: results.filter((r) => r.data !== null).length,
      totalErrors: results.filter((r) => r.error !== null).length,
    };
  }

  /**
   * Get available routes for a cross-chain transaction
   */
  async getRoutes(request: RoutesRequest): Promise<{ routes: Route[] }> {
    const cacheKey = this.createCacheKey("routes", request);

    // Check cache first (shorter TTL for routes due to price volatility)
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache<{ routes: Route[] }>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const res = await fetch(`${this.baseUrl}/routes`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw await this.createApiError(res);
        }

        const data = await res.json();
        return this.parseRoutesResponse(data);
      } finally {
        clearTimeout(timeoutId);
      }
    });

    // Cache successful responses with shorter TTL
    if (this.config.cacheEnabled && response) {
      this.setCache(cacheKey, response, this.config.cacheTTL / 2); // Half TTL for routes
    }

    return response;
  }

  /**
   * Get a single quote for a cross-chain transaction
   */
  async getQuote(request: QuoteRequest): Promise<Quote> {
    const cacheKey = this.createCacheKey("quote", request);

    // Check cache first (shorter TTL for quotes due to price volatility)
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache<Quote>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.executeWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      try {
        const res = await fetch(`${this.baseUrl}/quote`, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw await this.createApiError(res);
        }

        const data = await res.json();
        return this.parseQuoteResponse(data);
      } finally {
        clearTimeout(timeoutId);
      }
    });

    // Cache successful responses with shorter TTL
    if (this.config.cacheEnabled && response) {
      this.setCache(cacheKey, response, this.config.cacheTTL / 2); // Half TTL for quotes
    }

    return response;
  }

  /**
   * Execute request with exponential backoff retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const apiError = error as ApiError;

      // Don't retry if not retryable or exceeded max retries
      if (!apiError.isRetryable || attempt >= this.config.maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const baseDelay = apiError.retryAfter
        ? apiError.retryAfter * 1000
        : this.config.initialRetryDelay;

      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1),
        this.config.maxRetryDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * delay * 0.1;

      await this.sleep(jitteredDelay);
      return this.executeWithRetry(operation, attempt + 1);
    }
  }

  /**
   * Create standardized API error from response
   */
  private async createApiError(response: Response): Promise<ApiError> {
    let errorData: any = {};

    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    const isRetryable = this.isRetryableError(response.status);
    const isNetworkError = !response.ok && response.status >= 500;

    return {
      code: errorData.error?.code || response.status.toString(),
      message:
        errorData.error?.message || errorData.message || response.statusText,
      status: response.status,
      isRetryable,
      isNetworkError,
      retryAfter: this.parseRetryAfter(response.headers.get("retry-after")),
    };
  }

  /**
   * Parse and validate status response
   */
  private parseStatusResponse(data: any): StatusResponse {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid response format");
    }

    // Validate required fields
    if (!data.status || !data.sending) {
      throw new Error("Missing required fields in response");
    }

    return data as StatusResponse;
  }

  /**
   * Parse and validate routes response
   */
  private parseRoutesResponse(data: any): { routes: Route[] } {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid routes response format");
    }

    if (!Array.isArray(data.routes)) {
      throw new Error("Routes response must contain routes array");
    }

    return data as { routes: Route[] };
  }

  /**
   * Parse and validate quote response
   */
  private parseQuoteResponse(data: any): Quote {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid quote response format");
    }

    // Validate required fields for a quote
    if (!data.id || !data.fromToken || !data.toToken) {
      throw new Error("Missing required fields in quote response");
    }

    return data as Quote;
  }

  /**
   * Determine if error is retryable
   */
  private isRetryableError(status: number): boolean {
    // Retry on 5xx errors, 408 (timeout), 429 (rate limit), and network errors
    return status >= 500 || status === 408 || status === 429 || status === 0;
  }

  /**
   * Parse retry-after header
   */
  private parseRetryAfter(retryAfter: string | null): number | undefined {
    if (!retryAfter) return undefined;

    const seconds = parseInt(retryAfter, 10);
    return isNaN(seconds) ? undefined : seconds;
  }

  /**
   * Cache utilities
   */
  private createCacheKey(operation: string, params: any): string {
    return `${operation}:${JSON.stringify(params)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, customTTL?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTTL ?? this.config.cacheTTL,
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Default client instance
export const lifiClient = new LiFiClient();
