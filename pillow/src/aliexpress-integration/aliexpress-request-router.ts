/** R2-03 — AliExpress API request router. */

import { randomUUID } from "node:crypto";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { appendAexLog } from "./aex-logging.js";
import type { AliExpressApiClient } from "./aliexpress-api-client.js";
import type { AliExpressRateLimitManager } from "./aliexpress-rate-limit-manager.js";
import type { AliExpressRetryManager } from "./aliexpress-retry-manager.js";
import type { AliExpressResponseHandler } from "./aliexpress-response-handler.js";
import { AEX_SUPPLIER_ID } from "./paths.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type { AliExpressApiRequest, AliExpressApiResponse, RouteAliExpressApiInput } from "./types.js";

export class AliExpressRequestRouter {
  constructor(
    private readonly apiClient: AliExpressApiClient,
    private readonly responseHandler: AliExpressResponseHandler,
    private readonly rateLimitManager: AliExpressRateLimitManager,
    private readonly retryManager: AliExpressRetryManager,
    private readonly framework: SupplierFrameworkEngine | null,
  ) {}

  async route(
    input: RouteAliExpressApiInput,
    config: AliExpressIntegrationConfiguration,
  ): Promise<{ request: AliExpressApiRequest; response: AliExpressApiResponse; rateLimited: boolean }> {
    const requestId = `aex-req-${randomUUID()}`;
    const request: AliExpressApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendAexLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "AliExpress rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        this.framework.routeSupplierEvent({
          supplierIdentifier: AEX_SUPPLIER_ID,
          topic: `api.${input.method.toLowerCase()}`,
          payloadRef: requestId,
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
      appendAexLog({
        event: "retry_attempt",
        level: "warn",
        details: `AliExpress request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendAexLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
