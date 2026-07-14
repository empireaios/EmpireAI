/** R1-01 — Marketplace API abstraction adapter. */

import { randomUUID } from "node:crypto";
import { appendFrameworkLog } from "./mcf-logging.js";
import type { AuthenticationAdapter } from "./authentication-adapter.js";
import type { RateLimitManager } from "./rate-limit-manager.js";
import type { RetryManager } from "./retry-manager.js";
import type { ResponseNormalizationEngine } from "./response-normalization-engine.js";
import type { ConnectorRegistry } from "./connector-registry.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";
import type { NormalizedApiRequest, NormalizedApiResponse, RouteApiRequestInput } from "./types.js";

export class MarketplaceApiAdapter {
  constructor(
    private readonly registry: ConnectorRegistry,
    private readonly authAdapter: AuthenticationAdapter,
    private readonly rateLimitManager: RateLimitManager,
    private readonly retryManager: RetryManager,
    private readonly normalizer: ResponseNormalizationEngine,
  ) {}

  async routeRequest(
    input: RouteApiRequestInput,
    config: MarketplaceConnectorFrameworkConfiguration,
  ): Promise<{ request: NormalizedApiRequest; response: NormalizedApiResponse; rateLimited: boolean }> {
    const record = this.registry.get(input.marketplaceId);
    if (!record) {
      throw new Error(`Connector not registered: ${input.marketplaceId}`);
    }
    if (record.currentState !== "active" && record.currentState !== "initialized") {
      throw new Error(`Connector not routable in state: ${record.currentState}`);
    }

    const requestId = `mcf-req-${randomUUID()}`;
    const safeHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.headers ?? {})) {
      if (/authorization|token|secret/i.test(key)) safeHeaders[key] = "[redacted]";
      else safeHeaders[key] = value;
    }

    const request: NormalizedApiRequest = {
      requestId,
      marketplaceId: input.marketplaceId,
      method: input.method.toUpperCase(),
      path: input.path,
      headers: safeHeaders,
      query: input.query ?? {},
      bodyRef: null,
      timestamp: new Date().toISOString(),
    };

    appendFrameworkLog({
      event: "api_request",
      level: "info",
      details: `${request.method} ${request.path} → ${input.marketplaceId}`,
    });

    const rateCheck = this.rateLimitManager.check(record);
    if (!rateCheck.allowed) {
      const response = this.normalizer.normalizeError(
        input.marketplaceId,
        requestId,
        "RATE_LIMITED",
        "Rate limit exceeded",
      );
      appendFrameworkLog({ event: "api_response", level: "warn", details: `Rate limited ${requestId}` });
      return { request, response, rateLimited: true };
    }

    const auth = this.authAdapter.authenticate(
      {
        marketplaceId: input.marketplaceId,
        method: record.authenticationMethod,
        credentialRef: record.credentialRefPresent ? `vault://${input.marketplaceId}` : null,
      },
      config,
    );

    if (!auth.authenticated && config.authenticationRulesEnabled) {
      const response = this.normalizer.normalizeError(
        input.marketplaceId,
        requestId,
        "AUTH_FAILED",
        "Authentication failed",
      );
      return { request, response, rateLimited: false };
    }

    const started = Date.now();
    const { result: statusCode } = await this.retryManager.executeWithRetry(
      record,
      async () => 200,
      (err) => err instanceof Error && err.message.includes("timeout"),
    );

    const response = this.normalizer.normalize({
      requestId,
      marketplaceId: input.marketplaceId,
      statusCode,
      headers: { "x-mcf-routed": "true" },
      bodySummary: "Framework-routed response (no live marketplace API in R1-01)",
      errorCode: null,
      durationMs: Date.now() - started,
    });

    appendFrameworkLog({
      event: "api_response",
      level: "info",
      details: `${requestId} → ${statusCode} (${response.durationMs}ms)`,
    });

    return { request, response, rateLimited: false };
  }
}
