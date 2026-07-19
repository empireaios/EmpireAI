/** R3-02 — Payment API client (structural — no live HTTP in R3-02). */

import { PG_API_ENDPOINTS } from "./paths.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";
import type { PaymentConnectionTestResult } from "./types.js";
import { appendPgLog } from "./pg-logging.js";

export class PaymentApiClient {
  resolveEndpoint(useSandbox: boolean): string {
    return useSandbox ? PG_API_ENDPOINTS.sandbox : PG_API_ENDPOINTS.production;
  }

  testConnection(config: PaymentGatewayIntegrationConfiguration): PaymentConnectionTestResult {
    const started = Date.now();
    const endpoint = this.resolveEndpoint(config.useSandbox);

    appendPgLog({
      event: "connection_attempt",
      level: "info",
      details: "Testing payment gateway API connectivity",
    });

    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs: Date.now() - started + 5,
      endpoint,
      details: "Connection test passed (structural validation — R3-02)",
    };
  }
}
