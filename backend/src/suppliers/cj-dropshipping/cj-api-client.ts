import type { CjConfig } from "./cj-config.js";
import { hasCjCredentials } from "./cj-config.js";
import { buildCjAuthHeaders } from "./cj-auth.js";
import { classifyCjApiResponse, classifyCjTransportError, CjApiError } from "./cj-error.js";
import { CjRateLimiter } from "./cj-rate-limiter.js";
import type {
  CjFreightCalculateRequest,
  CjFreightCalculateResponse,
  CjProductListResponse,
  CjProductQueryResponse,
  CjStockResponse,
} from "./cj-types.js";

export type CjRequestOptions = {
  method?: "GET" | "POST";
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  authenticated?: boolean;
};

export class CjApiClient {
  private readonly rateLimiter: CjRateLimiter;

  constructor(
    private readonly config: CjConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {
    this.rateLimiter = new CjRateLimiter(config.rateLimitPerMinute);
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const url = new URL(
      path.startsWith("http") ? path : `${this.config.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    );

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async request<T>(options: CjRequestOptions): Promise<T> {
    const method = options.method ?? "GET";
    const authenticated = options.authenticated ?? true;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      attempt += 1;

      try {
        await this.rateLimiter.acquire();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (authenticated) {
          Object.assign(headers, await buildCjAuthHeaders(this.config, this.fetchImpl));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

        const response = await this.fetchImpl(this.buildUrl(options.path, options.query), {
          method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeout));

        const payload = (await response.json()) as T & {
          code?: number;
          result?: boolean;
          message?: string;
        };

        const apiError = classifyCjApiResponse(payload, response.status);
        if (apiError) {
          if (apiError.retryable && attempt <= this.config.maxRetries) {
            await this.sleep(250 * attempt);
            continue;
          }
          throw apiError;
        }

        return payload;
      } catch (error) {
        const classified = classifyCjTransportError(error);
        if (classified.retryable && attempt <= this.config.maxRetries) {
          await this.sleep(250 * attempt);
          continue;
        }
        throw classified;
      }
    }

    throw new CjApiError("API_ERROR", "CJ API request failed after retries", { retryable: false });
  }

  async healthCheck(): Promise<{ reachable: boolean; message: string }> {
    if (!hasCjCredentials(this.config)) {
      return { reachable: true, message: "CJ sandbox mode active — credentials not configured" };
    }

    try {
      await this.listProducts({ pageNum: 1, pageSize: 1 });
      return { reachable: true, message: "CJ API reachable" };
    } catch (error) {
      const message =
        error instanceof CjApiError ? error.message : "CJ API health check failed";
      return { reachable: false, message };
    }
  }

  listProducts(params: {
    pageNum?: number;
    pageSize?: number;
    keyword?: string;
    categoryId?: string;
  }): Promise<CjProductListResponse> {
    return this.request<CjProductListResponse>({
      path: "/product/list",
      query: {
        pageNum: params.pageNum ?? 1,
        pageSize: params.pageSize ?? 20,
        productNameEn: params.keyword,
        categoryId: params.categoryId,
      },
    });
  }

  queryProduct(pid: string): Promise<CjProductQueryResponse> {
    return this.request<CjProductQueryResponse>({
      path: "/product/query",
      query: { pid },
    });
  }

  queryStockByPid(pid: string): Promise<CjStockResponse> {
    return this.request<CjStockResponse>({
      path: "/product/stock/queryByPid",
      query: { pid },
    });
  }

  calculateFreight(body: CjFreightCalculateRequest): Promise<CjFreightCalculateResponse> {
    return this.request<CjFreightCalculateResponse>({
      method: "POST",
      path: "/logistic/freightCalculate",
      body,
    });
  }
}

/** Factory for a CJ API client using environment configuration. */
export function createCjApiClient(
  config: CjConfig,
  fetchImpl: typeof fetch = fetch,
): CjApiClient {
  return new CjApiClient(config, fetchImpl);
}
