/** R2-04 — 1688 API request router. */

import { randomUUID } from "node:crypto";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import { appendOssLog } from "./oss-logging.js";
import type { Oss1688ApiClient } from "./oss1688-api-client.js";
import type { Oss1688RateLimitManager } from "./oss1688-rate-limit-manager.js";
import type { Oss1688RetryManager } from "./oss1688-retry-manager.js";
import type { Oss1688ResponseHandler } from "./oss1688-response-handler.js";
import { OSS1688_SUPPLIER_ID } from "./paths.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type { Oss1688ApiRequest, Oss1688ApiResponse, RouteOss1688ApiInput } from "./types.js";

export class Oss1688RequestRouter {
  constructor(
    private readonly apiClient: Oss1688ApiClient,
    private readonly responseHandler: Oss1688ResponseHandler,
    private readonly rateLimitManager: Oss1688RateLimitManager,
    private readonly retryManager: Oss1688RetryManager,
    private readonly framework: SupplierFrameworkEngine | null,
  ) {}

  async route(
    input: RouteOss1688ApiInput,
    config: Oss1688IntegrationConfiguration,
  ): Promise<{ request: Oss1688ApiRequest; response: Oss1688ApiResponse; rateLimited: boolean }> {
    const requestId = `oss-req-${randomUUID()}`;
    const request: Oss1688ApiRequest = {
      requestId,
      method: input.method.toUpperCase(),
      path: input.path,
      timestamp: new Date().toISOString(),
    };

    appendOssLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path}`,
    });

    const rateCheck = this.rateLimitManager.check(config);
    if (!rateCheck.allowed) {
      const response = this.responseHandler.normalizeError(
        requestId,
        "RATE_LIMITED",
        "1688 rate limit exceeded",
      );
      return { request, response, rateLimited: true };
    }

    if (this.framework) {
      try {
        this.framework.routeSupplierEvent({
          supplierIdentifier: OSS1688_SUPPLIER_ID,
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
      appendOssLog({
        event: "retry_attempt",
        level: "warn",
        details: `1688 request succeeded after ${attempts} attempts`,
      });
    }

    const response = this.responseHandler.normalize({
      requestId,
      statusCode: result.statusCode,
      bodySummary: result.bodySummary,
      errorCode: null,
      durationMs: result.durationMs,
    });

    appendOssLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${response.statusCode}`,
    });

    return { request, response, rateLimited: false };
  }
}
