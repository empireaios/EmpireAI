/** X1-01 — Company module registry. */

import { appendFrameworkLog } from "./cff-logging.js";
import { COMPANY_FACTORY_METADATA_VERSION } from "./paths.js";
import type {
  CompanyModuleDefinition,
  CompanyFactoryFrameworkRecord,
  ModuleState,
  ValidationStatus,
} from "./types.js";

export class CompanyModuleRegistry {
  private modules = new Map<string, CompanyFactoryFrameworkRecord>();

  register(definition: CompanyModuleDefinition): CompanyFactoryFrameworkRecord {
    const record: CompanyFactoryFrameworkRecord = {
      frameworkId: `cff-${definition.companyModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companyModuleIdentifier: definition.companyModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      moduleStatus: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      metadataVersion: COMPANY_FACTORY_METADATA_VERSION,
      moduleType: definition.moduleType,
      authenticationMethod: definition.authenticationMethod,
      apiEndpointConfiguration: { ...definition.apiEndpointConfig },
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      rateLimitConfiguration: { ...definition.rateLimitConfig },
      retryConfiguration: { ...definition.retryConfig },
      credentialRefPresent: Boolean(definition.credentialRef),
    };
    this.modules.set(definition.companyModuleIdentifier, record);
    appendFrameworkLog({
      event: "company_module_registration",
      level: "info",
      details: `Registered module ${definition.companyModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(companyModuleIdentifier: string): CompanyFactoryFrameworkRecord | null {
    return this.modules.get(companyModuleIdentifier) ?? null;
  }

  list(): CompanyFactoryFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    companyModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): CompanyFactoryFrameworkRecord | null {
    const record = this.modules.get(companyModuleIdentifier);
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

  remove(companyModuleIdentifier: string): boolean {
    return this.modules.delete(companyModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
