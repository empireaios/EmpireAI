import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CrossRegionLearningEngineConfiguration } from "./configuration.js";
import { CRL_CAPABILITIES, CRL_METADATA_VERSION, CROSS_REGION_LEARNING_ENGINE_ID } from "./paths.js";
import type { CrossRegionLearningEngineRecord, CrossRegionLearningInput, CrlRunReport, LearningCategory, LearningRecommendation, LearningRecord, LearningValidationReport } from "./types.js";

export type CrossRegionLearningDependencies = { globalExpansionFramework?: GlobalExpansionFrameworkEngine | null };
export class CrossRegionLearningManager {
  private engineRecord: CrossRegionLearningEngineRecord | null = null;
  private records: LearningRecord[] = [];
  private recommendations: LearningRecommendation[] = [];
  constructor(private readonly dependencies: CrossRegionLearningDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord } : null; }
  getLearningRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((record) => ({ ...record })); }
  private validation(decision: LearningValidationReport["decision"], errors: string[] = [], warnings: string[] = []): LearningValidationReport {
    return { validationReportId: `crl-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision, errors, warnings, durationMs: 0, metadataVersion: CRL_METADATA_VERSION };
  }
  private report(action: string, records: LearningRecord[], validation: LearningValidationReport): CrlRunReport {
    const engineRecord = this.engineRecord!;
    return { learningRunReportId: `crl-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord, learningRecords: records, recommendations: this.recommendations, validation, durationMs: 0, metadataVersion: CRL_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, config: CrossRegionLearningEngineConfiguration): CrlRunReport {
    const gef = this.dependencies.globalExpansionFramework;
    let frameworkModuleId: string | null = null;
    if (gef) {
      const registration = gef.registerExpansionModule({ definition: { expansionModuleIdentifier: CROSS_REGION_LEARNING_ENGINE_ID, moduleVersion: CRL_METADATA_VERSION, moduleType: "integration", integrationMissionId: "X4-16", eventRoutingConfig: { enabled: true, topics: ["regional.learning.capture", "regional.learning.transfer"], maxEventsPerMinute: 60, windowMs: 60000 }, retryConfig: { enabled: true, maxAttempts: config.maxRetryAttempts, delayMs: config.retryDelayMs, backoffMultiplier: 2 }, supportedCapabilities: ["global_expansion_module_registration", "regional_data_abstraction", "global_expansion_validation", "diagnostics"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.expansionFrameworkId ?? null;
      if (registration.validation.decision !== "fail") gef.activateExpansionModule(CROSS_REGION_LEARNING_ENGINE_ID);
    }
    this.engineRecord = { engineRecordId: `crl-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: CROSS_REGION_LEARNING_ENGINE_ID, engineVersion: "PILLOW-CRL-001", currentOperationalState: "connected", healthStatus: gef ? "healthy" : "degraded", validationStatus: gef ? "passed" : "partial", supportedCapabilities: [...CRL_CAPABILITIES], frameworkModuleId, dependencyPresence: { globalExpansionFramework: Boolean(gef) }, metadataVersion: CRL_METADATA_VERSION };
    return this.report("connect", [], this.validation(gef ? "pass" : "partial", [], gef ? [] : ["globalExpansionFramework unavailable"]));
  }
  run(action: string, input: CrossRegionLearningInput, config: CrossRegionLearningEngineConfiguration): CrlRunReport {
    if (!this.engineRecord) throw new Error("Cross-Region Learning Engine not connected — call connectCrossRegionLearningEngine first");
    const validated = input.validated === true;
    const sourceRegion = (input.sourceRegion || "APAC").toUpperCase();
    const targetRegion = (input.targetRegion || "GLOBAL").toUpperCase();
    const knowledgeCategory = input.knowledgeCategory ?? this.categoryFor(action);
    const confidenceScore = Math.max(0, Math.min(100, input.confidenceHint ?? (validated ? 80 : 40)));
    const reusabilityScore = Math.max(0, Math.min(100, input.reusabilityHint ?? (validated ? 75 : 35)));
    const validation = !validated && action === "share_knowledge_across_regions"
      ? this.validation("fail", ["Never distribute unvalidated operational knowledge"])
      : this.validation(validated ? "pass" : "partial", [], validated ? [] : ["Unvalidated structural signal retained but not distributable"]);
    if (validation.decision === "fail") return this.report(action, [], validation);
    const record: LearningRecord = { learningRecordId: `crl-${Date.now()}-${sourceRegion}-${knowledgeCategory}`, timestamp: new Date().toISOString(), sourceRegion, targetRegion, knowledgeCategory, confidenceScore, reusabilityScore, businessImpact: input.businessImpact ?? `Structural learning signal from ${sourceRegion}`, recommendationSummary: validated ? `Evaluate validated ${knowledgeCategory} learning from ${sourceRegion} for ${targetRegion}` : `Unvalidated ${knowledgeCategory} signal from ${sourceRegion} — distribution blocked`, validationStatus: validated ? "passed" : "partial", metadataVersion: CRL_METADATA_VERSION, structuralSignalOnly: true, neverDistributeUnvalidatedOperationalKnowledge: true, preserveLearningTraceability: true, unvalidatedClaim: "none", learningTraceId: `crl-trace-${Date.now()}` };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    if (action === "recommend_learning" || action === "rank_knowledge_value") this.recommendations = this.records.filter((r) => r.validationStatus === "passed").map((r) => ({ recommendationId: `crl-rec-${r.learningRecordId}`, timestamp: new Date().toISOString(), sourceRegion: r.sourceRegion, targetRegion: r.targetRegion, recommendationSummary: r.recommendationSummary, knowledgeValue: Math.round((r.confidenceScore + r.reusabilityScore) / 2), structuralSignalOnly: true, neverDistributeUnvalidatedOperationalKnowledge: true, unvalidatedClaim: "none" }));
    return this.report(action, [record], validation);
  }
  diagnostics(config: CrossRegionLearningEngineConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, this.validation(config.enabled ? "pass" : "fail", config.enabled ? [] : ["Engine disabled"])) : this.connect({}, config); }
  private categoryFor(action: string): LearningCategory { return action.includes("best_practice") ? "best_practice" : action.includes("operational") ? "operational_lesson" : action.includes("growth") || action.includes("business") ? "growth_strategy" : action.includes("risk") ? "risk_mitigation" : action.includes("pattern") ? "operational_pattern" : "business_strategy"; }
}
