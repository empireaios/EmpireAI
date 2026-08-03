import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { EmpireMemoryEngine } from "../empire-memory-engine/engine.js";
import type { EmpireOpportunityEngineConfiguration } from "./configuration.js";
import { EOP_CAPABILITIES, EOP_METADATA_VERSION, EMPIRE_OPPORTUNITY_ENGINE_ID } from "./paths.js";
import type { EmpireOpportunityEngineRecord, EmpireOpportunityInput, EmpireOpportunityRunReport, OpportunityRecommendation, OpportunityRecord, OpportunityValidationReport } from "./types.js";

export type EmpireOpportunityDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null; empireMemoryEngine?: EmpireMemoryEngine | null; empireKnowledgeEngine?: EmpireKnowledgeEngine | null };
export class EmpireOpportunityManager {
  private engineRecord: EmpireOpportunityEngineRecord | null = null;
  private records: OpportunityRecord[] = [];
  private recommendations: OpportunityRecommendation[] = [];
  constructor(private readonly dependencies: EmpireOpportunityDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getOpportunityRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private validation(input: EmpireOpportunityInput): OpportunityValidationReport {
    const validated = input.validated === true;
    return { validationReportId: `eop-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: validated ? "pass" : "partial", errors: [], warnings: validated ? [] : ["Intelligence was not explicitly validated; recommendation is prohibited."], durationMs: 0, metadataVersion: EOP_METADATA_VERSION };
  }
  private report(action: string, records: OpportunityRecord[], validation: OpportunityValidationReport): EmpireOpportunityRunReport {
    return { opportunityRunReportId: `eop-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, opportunityRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EOP_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, _config: EmpireOpportunityEngineConfiguration): EmpireOpportunityRunReport {
    const framework = this.dependencies.empireIntelligenceFramework; let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_OPPORTUNITY_ENGINE_ID, moduleVersion: "PILLOW-EOP-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_OPPORTUNITY_ENGINE_ID, "start");
    }
    this.engineRecord = { engineRecordId: `eop-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_OPPORTUNITY_ENGINE_ID, engineVersion: "PILLOW-EOP-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EOP_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework), empireMemoryEngine: Boolean(this.dependencies.empireMemoryEngine), empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine) }, metadataVersion: EOP_METADATA_VERSION };
    return this.report("connect", [], { validationReportId: `eop-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: framework ? "pass" : "partial", errors: [], warnings: framework ? [] : ["Empire Intelligence Framework unavailable"], durationMs: 0, metadataVersion: EOP_METADATA_VERSION });
  }
  run(action: string, input: EmpireOpportunityInput, config: EmpireOpportunityEngineConfiguration): EmpireOpportunityRunReport {
    if (!this.engineRecord) throw new Error("Empire Opportunity Engine not connected — call connectEmpireOpportunityEngine first");
    if (action === "rank_opportunity_potential") { this.records.sort((a, b) => b.opportunityScore - a.opportunityScore); return this.report(action, this.records, this.validation({ validated: true })); }
    if (action === "recommend_strategic_opportunities") {
      this.recommendations = this.records.filter((record) => record.validationStatus === "passed" && record.opportunityScore >= config.recommendationThreshold).map((record) => ({ recommendationId: `eop-rec-${record.opportunityId}`, timestamp: new Date().toISOString(), opportunityId: record.opportunityId, recommendationSummary: record.recommendationSummary, priorityLevel: record.priorityLevel, structuralSignalOnly: true, neverRecommendOpportunitiesUsingUnvalidatedIntelligence: true, unvalidatedClaim: "none" }));
      return this.report(action, [], this.validation({ validated: true }));
    }
    if (action === "track_opportunity_outcomes") {
      const record = input.opportunityId ? this.records.find((item) => item.opportunityId === input.opportunityId) : undefined;
      return record ? this.report(action, [record], this.validation({ validated: true })) : this.report(action, [], { ...this.validation({}), decision: "fail", errors: ["Opportunity record not found"] });
    }
    const validation = this.validation(input), score = Math.max(0, Math.min(100, input.opportunityScore ?? 50));
    const record: OpportunityRecord = { opportunityId: `eop-${Date.now()}-${this.records.length}`, timestamp: new Date().toISOString(), opportunityCategory: input.opportunityCategory?.trim() || "business opportunity", industry: input.industry?.trim() || "unspecified industry", market: input.market?.trim() || "unspecified market", opportunityScore: score, estimatedBusinessValue: Math.max(0, input.estimatedBusinessValue ?? 0), priorityLevel: Math.max(0, Math.min(100, input.priorityLevel ?? score)), recommendationSummary: input.recommendationSummary?.trim() || `Validate strategic opportunity in ${input.market?.trim() || "target market"}`, validationStatus: validation.decision === "pass" ? "passed" : "partial", metadataVersion: EOP_METADATA_VERSION, structuralSignalOnly: true, neverRecommendOpportunitiesUsingUnvalidatedIntelligence: true, preserveOpportunityTraceability: true, preserveAuditability: true, opportunityTraceId: `eop-trace-${Date.now()}-${this.records.length}`, unvalidatedClaim: "none", maskSensitiveValues: true };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    return this.report(action, [record], validation);
  }
  diagnostics(config: EmpireOpportunityEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, { validationReportId: `eop-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: config.enabled ? "pass" : "fail", errors: config.enabled ? [] : ["Engine disabled"], warnings: [], durationMs: 0, metadataVersion: EOP_METADATA_VERSION }) : this.connect({}, config); }
}
