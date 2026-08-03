import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { EmpireMemoryEngine } from "../empire-memory-engine/engine.js";
import type { EmpireInnovationEngineConfiguration } from "./configuration.js";
import { EIN_CAPABILITIES, EIN_METADATA_VERSION, EMPIRE_INNOVATION_ENGINE_ID } from "./paths.js";
import type { EmpireInnovationEngineRecord, EmpireInnovationInput, EmpireInnovationRunReport, InnovationRecommendation, InnovationRecord, InnovationValidationReport } from "./types.js";

export type EmpireInnovationDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null; empireMemoryEngine?: EmpireMemoryEngine | null; empireKnowledgeEngine?: EmpireKnowledgeEngine | null };
export class EmpireInnovationManager {
  private engineRecord: EmpireInnovationEngineRecord | null = null;
  private records: InnovationRecord[] = [];
  private recommendations: InnovationRecommendation[] = [];
  constructor(private readonly dependencies: EmpireInnovationDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getInnovationRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private validation(input: EmpireInnovationInput): InnovationValidationReport {
    const validated = input.validated === true;
    return { validationReportId: `ein-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: validated ? "pass" : "partial", errors: [], warnings: validated ? [] : ["Innovation was not explicitly validated; production promotion is prohibited."], durationMs: 0, metadataVersion: EIN_METADATA_VERSION };
  }
  private report(action: string, records: InnovationRecord[], validation: InnovationValidationReport): EmpireInnovationRunReport {
    return { innovationRunReportId: `ein-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, innovationRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EIN_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, _config: EmpireInnovationEngineConfiguration): EmpireInnovationRunReport {
    const framework = this.dependencies.empireIntelligenceFramework; let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_INNOVATION_ENGINE_ID, moduleVersion: "PILLOW-EIN-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_INNOVATION_ENGINE_ID, "start");
    }
    this.engineRecord = { engineRecordId: `ein-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_INNOVATION_ENGINE_ID, engineVersion: "PILLOW-EIN-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EIN_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework), empireMemoryEngine: Boolean(this.dependencies.empireMemoryEngine), empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine) }, metadataVersion: EIN_METADATA_VERSION };
    return this.report("connect", [], { validationReportId: `ein-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: framework ? "pass" : "partial", errors: [], warnings: framework ? [] : ["Empire Intelligence Framework unavailable"], durationMs: 0, metadataVersion: EIN_METADATA_VERSION });
  }
  run(action: string, input: EmpireInnovationInput, config: EmpireInnovationEngineConfiguration): EmpireInnovationRunReport {
    if (!this.engineRecord) throw new Error("Empire Innovation Engine not connected — call connectEmpireInnovationEngine first");
    if (action === "rank_innovation_opportunities") { this.records.sort((a, b) => b.innovationScore - a.innovationScore); return this.report(action, this.records, this.validation({ validated: true })); }
    if (action === "recommend_innovations") {
      this.recommendations = this.records.filter((record) => record.validationStatus === "passed" && record.innovationScore >= config.recommendationThreshold).map((record) => ({ recommendationId: `ein-rec-${record.innovationId}`, timestamp: new Date().toISOString(), innovationId: record.innovationId, recommendationSummary: record.recommendationSummary, priorityLevel: record.priorityLevel, structuralSignalOnly: true, neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true, approvedForProduction: false, unvalidatedClaim: "none" }));
      return this.report(action, [], this.validation({ validated: true }));
    }
    if (action === "track_innovation_outcomes") {
      const record = input.innovationId ? this.records.find((item) => item.innovationId === input.innovationId) : undefined;
      return record ? this.report(action, [record], this.validation({ validated: true })) : this.report(action, [], { ...this.validation({}), decision: "fail", errors: ["Innovation record not found"] });
    }
    const validation = this.validation(input), score = Math.max(0, Math.min(100, input.innovationScore ?? 50));
    const record: InnovationRecord = { innovationId: `ein-${Date.now()}-${this.records.length}`, timestamp: new Date().toISOString(), innovationCategory: input.innovationCategory?.trim() || "business innovation", sourceKnowledge: input.sourceKnowledge?.trim() || "structural enterprise signal", targetBusiness: input.targetBusiness?.trim() || "unspecified business", innovationScore: score, expectedBusinessValue: Math.max(0, input.expectedBusinessValue ?? 0), priorityLevel: Math.max(0, Math.min(100, input.priorityLevel ?? score)), recommendationSummary: input.recommendationSummary?.trim() || `Validate innovation for ${input.targetBusiness?.trim() || "target business"}`, validationStatus: validation.decision === "pass" ? "passed" : "partial", metadataVersion: EIN_METADATA_VERSION, structuralSignalOnly: true, neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true, preserveInnovationTraceability: true, preserveAuditability: true, innovationTraceId: `ein-trace-${Date.now()}-${this.records.length}`, unvalidatedClaim: "none", approvedForProduction: false, maskSensitiveValues: true };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    return this.report(action, [record], validation);
  }
  diagnostics(config: EmpireInnovationEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, { validationReportId: `ein-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: config.enabled ? "pass" : "fail", errors: config.enabled ? [] : ["Engine disabled"], warnings: [], durationMs: 0, metadataVersion: EIN_METADATA_VERSION }) : this.connect({}, config); }
}
