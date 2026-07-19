/** R3-01 — Financial module registry. */

import { appendFrameworkLog } from "./ff-logging.js";
import { FINANCIAL_METADATA_VERSION } from "./paths.js";
import type {
  FinancialModuleDefinition,
  FinancialFrameworkRecord,
  ModuleState,
  ValidationStatus,
} from "./types.js";

export class FinancialModuleRegistry {
  private modules = new Map<string, FinancialFrameworkRecord>();

  register(definition: FinancialModuleDefinition): FinancialFrameworkRecord {
    const record: FinancialFrameworkRecord = {
      frameworkId: `ff-${definition.financialModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      financialModuleIdentifier: definition.financialModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      moduleStatus: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      metadataVersion: FINANCIAL_METADATA_VERSION,
      moduleType: definition.moduleType,
      authenticationMethod: definition.authenticationMethod,
      apiEndpointConfiguration: { ...definition.apiEndpointConfig },
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      rateLimitConfiguration: { ...definition.rateLimitConfig },
      retryConfiguration: { ...definition.retryConfig },
      credentialRefPresent: Boolean(definition.credentialRef),
    };
    this.modules.set(definition.financialModuleIdentifier, record);
    appendFrameworkLog({
      event: "financial_module_registration",
      level: "info",
      details: `Registered module ${definition.financialModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(financialModuleIdentifier: string): FinancialFrameworkRecord | null {
    return this.modules.get(financialModuleIdentifier) ?? null;
  }

  list(): FinancialFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    financialModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): FinancialFrameworkRecord | null {
    const record = this.modules.get(financialModuleIdentifier);
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

  remove(financialModuleIdentifier: string): boolean {
    return this.modules.delete(financialModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
