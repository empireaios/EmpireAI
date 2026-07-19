/** R2-02 — CJdropshipping API request router. */

import { randomUUID } from "node:crypto";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { appendCjLog } from "./cj-logging.js";
import type { CjApiClient } from "./cj-api-client.js";
import type { CjRateLimitManager } from "./cj-rate-limit-manager.js";
import type { CjRetryManager } from "./cj-retry-manager.js";
import type { CjResponseHandler } from "./cj-response-handler.js";
import { CJ_SUPPLIER_ID } from "./paths.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type { CjApiRequest, CjApiResponse, RouteCjApiInput } from "./types.js";

export class CjRequestRouter {
  constructor(
    private readonly apiClient: CjApiClient,
    private readonly responseHandler: CjResponseHandler,
    private readonly rateLimitManager: CjRateLimitManager,
    private readonly retryManager: CjRetryManager,
    private readonly framework: SupplierFrameworkEngine | null,
  ) {}

  async route(
    input: RouteCjApiInput,
    config: CjDropshippingIntegrationConfiguration,
  ): Promise<{ request: CjApiRequest; response: CjApiResponse; rateLimited: boolean }> {
    const requestId = `cj-req-${randomUUID()}`;
    const request: CjApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendCjLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "CJdropshipping rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        this.framework.routeSupplierEvent({
          supplierIdentifier: CJ_SUPPLIER_ID,
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
      appendCjLog({
        event: "retry_attempt",
        level: "warn",
        details: `CJdropshipping request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendCjLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
