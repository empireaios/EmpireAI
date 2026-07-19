/** R1-10 — Shopify API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendShopifyStoreLog } from "./shopify-store-logging.js";
import type { ShopifyStoreApiClient } from "./shopify-store-api-client.js";
import type { ShopifyStoreRateLimitManager } from "./shopify-store-rate-limit-manager.js";
import type { ShopifyStoreRetryManager } from "./shopify-store-retry-manager.js";
import type { ShopifyStoreResponseHandler } from "./shopify-store-response-handler.js";
import { SHOPIFY_STORE_MARKETPLACE_ID } from "./paths.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { ShopifyStoreApiRequest, ShopifyStoreApiResponse, RouteShopifyStoreApiInput } from "./types.js";

export class ShopifyStoreRequestRouter {
  constructor(
    private readonly apiClient: ShopifyStoreApiClient,
    private readonly responseHandler: ShopifyStoreResponseHandler,
    private readonly rateLimitManager: ShopifyStoreRateLimitManager,
    private readonly retryManager: ShopifyStoreRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
    private storeDomain: string | null = null,
  ) {}

  setStoreDomain(storeDomain: string | null): void {
    this.storeDomain = storeDomain;
  }

  async route(
    input: RouteShopifyStoreApiInput,
    config: ShopifyStoreMarketplaceIntegrationConfiguration,
  ): Promise<{ request: ShopifyStoreApiRequest; response: ShopifyStoreApiResponse; rateLimited: boolean }> {
    const requestId = `shf-req-${randomUUID()}`;
    const request: ShopifyStoreApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendShopifyStoreLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "Shopify rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: SHOPIFY_STORE_MARKETPLACE_ID,
          method: input.method,
          path: input.path,
        });
      } catch {
        /* framework routing optional when connector not active */
      }
    }

    const { result, attempts } = await this.retryManager.execute(
      async () =>
        this.apiClient.simulateRequest(input.method, input.path, config, this.storeDomain),
      config,
    );

    if (attempts > 1) {
      appendShopifyStoreLog({
        event: "retry_attempt",
        level: "warn",
        details: `Shopify request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendShopifyStoreLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
