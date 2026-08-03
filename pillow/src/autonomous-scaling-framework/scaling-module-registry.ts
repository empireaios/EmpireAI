/** X3-01 — Scaling module registry. */

import { appendAsfLog } from "./asf-logging.js";
import { ASF_METADATA_VERSION } from "./paths.js";
import type {
  AutonomousScalingFrameworkRecord,
  ModuleState,
  ScalingModuleDefinition,
  ValidationStatus,
} from "./types.js";

export class ScalingModuleRegistry {
  private modules = new Map<string, AutonomousScalingFrameworkRecord>();

  register(definition: ScalingModuleDefinition): AutonomousScalingFrameworkRecord {
    const record: AutonomousScalingFrameworkRecord = {
      scalingFrameworkId: `asf-${definition.scalingModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      scalingModuleIdentifier: definition.scalingModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      metadataVersion: ASF_METADATA_VERSION,
      moduleType: definition.moduleType,
      moduleStatus: "registered",
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      retryConfiguration: { ...definition.retryConfig },
      structuralSignalOnly: true,
      bypassedValidation: false,
    };
    this.modules.set(definition.scalingModuleIdentifier, record);
    appendAsfLog({
      event: "scaling_module_registration",
      level: "info",
      details: `Registered scaling module ${definition.scalingModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(scalingModuleIdentifier: string): AutonomousScalingFrameworkRecord | null {
    return this.modules.get(scalingModuleIdentifier) ?? null;
  }

  list(): AutonomousScalingFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    scalingModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): AutonomousScalingFrameworkRecord | null {
    const record = this.modules.get(scalingModuleIdentifier);
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

  remove(scalingModuleIdentifier: string): boolean {
    return this.modules.delete(scalingModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
