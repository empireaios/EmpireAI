/** R5-01 — Marketing module registry. */

import { appendFrameworkLog } from "./mfw-logging.js";
import { MARKETING_METADATA_VERSION } from "./paths.js";
import type {
  MarketingModuleDefinition,
  MarketingFrameworkRecord,
  ModuleState,
  ValidationStatus,
} from "./types.js";

export class MarketingModuleRegistry {
  private modules = new Map<string, MarketingFrameworkRecord>();

  register(definition: MarketingModuleDefinition): MarketingFrameworkRecord {
    const record: MarketingFrameworkRecord = {
      frameworkId: `mfw-${definition.marketingModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      marketingModuleIdentifier: definition.marketingModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      moduleStatus: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      metadataVersion: MARKETING_METADATA_VERSION,
      moduleType: definition.moduleType,
      authenticationMethod: definition.authenticationMethod,
      apiEndpointConfiguration: { ...definition.apiEndpointConfig },
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      rateLimitConfiguration: { ...definition.rateLimitConfig },
      retryConfiguration: { ...definition.retryConfig },
      credentialRefPresent: Boolean(definition.credentialRef),
    };
    this.modules.set(definition.marketingModuleIdentifier, record);
    appendFrameworkLog({
      event: "marketing_module_registration",
      level: "info",
      details: `Registered module ${definition.marketingModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(marketingModuleIdentifier: string): MarketingFrameworkRecord | null {
    return this.modules.get(marketingModuleIdentifier) ?? null;
  }

  list(): MarketingFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    marketingModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): MarketingFrameworkRecord | null {
    const record = this.modules.get(marketingModuleIdentifier);
    if (!record) return null;
    record.moduleStatus = state;
    record.operationalState = state;
    record.timestamp = new Date().toISOString();
    if (validationStatus) record.validationStatus = validationStatus;
    if (state === "failed") record.healthStatus = "failed";
    else if (state === "suspended") record.healthStatus = "degraded";
    else if (state === "active") record.healthStatus = "healthy";
    return record;
  }

  remove(marketingModuleIdentifier: string): boolean {
    return this.modules.delete(marketingModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
