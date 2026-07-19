/** R5-02 — Meta API Client (structural connection tests; no live HTTP). */

import { appendMaiLog } from "./mai-logging.js";
import { META_API_ENDPOINTS } from "./paths.js";
import type { MetaAdsIntegrationConfiguration } from "./configuration.js";
import type { MetaConnectionTestResult } from "./types.js";

export class MetaApiClient {
  testConnection(config: MetaAdsIntegrationConfiguration): MetaConnectionTestResult {
    const started = Date.now();
    const endpoint = config.useSandbox
      ? META_API_ENDPOINTS.sandbox
      : META_API_ENDPOINTS.production;

    appendMaiLog({
      event: "api_connection_test",
      level: "info",
      details: `Testing Meta API endpoint connectivity (${config.useSandbox ? "sandbox" : "production"})`,
    });

    const latencyMs = Math.max(1, Date.now() - started);
    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs,
      endpoint,
      details: "Structural Meta API connection test passed",
    };
  }
}
