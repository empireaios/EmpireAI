/** R2-01 — Supplier connector registry. */

import { appendFrameworkLog } from "./sf-logging.js";
import { SUPPLIER_METADATA_VERSION } from "./paths.js";
import type {
  ConnectorState,
  SupplierConnectorDefinition,
  SupplierFrameworkRecord,
  ValidationStatus,
} from "./types.js";

export class SupplierConnectorRegistry {
  private suppliers = new Map<string, SupplierFrameworkRecord>();

  register(definition: SupplierConnectorDefinition): SupplierFrameworkRecord {
    const record: SupplierFrameworkRecord = {
      frameworkId: `sf-${definition.supplierIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      supplierIdentifier: definition.supplierIdentifier,
      connectorVersion: definition.connectorVersion,
      connectorStatus: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      metadataVersion: SUPPLIER_METADATA_VERSION,
      connectorType: definition.connectorType,
      authenticationMethod: definition.authenticationMethod,
      apiEndpointConfiguration: { ...definition.apiEndpointConfig },
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      rateLimitConfiguration: { ...definition.rateLimitConfig },
      retryConfiguration: { ...definition.retryConfig },
      credentialRefPresent: Boolean(definition.credentialRef),
    };
    this.suppliers.set(definition.supplierIdentifier, record);
    appendFrameworkLog({
      event: "supplier_registration",
      level: "info",
      details: `Registered supplier ${definition.supplierIdentifier} (${definition.connectorType})`,
    });
    return record;
  }

  get(supplierIdentifier: string): SupplierFrameworkRecord | null {
    return this.suppliers.get(supplierIdentifier) ?? null;
  }

  list(): SupplierFrameworkRecord[] {
    return [...this.suppliers.values()];
  }

  updateState(
    supplierIdentifier: string,
    state: ConnectorState,
    validationStatus?: ValidationStatus,
  ): SupplierFrameworkRecord | null {
    const record = this.suppliers.get(supplierIdentifier);
    if (!record) return null;
    record.connectorStatus = state;
    record.operationalState = state;
    record.timestamp = new Date().toISOString();
    if (validationStatus) record.validationStatus = validationStatus;
    if (state === "failed") record.healthStatus = "failed";
    else if (state === "suspended") record.healthStatus = "degraded";
    else if (state === "active") record.healthStatus = "healthy";
    return record;
  }

  remove(supplierIdentifier: string): boolean {
    return this.suppliers.delete(supplierIdentifier);
  }

  resetForTesting(): void {
    this.suppliers.clear();
  }
}
