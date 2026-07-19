/** R1-11 — WooCommerce API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendWooCommerceLog } from "./woocommerce-logging.js";
import type { WooCommerceApiClient } from "./woocommerce-api-client.js";
import type { WooCommerceRateLimitManager } from "./woocommerce-rate-limit-manager.js";
import type { WooCommerceRetryManager } from "./woocommerce-retry-manager.js";
import type { WooCommerceResponseHandler } from "./woocommerce-response-handler.js";
import { WOOCOMMERCE_MARKETPLACE_ID } from "./paths.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WooCommerceApiRequest, WooCommerceApiResponse, RouteWooCommerceApiInput } from "./types.js";

export class WooCommerceRequestRouter {
  constructor(
    private readonly apiClient: WooCommerceApiClient,
    private readonly responseHandler: WooCommerceResponseHandler,
    private readonly rateLimitManager: WooCommerceRateLimitManager,
    private readonly retryManager: WooCommerceRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
    private storeUrl: string | null = null,
  ) {}

  setStoreUrl(storeUrl: string | null): void {
    this.storeUrl = storeUrl;
  }

  async route(
    input: RouteWooCommerceApiInput,
    config: WooCommerceMarketplaceIntegrationConfiguration,
  ): Promise<{ request: WooCommerceApiRequest; response: WooCommerceApiResponse; rateLimited: boolean }> {
    const requestId = `woo-req-${randomUUID()}`;
    const request: WooCommerceApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendWooCommerceLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "WooCommerce rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: WOOCOMMERCE_MARKETPLACE_ID,
          method: input.method,
          path: input.path,
        });
      } catch {
        /* framework routing optional when connector not active */
      }
    }

    const { result, attempts } = await this.retryManager.execute(
      async () =>
        this.apiClient.simulateRequest(input.method, input.path, config, this.storeUrl),
      config,
    );

    if (attempts > 1) {
      appendWooCommerceLog({
        event: "retry_attempt",
        level: "warn",
        details: `WooCommerce request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendWooCommerceLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
