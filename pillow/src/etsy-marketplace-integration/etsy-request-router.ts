/** R1-07 — Etsy API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendEtsyLog } from "./etsy-logging.js";
import type { EtsyApiClient } from "./etsy-api-client.js";
import type { EtsyRateLimitManager } from "./etsy-rate-limit-manager.js";
import type { EtsyRetryManager } from "./etsy-retry-manager.js";
import type { EtsyResponseHandler } from "./etsy-response-handler.js";
import { ETSY_MARKETPLACE_ID } from "./paths.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { EtsyApiRequest, EtsyApiResponse, RouteEtsyApiInput } from "./types.js";

export class EtsyRequestRouter {
  constructor(
    private readonly apiClient: EtsyApiClient,
    private readonly responseHandler: EtsyResponseHandler,
    private readonly rateLimitManager: EtsyRateLimitManager,
    private readonly retryManager: EtsyRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
  ) {}

  async route(
    input: RouteEtsyApiInput,
    config: EtsyMarketplaceIntegrationConfiguration,
  ): Promise<{ request: EtsyApiRequest; response: EtsyApiResponse; rateLimited: boolean }> {
    const requestId = `etsy-req-${randomUUID()}`;
    const request: EtsyApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendEtsyLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "Etsy rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: ETSY_MARKETPLACE_ID,
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
      appendEtsyLog({
        event: "retry_attempt",
        level: "warn",
        details: `Etsy request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendEtsyLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
