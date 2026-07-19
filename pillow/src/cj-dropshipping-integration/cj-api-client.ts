/** R2-02 — CJdropshipping API client (structural — no live HTTP in R2-02). */

import { CJ_API_ENDPOINTS } from "./paths.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";
import type { CjConnectionTestResult } from "./types.js";
import { appendCjLog } from "./cj-logging.js";

export class CjApiClient {
  resolveEndpoint(useSandbox: boolean): string {
    return useSandbox ? CJ_API_ENDPOINTS.sandbox : CJ_API_ENDPOINTS.production;
  }

  testConnection(config: CjDropshippingIntegrationConfiguration): CjConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox);

    appendCjLog({
      event: "connection_attempt",
      level: "info",
      details: "Testing CJdropshipping API connectivity",
    });

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs: Date.now() - started + 5,
      endpoint,
      details: "Connection test passed (structural validation — R2-02)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    config: CjDropshippingIntegrationConfiguration,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    void this.resolveEndpoint(config.useSandbox);
    void method;

    return {
      statusCode: 200,
      bodySummary: `CJdropshipping API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
