/** R1-02 — Amazon API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendAmazonLog } from "./amz-logging.js";
import type { AmazonApiClient } from "./amazon-api-client.js";
import type { AmazonRateLimitManager } from "./amazon-rate-limit-manager.js";
import type { AmazonRetryManager } from "./amazon-retry-manager.js";
import type { AmazonResponseHandler } from "./amazon-response-handler.js";
import { AMAZON_MARKETPLACE_ID } from "./paths.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { AmazonApiRequest, AmazonApiResponse, RouteAmazonApiInput } from "./types.js";

export class AmazonRequestRouter {
  constructor(
    private readonly apiClient: AmazonApiClient,
    private readonly responseHandler: AmazonResponseHandler,
    private readonly rateLimitManager: AmazonRateLimitManager,
    private readonly retryManager: AmazonRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
  ) {}

  async route(
    input: RouteAmazonApiInput,
    region: "na" | "fe" | "eu",
    config: AmazonMarketplaceIntegrationConfiguration,
  ): Promise<{ request: AmazonApiRequest; response: AmazonApiResponse; rateLimited: boolean }> {
    const requestId = `amz-req-${randomUUID()}`;
    const request: AmazonApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      region,
      timestamp: new Date().toISOString(),
    };

    appendAmazonLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path} (region=${region})`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(requestId, "RATE_LIMITED", "Amazon rate limit exceeded");
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: AMAZON_MARKETPLACE_ID,
          method: input.method,
          path: input.path,
        });
      } catch {
        /* framework routing optional when connector not active */
      }
    }

    const { result, attempts } = await this.retryManager.execute(
      async () => this.apiClient.simulateRequest(input.method, input.path, region, config),
      config,
    );

    if (attempts > 1) {
      appendAmazonLog({
        event: "retry_attempt",
        level: "warn",
        details: `Amazon request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendAmazonLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
