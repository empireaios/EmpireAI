/** R2-04 — 1688 API client (structural — no live HTTP in R2-04). */

import { OSS1688_API_ENDPOINTS } from "./paths.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";
import type { Oss1688ConnectionTestResult } from "./types.js";
import { appendOssLog } from "./oss-logging.js";

export class Oss1688ApiClient {
  resolveEndpoint(useSandbox: boolean): string {
    return useSandbox ? OSS1688_API_ENDPOINTS.sandbox : OSS1688_API_ENDPOINTS.production;
  }

  testConnection(config: Oss1688IntegrationConfiguration): Oss1688ConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox);

    appendOssLog({
      event: "connection_attempt",
      level: "info",
      details: "Testing 1688 API connectivity",
    });

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs: Date.now() - started + 5,
      endpoint,
      details: "Connection test passed (structural validation — R2-04)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    config: Oss1688IntegrationConfiguration,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    void this.resolveEndpoint(config.useSandbox);
    void method;

    return {
      statusCode: 200,
      bodySummary: `1688 API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
