import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { EmpireMemoryEngineConfiguration } from "./configuration.js";
import { EME_CAPABILITIES, EME_METADATA_VERSION, EMPIRE_MEMORY_ENGINE_ID } from "./paths.js";
import type { EmpireMemoryEngineRecord, EmpireMemoryInput, EmpireMemoryRunReport, MemoryCategory, MemoryRecommendation, MemoryRecord, MemoryValidationReport } from "./types.js";

export type EmpireMemoryDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null; empireKnowledgeEngine?: EmpireKnowledgeEngine | null };
export class EmpireMemoryManager {
  private engineRecord: EmpireMemoryEngineRecord | null = null;
  private records: MemoryRecord[] = [];
  private recommendations: MemoryRecommendation[] = [];
  constructor(private readonly dependencies: EmpireMemoryDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getMemoryRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private validation(decision: MemoryValidationReport["decision"], errors: string[] = [], warnings: string[] = []): MemoryValidationReport {
    return { validationReportId: `eme-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision, errors, warnings, durationMs: 0, metadataVersion: EME_METADATA_VERSION };
  }
  private report(action: string, records: MemoryRecord[], validation: MemoryValidationReport): EmpireMemoryRunReport {
    return { memoryRunReportId: `eme-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, memoryRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EME_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, _config: EmpireMemoryEngineConfiguration): EmpireMemoryRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_MEMORY_ENGINE_ID, moduleVersion: "PILLOW-EME-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_MEMORY_ENGINE_ID, "start");
    }
    this.engineRecord = { engineRecordId: `eme-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_MEMORY_ENGINE_ID, engineVersion: "PILLOW-EME-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EME_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework), empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine) }, metadataVersion: EME_METADATA_VERSION };
    return this.report("connect", [], this.validation(framework ? "pass" : "partial", [], framework ? [] : ["Empire Intelligence Framework unavailable"]));
  }
  run(action: string, input: EmpireMemoryInput, _config: EmpireMemoryEngineConfiguration): EmpireMemoryRunReport {
    if (!this.engineRecord) throw new Error("Empire Memory Engine not connected — call connectEmpireMemoryEngine first");
    const existing = input.memoryRecordId ? this.records.find((record) => record.memoryRecordId === input.memoryRecordId) : undefined;
    if (existing?.validationStatus === "passed" && !input.authorizedHistoricalAlteration) {
      return this.report(action, [], this.validation("fail", ["Validated historical records require an explicit authorization claim before alteration"]));
    }
    if (existing?.validationStatus === "passed" && !input.authorizationClaim?.trim()) {
      return this.report(action, [], this.validation("fail", ["Historical alteration authorization claim is required"]));
    }
    if (action === "detect_duplicate_memory") {
      const duplicate = this.records.some((record) => record.companyReference === (input.companyReference?.trim() || "empire") && record.eventReference === (input.eventReference ?? null) && record.decisionReference === (input.decisionReference ?? null));
      return this.report(action, [], this.validation(duplicate ? "partial" : "pass", [], duplicate ? ["Potential duplicate memory detected"] : []));
    }
    if (action === "detect_memory_conflicts") {
      const conflicting = this.records.some((record) => record.eventReference && record.eventReference === input.eventReference && record.memoryCategory !== (input.memoryCategory ?? this.categoryFor(action)));
      return this.report(action, [], this.validation(conflicting ? "partial" : "pass", [], conflicting ? ["Potential memory classification conflict detected"] : []));
    }
    if (action === "recommend_organizational_memory") {
      this.recommendations = this.records.filter((record) => record.validationStatus === "passed").map((record) => ({ recommendationId: `eme-rec-${record.memoryRecordId}`, timestamp: new Date().toISOString(), companyReference: record.companyReference, recommendationSummary: `Review validated ${record.memoryCategory} memory`, memoryValue: record.importanceLevel, structuralSignalOnly: true, unvalidatedClaim: "none" }));
      return this.report(action, [], this.validation("pass"));
    }
    const validated = input.validated === true, category = input.memoryCategory ?? this.categoryFor(action);
    const record: MemoryRecord = { memoryRecordId: input.memoryRecordId ?? `eme-${Date.now()}-${category}`, timestamp: new Date().toISOString(), companyReference: input.companyReference?.trim() || "empire", memoryCategory: category, eventReference: input.eventReference ?? null, decisionReference: input.decisionReference ?? null, importanceLevel: Math.max(0, Math.min(100, input.importanceLevel ?? (validated ? 80 : 40))), validationStatus: validated ? "passed" : "partial", metadataVersion: EME_METADATA_VERSION, structuralSignalOnly: true, neverAlterValidatedHistoricalRecordsWithoutAuthorization: true, preserveHistoricalTraceability: true, preserveAuditability: true, memoryTraceId: `eme-trace-${Date.now()}`, unvalidatedClaim: "none", authorizedHistoricalAlteration: Boolean(existing && input.authorizedHistoricalAlteration && input.authorizationClaim?.trim()) };
    if (existing) this.records = this.records.map((item) => item.memoryRecordId === existing.memoryRecordId ? record : item); else this.records.push(record);
    this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    return this.report(action, [record], this.validation(validated ? "pass" : "partial", [], validated ? [] : ["Unvalidated structural signal retained"]));
  }
  diagnostics(config: EmpireMemoryEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, this.validation(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Engine disabled"])) : this.connect({}, config); }
  private categoryFor(action: string): MemoryCategory {
    if (action.includes("strategic")) return "strategic_decision"; if (action.includes("operational")) return "operational_decision";
    if (action.includes("outcome")) return "business_outcome"; if (action.includes("lesson")) return "lesson_learned";
    if (action.includes("historical")) return "historical_event"; if (action.includes("milestone")) return "enterprise_milestone";
    return "organizational_memory";
  }
}
