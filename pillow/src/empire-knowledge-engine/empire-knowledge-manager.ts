import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngineConfiguration } from "./configuration.js";
import { EKE_CAPABILITIES, EKE_METADATA_VERSION, EMPIRE_KNOWLEDGE_ENGINE_ID } from "./paths.js";
import type { EmpireKnowledgeEngineRecord, EmpireKnowledgeInput, EmpireKnowledgeRunReport, KnowledgeCategory, KnowledgeRecommendation, KnowledgeRecord, KnowledgeRelationshipType, KnowledgeValidationReport } from "./types.js";

export type EmpireKnowledgeDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null };
export class EmpireKnowledgeManager {
  private engineRecord: EmpireKnowledgeEngineRecord | null = null;
  private records: KnowledgeRecord[] = [];
  private recommendations: KnowledgeRecommendation[] = [];
  constructor(private readonly dependencies: EmpireKnowledgeDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord } : null; }
  getKnowledgeRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private validation(decision: KnowledgeValidationReport["decision"], errors: string[] = [], warnings: string[] = []): KnowledgeValidationReport {
    return { validationReportId: `enk-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision, errors, warnings, durationMs: 0, metadataVersion: EKE_METADATA_VERSION };
  }
  private report(action: string, records: KnowledgeRecord[], validation: KnowledgeValidationReport): EmpireKnowledgeRunReport {
    return { knowledgeRunReportId: `enk-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, knowledgeRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EKE_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, config: EmpireKnowledgeEngineConfiguration): EmpireKnowledgeRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_KNOWLEDGE_ENGINE_ID, moduleVersion: "PILLOW-ENK-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_KNOWLEDGE_ENGINE_ID, "start");
    }
    this.engineRecord = { engineRecordId: `enk-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_KNOWLEDGE_ENGINE_ID, engineVersion: "PILLOW-ENK-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EKE_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework) }, metadataVersion: EKE_METADATA_VERSION };
    return this.report("connect", [], this.validation(framework ? "pass" : "partial", [], framework ? [] : ["Empire Intelligence Framework unavailable"]));
  }
  run(action: string, input: EmpireKnowledgeInput, config: EmpireKnowledgeEngineConfiguration): EmpireKnowledgeRunReport {
    if (!this.engineRecord) throw new Error("Empire Knowledge Engine not connected — call connectEmpireKnowledgeEngine first");
    const validated = input.validated === true;
    const sourceCompany = input.sourceCompany?.trim() || "source-company";
    const targetCompany = input.targetCompany?.trim() || "empire";
    const validation = action === "share_validated_knowledge" && !validated
      ? this.validation("fail", ["Never distribute unvalidated enterprise knowledge"])
      : this.validation(validated ? "pass" : "partial", [], validated ? [] : ["Unvalidated structural signal retained but distribution blocked"]);
    if (validation.decision === "fail") return this.report(action, [], validation);
    const category = input.knowledgeCategory ?? this.categoryFor(action);
    const relationshipType = input.relationshipType ?? this.relationshipFor(action);
    const record: KnowledgeRecord = { knowledgeRecordId: `enk-${Date.now()}-${sourceCompany}-${category}`, timestamp: new Date().toISOString(), sourceCompany, targetCompany, knowledgeCategory: category, relationshipType, confidenceScore: Math.max(0, Math.min(100, input.confidenceHint ?? (validated ? 80 : 40))), validationStatus: validated ? "passed" : "partial", metadataVersion: EKE_METADATA_VERSION, structuralSignalOnly: true, neverDistributeUnvalidatedEnterpriseKnowledge: true, preserveKnowledgeTraceability: true, preserveAuditability: true, knowledgeTraceId: `enk-trace-${Date.now()}`, unvalidatedClaim: "none" };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    if (action === "recommend_enterprise_knowledge" || action === "detect_reusable_business_knowledge") this.recommendations = this.records.filter((item) => item.validationStatus === "passed").map((item) => ({ recommendationId: `enk-rec-${item.knowledgeRecordId}`, timestamp: new Date().toISOString(), sourceCompany: item.sourceCompany, targetCompany: item.targetCompany, recommendationSummary: `Evaluate validated ${item.knowledgeCategory} from ${item.sourceCompany}`, knowledgeValue: item.confidenceScore, structuralSignalOnly: true, neverDistributeUnvalidatedEnterpriseKnowledge: true, unvalidatedClaim: "none" }));
    return this.report(action, [record], validation);
  }
  diagnostics(config: EmpireKnowledgeEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, this.validation(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Engine disabled"])) : this.connect({}, config); }
  private categoryFor(action: string): KnowledgeCategory { return action.includes("product") ? "product_learning" : action.includes("customer") ? "customer_insight" : action.includes("supplier") ? "supplier_intelligence" : action.includes("activity") ? "business_activity" : action.includes("relationship") ? "operational_pattern" : "business_strategy"; }
  private relationshipFor(action: string): KnowledgeRelationshipType { return action.includes("product") ? "product" : action.includes("customer") ? "customer" : action.includes("supplier") ? "supplier" : action.includes("activity") ? "business_activity" : "company"; }
}
