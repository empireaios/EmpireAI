import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { EmpireMemoryEngine } from "../empire-memory-engine/engine.js";
import type { EmpireOptimizationEngineConfiguration } from "./configuration.js";
import { EnterprisePerformanceAnalyzer } from "./enterprise-performance-analyzer.js";
import { OptimizationMetadataGenerator } from "./optimization-metadata-generator.js";
import { OptimizationRecommendationEngine } from "./optimization-recommendation-engine.js";
import { OptimizationValidator } from "./optimization-validator.js";
import { EOE_CAPABILITIES, EOE_METADATA_VERSION, EMPIRE_OPTIMIZATION_ENGINE_ID } from "./paths.js";
import type { EmpireOptimizationEngineRecord, EmpireOptimizationInput, EmpireOptimizationRunReport, OptimizationCategory, OptimizationRecord, OptimizationRecommendation, OptimizationValidationReport } from "./types.js";

export type EmpireOptimizationDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null; empireMemoryEngine?: EmpireMemoryEngine | null; empireKnowledgeEngine?: EmpireKnowledgeEngine | null };
export class EmpireOptimizationManager {
  private engineRecord: EmpireOptimizationEngineRecord | null = null;
  private records: OptimizationRecord[] = [];
  private recommendations: OptimizationRecommendation[] = [];
  private readonly analyzer = new EnterprisePerformanceAnalyzer();
  private readonly metadata = new OptimizationMetadataGenerator();
  private readonly validator = new OptimizationValidator();
  private readonly recommender = new OptimizationRecommendationEngine();
  constructor(private readonly dependencies: EmpireOptimizationDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getOptimizationRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private report(action: string, records: OptimizationRecord[], validation: OptimizationValidationReport): EmpireOptimizationRunReport {
    return { optimizationRunReportId: `eoe-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, optimizationRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: EOE_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, _config: EmpireOptimizationEngineConfiguration): EmpireOptimizationRunReport {
    const framework = this.dependencies.empireIntelligenceFramework; let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_OPTIMIZATION_ENGINE_ID, moduleVersion: "PILLOW-EOE-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_OPTIMIZATION_ENGINE_ID, "start");
    }
    this.engineRecord = { engineRecordId: `eoe-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_OPTIMIZATION_ENGINE_ID, engineVersion: "PILLOW-EOE-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...EOE_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework), empireMemoryEngine: Boolean(this.dependencies.empireMemoryEngine), empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine) }, metadataVersion: EOE_METADATA_VERSION };
    return this.report("connect", [], { validationReportId: `eoe-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: framework ? "pass" : "partial", errors: [], warnings: framework ? [] : ["Empire Intelligence Framework unavailable"], durationMs: 0, metadataVersion: EOE_METADATA_VERSION });
  }
  run(action: string, input: EmpireOptimizationInput, _config: EmpireOptimizationEngineConfiguration): EmpireOptimizationRunReport {
    if (!this.engineRecord) throw new Error("Empire Optimization Engine not connected — call connectEmpireOptimizationEngine first");
    if (action === "recommend_enterprise_optimization" || action === "rank_optimization_priorities") {
      this.recommendations = this.recommender.recommend(this.records);
      return this.report(action, [], { ...this.validator.validate({ validated: true }) });
    }
    if (action === "track_optimization_outcomes") {
      const existing = input.optimizationId ? this.records.find((record) => record.optimizationId === input.optimizationId) : undefined;
      if (!existing) return this.report(action, [], { ...this.validator.validate({ validated: false }), decision: "fail", errors: ["Optimization record not found"] });
      return this.report(action, [existing], this.validator.validate({ validated: true }));
    }
    const category = input.optimizationCategory ?? this.categoryFor(action);
    const currentPerformance = this.analyzer.analyze(input);
    const expectedImprovement = Math.max(0, Math.min(100, input.expectedImprovement ?? (100 - currentPerformance) / 2));
    const priorityScore = Math.max(0, Math.min(100, input.priorityScore ?? Math.round(expectedImprovement + (100 - currentPerformance) / 2)));
    const validation = this.validator.validate(input);
    const record: OptimizationRecord = { optimizationId: `eoe-${Date.now()}-${category}`, timestamp: new Date().toISOString(), companyReference: input.companyReference?.trim() || "empire", optimizationCategory: category, currentPerformance, expectedImprovement, priorityScore, recommendationSummary: input.recommendationSummary?.trim() || `Review ${category.replaceAll("_", " ")} structural signal`, validationStatus: validation.decision === "pass" ? "passed" : "partial", metadataVersion: this.metadata.version, structuralSignalOnly: true, neverExecuteUnapprovedOptimizationActionsAutomatically: true, preserveOptimizationTraceability: true, preserveAuditability: true, optimizationTraceId: this.metadata.traceId(), unvalidatedClaim: "none", approvedForExecution: false };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    return this.report(action, [record], validation);
  }
  diagnostics(config: EmpireOptimizationEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, { validationReportId: `eoe-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: config.enabled ? "pass" : "fail", errors: config.enabled ? [] : ["Engine disabled"], warnings: [], durationMs: 0, metadataVersion: EOE_METADATA_VERSION }) : this.connect({}, config); }
  private categoryFor(action: string): OptimizationCategory {
    if (action.includes("cross_company")) return "cross_company_efficiency"; if (action.includes("bottleneck")) return "operational_bottleneck";
    if (action.includes("duplicated")) return "duplicated_effort"; if (action.includes("resource")) return "resource_optimization";
    if (action.includes("opportunit")) return "optimization_opportunity"; return "enterprise_performance";
  }
}
