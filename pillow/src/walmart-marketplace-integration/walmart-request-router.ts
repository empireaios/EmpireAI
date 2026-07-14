/** R1-06 — Walmart API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendWalmartLog } from "./wmt-logging.js";
import type { WalmartApiClient } from "./walmart-api-client.js";
import type { WalmartRateLimitManager } from "./walmart-rate-limit-manager.js";
import type { WalmartRetryManager } from "./walmart-retry-manager.js";
import type { WalmartResponseHandler } from "./walmart-response-handler.js";
import { WALMART_MARKETPLACE_ID } from "./paths.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WalmartApiRequest, WalmartApiResponse, RouteWalmartApiInput } from "./types.js";

export class WalmartRequestRouter {
  constructor(
    private readonly apiClient: WalmartApiClient,
    private readonly responseHandler: WalmartResponseHandler,
    private readonly rateLimitManager: WalmartRateLimitManager,
    private readonly retryManager: WalmartRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
  ) {}

  async route(
    input: RouteWalmartApiInput,
    config: WalmartMarketplaceIntegrationConfiguration,
  ): Promise<{ request: WalmartApiRequest; response: WalmartApiResponse; rateLimited: boolean }> {
    const requestId = `wmt-req-${randomUUID()}`;
    const request: WalmartApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendWalmartLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(requestId, "RATE_LIMITED", "Walmart rate limit exceeded");
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: WALMART_MARKETPLACE_ID,
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
      appendWalmartLog({
        event: "retry_attempt",
        level: "warn",
        details: `Walmart request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendWalmartLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
