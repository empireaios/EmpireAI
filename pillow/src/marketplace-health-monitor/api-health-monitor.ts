/** R1-14 — API health monitor. */

import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type { ApiAvailabilityStatus } from "./types.js";
import type { MarketplaceHealthFixture } from "./marketplace-health-fixtures.js";

export class ApiHealthMonitor {
  assess(
    fixture: MarketplaceHealthFixture,
    config: MarketplaceHealthMonitorConfiguration,
  ): {
    apiAvailability: ApiAvailabilityStatus;
    apiLatencyMs: number;
    apiErrorRate: number;
    rateLimitStatus: string;
  } {
    let apiAvailability = fixture.apiAvailability;
    let apiLatencyMs = fixture.apiLatencyMs;
    let apiErrorRate = fixture.apiErrorRate;
    let rateLimitStatus = fixture.rateLimitStatus;

    if (config.performanceThresholdsEnabled) {
      if (apiLatencyMs > config.apiLatencyThresholdMs) {
        apiAvailability = apiAvailability === "available" ? "degraded" : apiAvailability;
      }
      if (apiErrorRate > config.apiErrorRateThreshold) {
        apiAvailability = "degraded";
      }
    }

    return { apiAvailability, apiLatencyMs, apiErrorRate, rateLimitStatus };
  }
}
