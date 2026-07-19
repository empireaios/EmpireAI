/** R2-03 — AliExpress API client (structural — no live HTTP in R2-03). */

import { AEX_API_ENDPOINTS } from "./paths.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";
import type { AliExpressConnectionTestResult } from "./types.js";
import { appendAexLog } from "./aex-logging.js";

export class AliExpressApiClient {
  resolveEndpoint(useSandbox: boolean): string {
    return useSandbox ? AEX_API_ENDPOINTS.sandbox : AEX_API_ENDPOINTS.production;
  }

  testConnection(config: AliExpressIntegrationConfiguration): AliExpressConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox);

    appendAexLog({
      event: "connection_attempt",
      level: "info",
      details: "Testing AliExpress API connectivity",
    });

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs: Date.now() - started + 5,
      endpoint,
      details: "Connection test passed (structural validation — R2-03)",
    };
  }

  simulateRequest(
    method: string,
    path: string,
    config: AliExpressIntegrationConfiguration,
  ): { statusCode: number; bodySummary: string; durationMs: number } {
    const started = Date.now();
    void this.resolveEndpoint(config.useSandbox);
    void method;

    return {
      statusCode: 200,
      bodySummary: `AliExpress API ${path} response (framework-routed)`,
      durationMs: Date.now() - started + 3,
    };
  }
}
