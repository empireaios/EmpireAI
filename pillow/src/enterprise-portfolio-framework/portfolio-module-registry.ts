/** X2-01 — Portfolio module registry. */

import { appendEpfLog } from "./epf-logging.js";
import { EPF_METADATA_VERSION } from "./paths.js";
import type {
  EnterprisePortfolioFrameworkRecord,
  ModuleState,
  PortfolioModuleDefinition,
  ValidationStatus,
} from "./types.js";

export class PortfolioModuleRegistry {
  private modules = new Map<string, EnterprisePortfolioFrameworkRecord>();

  register(definition: PortfolioModuleDefinition): EnterprisePortfolioFrameworkRecord {
    const record: EnterprisePortfolioFrameworkRecord = {
      portfolioFrameworkId: `epf-${definition.portfolioModuleIdentifier}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      portfolioModuleIdentifier: definition.portfolioModuleIdentifier,
      moduleVersion: definition.moduleVersion,
      registeredCompanies: [],
      validationStatus: "pending",
      healthStatus: "healthy",
      operationalState: "registered",
      supportedCapabilities: [...definition.supportedCapabilities],
      metadataVersion: EPF_METADATA_VERSION,
      moduleType: definition.moduleType,
      moduleStatus: "registered",
      eventRoutingConfiguration: { ...definition.eventRoutingConfig },
      retryConfiguration: { ...definition.retryConfig },
      structuralSignalOnly: true,
      bypassedValidation: false,
    };
    this.modules.set(definition.portfolioModuleIdentifier, record);
    appendEpfLog({
      event: "portfolio_module_registration",
      level: "info",
      details: `Registered portfolio module ${definition.portfolioModuleIdentifier} (${definition.moduleType})`,
    });
    return record;
  }

  get(portfolioModuleIdentifier: string): EnterprisePortfolioFrameworkRecord | null {
    return this.modules.get(portfolioModuleIdentifier) ?? null;
  }

  list(): EnterprisePortfolioFrameworkRecord[] {
    return [...this.modules.values()];
  }

  updateState(
    portfolioModuleIdentifier: string,
    state: ModuleState,
    validationStatus?: ValidationStatus,
  ): EnterprisePortfolioFrameworkRecord | null {
    const record = this.modules.get(portfolioModuleIdentifier);
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

  attachCompany(
    portfolioModuleIdentifier: string,
    companyReference: string,
  ): EnterprisePortfolioFrameworkRecord | null {
    const record = this.modules.get(portfolioModuleIdentifier);
    if (!record) return null;
    if (!record.registeredCompanies.includes(companyReference)) {
      record.registeredCompanies.push(companyReference);
      record.timestamp = new Date().toISOString();
    }
    return record;
  }

  remove(portfolioModuleIdentifier: string): boolean {
    return this.modules.delete(portfolioModuleIdentifier);
  }

  resetForTesting(): void {
    this.modules.clear();
  }
}
