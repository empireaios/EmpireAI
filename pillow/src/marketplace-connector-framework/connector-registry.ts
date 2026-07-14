/** R1-01 — Dynamic connector registry. */

import { appendFrameworkLog } from "./mcf-logging.js";
import type {
  ConnectorState,
  MarketplaceConnectorDefinition,
  MarketplaceConnectorRecord,
} from "./types.js";
import { CONNECTOR_METADATA_VERSION } from "./paths.js";

export class ConnectorRegistry {
  private connectors = new Map<string, MarketplaceConnectorRecord>();

  register(definition: MarketplaceConnectorDefinition): MarketplaceConnectorRecord {
    const record: MarketplaceConnectorRecord = {
      connectorId: `mcf-${definition.marketplaceId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      marketplaceIdentifier: definition.marketplaceId,
      connectorVersion: definition.connectorVersion,
      connectorType: definition.connectorType,
      authenticationMethod: definition.authenticationMethod,
      apiEndpointConfiguration: { ...definition.apiEndpointConfig },
      webhookConfiguration: { ...definition.webhookConfig },
      rateLimitConfiguration: { ...definition.rateLimitConfig },
      retryConfiguration: { ...definition.retryConfig },
      healthStatus: "healthy",
      currentState: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      metadataVersion: CONNECTOR_METADATA_VERSION,
      credentialRefPresent: Boolean(definition.credentialRef),
    };
    this.connectors.set(definition.marketplaceId, record);
    appendFrameworkLog({
      event: "connector_registration",
      level: "info",
      details: `Registered connector ${definition.marketplaceId} (${definition.connectorType})`,
    });
    return record;
  }

  get(marketplaceId: string): MarketplaceConnectorRecord | null {
    return this.connectors.get(marketplaceId) ?? null;
  }

  list(): MarketplaceConnectorRecord[] {
    return [...this.connectors.values()];
  }

  updateState(marketplaceId: string, state: ConnectorState): MarketplaceConnectorRecord | null {
    const record = this.connectors.get(marketplaceId);
    if (!record) return null;
    record.currentState = state;
    record.timestamp = new Date().toISOString();
    if (state === "failed") record.healthStatus = "failed";
    else if (state === "suspended") record.healthStatus = "degraded";
    else if (state === "active") record.healthStatus = "healthy";
    return record;
  }

  remove(marketplaceId: string): boolean {
    return this.connectors.delete(marketplaceId);
  }

  resetForTesting(): void {
    this.connectors.clear();
  }
}
