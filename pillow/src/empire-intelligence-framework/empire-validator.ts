import { EIF_METADATA_VERSION, FRAMEWORK_CAPABILITIES } from "./paths.js";
import type { EmpireIntelligenceFrameworkConfiguration } from "./configuration.js";
import type { EmpireIntelligenceFrameworkRecord, EmpireIntelligenceValidationReport, IntelligenceModuleDefinition } from "./types.js";

/** Registration plan only; no later X5 module is implemented by X5-01. */
export const PLANNED_EMPIRE_INTELLIGENCE_MODULES = [
  { id: "empire-intelligence-framework", mission: "X5-01", active: true },
  { id: "empire-knowledge-engine", mission: "X5-02", active: false },
  { id: "empire-memory-engine", mission: "X5-03", active: false },
  { id: "empire-optimization-engine", mission: "X5-04", active: false },
  { id: "empire-capital-allocation", mission: "X5-05", active: false },
  { id: "empire-opportunity-engine", mission: "X5-06", active: false },
  { id: "empire-innovation-engine", mission: "X5-07", active: false },
  { id: "empire-resilience-engine", mission: "X5-08", active: false },
  { id: "empire-self-improvement-engine", mission: "X5-09", active: false },
  { id: "executive-empire-dashboard", mission: "X5-10", active: false },
  { id: "cross-empire-governance-engine", mission: "X5-11", active: false },
  { id: "autonomous-investment-engine", mission: "X5-12", active: false },
  { id: "enterprise-succession-engine", mission: "X5-13", active: false },
  { id: "empire-legacy-engine", mission: "X5-14", active: false },
  { id: "grand-king-advisory-engine", mission: "X5-15", active: false },
  { id: "civilization-knowledge-engine", mission: "X5-16", active: false },
  { id: "autonomous-empire-evolution", mission: "X5-17", active: false },
  { id: "empire-performance-guardian", mission: "X5-18", active: false },
  { id: "infinite-growth-engine", mission: "X5-19", active: false },
  { id: "empire-certified", mission: "X5-20", active: false },
] as const;
export class EmpireValidator {
  validateDefinition(definition: IntelligenceModuleDefinition, config: EmpireIntelligenceFrameworkConfiguration): EmpireIntelligenceValidationReport {
    const started = Date.now(), errors: string[] = [], warnings: string[] = [];
    if (!definition.intelligenceModuleIdentifier?.trim()) errors.push("Missing intelligence module identifier");
    if (!definition.moduleVersion) errors.push("Missing module version");
    if (!definition.supportedCapabilities.length) warnings.push("No supported capabilities declared");
    if (!config.preserveModuleIsolation) errors.push("Module isolation must remain enabled");
    return this.report(errors, warnings, null, started);
  }
  validateRecord(record: EmpireIntelligenceFrameworkRecord): EmpireIntelligenceValidationReport {
    const errors: string[] = [], warnings: string[] = [];
    if (!record.frameworkId.startsWith("eif-")) errors.push("Invalid framework ID prefix");
    if (record.bypassedValidation) errors.push("Validation bypass is forbidden");
    if (record.healthStatus === "failed") warnings.push("Module health is failed");
    return this.report(errors, warnings, record.frameworkId, Date.now());
  }
  private report(errors: string[], warnings: string[], frameworkId: string|null, started: number): EmpireIntelligenceValidationReport {
    return { validationReportId: `eif-val-${Date.now()}`, validationTimestamp: new Date().toISOString(),
      decision: errors.length ? "fail" : warnings.length ? "partial" : "pass", frameworkId, errors, warnings,
      durationMs: Date.now() - started, metadataVersion: EIF_METADATA_VERSION };
  }
}
export { FRAMEWORK_CAPABILITIES };
