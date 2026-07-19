/** R1-09 — TikTok Shop API request router. */

import { randomUUID } from "node:crypto";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import { appendTikTokShopLog } from "./tiktok-shop-logging.js";
import type { TikTokShopApiClient } from "./tiktok-shop-api-client.js";
import type { TikTokShopRateLimitManager } from "./tiktok-shop-rate-limit-manager.js";
import type { TikTokShopRetryManager } from "./tiktok-shop-retry-manager.js";
import type { TikTokShopResponseHandler } from "./tiktok-shop-response-handler.js";
import { TIKTOK_SHOP_MARKETPLACE_ID } from "./paths.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { TikTokShopApiRequest, TikTokShopApiResponse, RouteTikTokShopApiInput } from "./types.js";

export class TikTokShopRequestRouter {
  constructor(
    private readonly apiClient: TikTokShopApiClient,
    private readonly responseHandler: TikTokShopResponseHandler,
    private readonly rateLimitManager: TikTokShopRateLimitManager,
    private readonly retryManager: TikTokShopRetryManager,
    private readonly framework: MarketplaceConnectorFrameworkEngine | null,
  ) {}

  async route(
    input: RouteTikTokShopApiInput,
    config: TikTokShopMarketplaceIntegrationConfiguration,
  ): Promise<{ request: TikTokShopApiRequest; response: TikTokShopApiResponse; rateLimited: boolean }> {
    const requestId = `tts-req-${randomUUID()}`;
    const request: TikTokShopApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendTikTokShopLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "TikTok Shop rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        await this.framework.routeApiRequest({
          marketplaceId: TIKTOK_SHOP_MARKETPLACE_ID,
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
      appendTikTokShopLog({
        event: "retry_attempt",
        level: "warn",
        details: `TikTok Shop request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendTikTokShopLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
