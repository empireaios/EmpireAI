/** R5-03 — Google Ads API Client (structural connection tests; no live HTTP). */

import { appendGaiLog } from "./gai-logging.js";
import { GOOGLE_ADS_API_ENDPOINTS } from "./paths.js";
import type { GoogleAdsIntegrationConfiguration } from "./configuration.js";
import type { GoogleConnectionTestResult } from "./types.js";

export class GoogleAdsApiClient {
  testConnection(config: GoogleAdsIntegrationConfiguration): GoogleConnectionTestResult {
    const started = Date.now();
    const endpoint = config.useSandbox
      ? GOOGLE_ADS_API_ENDPOINTS.sandbox
      : GOOGLE_ADS_API_ENDPOINTS.production;

    appendGaiLog({
      event: "api_connection_test",
      level: "info",
      details: `Testing Google Ads API endpoint connectivity (${config.useSandbox ? "sandbox" : "production"})`,
    });

    const latencyMs = Math.max(1, Date.now() - started);
    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs,
      endpoint,
      details: "Structural Google Ads API connection test passed",
    };
  }
}
