/** X4-01 — Scaling module registry. */

import { appendGefLog } from "./gef-logging.js";
import { GEF_METADATA_VERSION } from "./paths.js";
import type {
  GlobalExpansionFrameworkRecord,
  ModuleState,
  ExpansionModuleDefinition,
  ValidationStatus,
} from "./types.js";

export class GlobalModuleRegistry {
  private modules = new Map<string, GlobalExpansionFrameworkRecord>();

  register(definition: ExpansionModuleDefinition): GlobalExpansionFrameworkRecord {
    const record: GlobalExpansionFrameworkRecord = {
      expansionFrameworkId: `gef-${definition.expansionModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      expansionModuleIdentifier: definition.expansionModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      metadataVersion: GEF_METADATA_VERSION,
      moduleType: definition.moduleType,
      moduleStatus: "registered",
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      retryConfiguration: { ...definition.retryConfig },
      structuralSignalOnly: true,
      bypassedValidation: false,
    };
    this.modules.set(definition.expansionModuleIdentifier, record);
    appendGefLog({
      event: "global_expansion_module_registration",
      level: "info",
      details: `Registered expansion module ${definition.expansionModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(expansionModuleIdentifier: string): GlobalExpansionFrameworkRecord | null {
    return this.modules.get(expansionModuleIdentifier) ?? null;
  }

  list(): GlobalExpansionFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    expansionModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): GlobalExpansionFrameworkRecord | null {
    const record = this.modules.get(expansionModuleIdentifier);
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

  remove(expansionModuleIdentifier: string): boolean {
    return this.modules.delete(expansionModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
