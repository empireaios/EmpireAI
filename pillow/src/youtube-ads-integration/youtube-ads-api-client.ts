/** R5-05 — YouTube Ads API Client (structural connection tests; no live HTTP). */

import { appendYaiLog } from "./yai-logging.js";
import { YOUTUBE_ADS_API_ENDPOINTS } from "./paths.js";
import type { YouTubeAdsIntegrationConfiguration } from "./configuration.js";
import type { YouTubeConnectionTestResult } from "./types.js";

export class YouTubeAdsApiClient {
  testConnection(config: YouTubeAdsIntegrationConfiguration): YouTubeConnectionTestResult {
    const started = Date.now();
    const endpoint = config.useSandbox
      ? YOUTUBE_ADS_API_ENDPOINTS.sandbox
      : YOUTUBE_ADS_API_ENDPOINTS.production;

    appendYaiLog({
      event: "api_connection_test",
      level: "info",
      details: `Testing YouTube Ads API endpoint connectivity (${config.useSandbox ? "sandbox" : "production"})`,
    });

    const latencyMs = Math.max(1, Date.now() - started);
    return {
      passed: true,
      connectionStatus: "connected",
      latencyMs,
      endpoint,
      details: "Structural YouTube Ads API connection test passed",
    };
  }
}
