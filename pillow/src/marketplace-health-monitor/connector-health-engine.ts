/** R1-14 — Connector health engine. */

import type { MarketplaceConnectorRecord } from "../marketplace-connector-framework/types.js";
import { MHM_METADATA_VERSION, SUPPORTED_MARKETPLACE_IDENTIFIERS } from "./paths.js";
import type { HealthStatus } from "./types.js";

export class ConnectorHealthEngine {
  isSupportedMarketplace(marketplaceIdentifier: string): boolean {
    return (SUPPORTED_MARKETPLACE_IDENTIFIERS as readonly string[]).includes(marketplaceIdentifier);
  }

  buildHealthRecordId(marketplaceIdentifier: string): string {
    return `mhm-${marketplaceIdentifier}-${Date.now()}`;
  }

  resolveConnectorId(
    marketplaceIdentifier: string,
    connectors: MarketplaceConnectorRecord[],
  ): string | null {
    const match = connectors.find((c) => c.marketplaceIdentifier === marketplaceIdentifier);
    return match?.connectorId ?? null;
  }

  resolveOverallHealth(input: {
    authenticationStatus: string;
    apiAvailability: string;
    apiErrorRate: number;
    rateLimitStatus: string;
    hasActiveAlerts: boolean;
    connectorRegistered: boolean;
  }): HealthStatus {
    if (input.authenticationStatus === "failed" || input.apiAvailability === "unavailable") {
      return "failed";
    }
    if (!input.connectorRegistered) return "standby";
    if (
      input.apiAvailability === "degraded" ||
      input.apiErrorRate > 0.05 ||
      input.rateLimitStatus === "throttled" ||
      input.hasActiveAlerts
    ) {
      return "degraded";
    }
    return "healthy";
  }

  getMetadataVersion(): string {
    return MHM_METADATA_VERSION;
  }
}
