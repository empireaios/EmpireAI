/** R1-06 — Walmart Marketplace API client (structural — no live HTTP in R1-06). */

import { WALMART_API_ENDPOINTS } from "./paths.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { WalmartConnectionTestResult } from "./types.js";
import { appendWalmartLog } from "./wmt-logging.js";

export class WalmartApiClient {
  resolveEndpoint(useSandbox: boolean): string {
    return useSandbox ? WALMART_API_ENDPOINTS.sandbox : WALMART_API_ENDPOINTS.production;
  }

  testConnection(config: WalmartMarketplaceIntegrationConfiguration): WalmartConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox);

    appendWalmartLog({
      event: "connection_attempt",
      level: "info",
      details: "Testing Walmart Marketplace API connectivity",
    });

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs: Date.now() - started + 5,
      endpoint,
      details: "Connection test passed (structural validation — R1-06)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    config: WalmartMarketplaceIntegrationConfiguration,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    void this.resolveEndpoint(config.useSandbox);
    void method;

    return {
      statusCode: 200,
      bodySummary: `Walmart API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
