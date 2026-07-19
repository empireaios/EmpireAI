/** R1-08 — eBay API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendEbayLog } from "./ebay-logging.js";
import type { EbayApiClient } from "./ebay-api-client.js";
import type { EbayRateLimitManager } from "./ebay-rate-limit-manager.js";
import type { EbayRetryManager } from "./ebay-retry-manager.js";
import type { EbayResponseHandler } from "./ebay-response-handler.js";
import { EBAY_MARKETPLACE_ID } from "./paths.js";
import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EbayApiRequest, EbayApiResponse, RouteEbayApiInput } from "./types.js";

export class EbayRequestRouter {
  constructor(
    private readonly apiClient: EbayApiClient,
    private readonly responseHandler: EbayResponseHandler,
    private readonly rateLimitManager: EbayRateLimitManager,
    private readonly retryManager: EbayRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
  ) {}

  async route(
    input: RouteEbayApiInput,
    config: EbayMarketplaceIntegrationConfiguration,
  ): Promise<{ request: EbayApiRequest; response: EbayApiResponse; rateLimited: boolean }> {
    const requestId = `ebay-req-${randomUUID()}`;
    const request: EbayApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendEbayLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "eBay rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: EBAY_MARKETPLACE_ID,
          method: input.method,
          path: input.path,
        });
      } catch {
        /* framework routing optional when connector not active */
      }
    }

    const { result, attempts } = await this.retryManager.execute(
      async () => this.apiClient.simulateRequest(input.method, input.path, config),
      config,
    );

    if (attempts > 1) {
      appendEbayLog({
        event: "retry_attempt",
        level: "warn",
        details: `eBay request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendEbayLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
