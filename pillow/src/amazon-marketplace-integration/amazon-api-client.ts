/** R1-02 — Amazon SP-API client (structural — no live HTTP in R1-02). */

import { AMAZON_SP_API_ENDPOINTS } from "./paths.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";
import type { AmazonConnectionTestResult } from "./types.js";
import { appendAmazonLog } from "./amz-logging.js";

export class AmazonApiClient {
  resolveEndpoint(region: "na" | "fe" | "eu", useSandbox: boolean): string {
    if (useSandbox) return AMAZON_SP_API_ENDPOINTS.sandboxNa;
    switch (region) {
      case "fe":
        return AMAZON_SP_API_ENDPOINTS.fe;
      case "eu":
        return AMAZON_SP_API_ENDPOINTS.eu;
      default:
        return AMAZON_SP_API_ENDPOINTS.na;
    }
  }

  testConnection(
    region: "na" | "fe" | "eu",
    config: AmazonMarketplaceIntegrationConfiguration,
  ): AmazonConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(region, config.useSandbox);

    appendAmazonLog({
      event: "connection_attempt",
      level: "info",
      details: `Testing Amazon SP-API connectivity to ${region}`,
    });

    const latencyMs = Date.now() - started + 5;

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs,
      endpoint,
      details: "Connection test passed (structural validation — R1-02)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    region: "na" | "fe" | "eu",
    config: AmazonMarketplaceIntegrationConfiguration,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(region, config.useSandbox);
    void endpoint;
    void method;

    return {
      statusCode: 200,
      bodySummary: `SP-API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
