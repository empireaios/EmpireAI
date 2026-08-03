import { EIF_METADATA_VERSION } from "./paths.js";
import type { EmpireIntelligenceFrameworkRecord, IntelligenceModuleDefinition, ModuleState } from "./types.js";
export class EmpireIntelligenceModuleRegistry {
  private readonly modules = new Map<string, EmpireIntelligenceFrameworkRecord>();
  list(): EmpireIntelligenceFrameworkRecord[] { return [...this.modules.values()]; }
  get(id: string): EmpireIntelligenceFrameworkRecord|undefined { return this.modules.get(id); }
  register(definition: IntelligenceModuleDefinition): EmpireIntelligenceFrameworkRecord {
    const record: EmpireIntelligenceFrameworkRecord = { frameworkId: `eif-${Date.now()}-${this.modules.size + 1}`,
      timestamp: new Date().toISOString(), intelligenceModuleIdentifier: definition.intelligenceModuleIdentifier,
      moduleVersion: definition.moduleVersion, moduleStatus: "initialized", supportedCapabilities: definition.supportedCapabilities,
      validationStatus: "pass", healthStatus: "healthy", operationalState: "initialized", metadataVersion: EIF_METADATA_VERSION,
      moduleType: definition.moduleType, structuralSignalOnly: true, bypassedValidation: false,
      auditabilityPreserved: true, recoveryCapable: true };
    this.modules.set(record.intelligenceModuleIdentifier, record); return record;
  }
  setState(id: string, state: ModuleState): EmpireIntelligenceFrameworkRecord|undefined {
    const record = this.modules.get(id); if (!record) return undefined;
    record.moduleStatus = state; record.operationalState = state; return record;
  }
  resetForTesting(): void { this.modules.clear(); }
}
