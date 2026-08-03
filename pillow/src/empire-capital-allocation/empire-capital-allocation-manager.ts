import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { EmpireMemoryEngine } from "../empire-memory-engine/engine.js";
import type { EmpireCapitalAllocationConfiguration } from "./configuration.js";
import { AllocationStrategyEngine } from "./allocation-strategy-engine.js";
import { CapitalIntelligenceEngine } from "./capital-intelligence-engine.js";
import { CapitalMetadataGenerator } from "./capital-metadata-generator.js";
import { CapitalRecommendationEngine } from "./capital-recommendation-engine.js";
import { CapitalValidator } from "./capital-validator.js";
import { InvestmentEvaluationEngine } from "./investment-evaluation-engine.js";
import { RoiAnalysisEngine } from "./roi-analysis-engine.js";
import { ECA_CAPABILITIES, ECA_METADATA_VERSION, EMPIRE_CAPITAL_ALLOCATION_ID } from "./paths.js";
import type { CapitalAllocationRecord, CapitalRecommendation, CapitalValidationReport, EmpireCapitalAllocationEngineRecord, EmpireCapitalAllocationInput, EmpireCapitalAllocationRunReport } from "./types.js";

export type EmpireCapitalAllocationDependencies = { empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null; empireMemoryEngine?: EmpireMemoryEngine | null; empireKnowledgeEngine?: EmpireKnowledgeEngine | null };
export class EmpireCapitalAllocationManager {
  private engineRecord: EmpireCapitalAllocationEngineRecord | null = null;
  private records: CapitalAllocationRecord[] = [];
  private recommendations: CapitalRecommendation[] = [];
  private readonly capital = new CapitalIntelligenceEngine();
  private readonly investment = new InvestmentEvaluationEngine();
  private readonly roi = new RoiAnalysisEngine();
  private readonly strategy = new AllocationStrategyEngine();
  private readonly metadata = new CapitalMetadataGenerator();
  private readonly validator = new CapitalValidator();
  private readonly recommender = new CapitalRecommendationEngine();
  constructor(private readonly dependencies: EmpireCapitalAllocationDependencies = {}) {}
  getEngineRecord() { return this.engineRecord ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence } } : null; }
  getCapitalAllocationRecords() { return this.records.map((record) => ({ ...record })); }
  getRecommendations() { return this.recommendations.map((recommendation) => ({ ...recommendation })); }
  private report(action: string, records: CapitalAllocationRecord[], validation: CapitalValidationReport): EmpireCapitalAllocationRunReport {
    return { capitalAllocationRunReportId: `eca-run-${Date.now()}`, runTimestamp: new Date().toISOString(), action, engineRecord: this.engineRecord!, capitalAllocationRecords: records, recommendations: this.getRecommendations(), validation, durationMs: 0, metadataVersion: ECA_METADATA_VERSION };
  }
  connect(_input: Record<string, unknown>, _config: EmpireCapitalAllocationConfiguration): EmpireCapitalAllocationRunReport {
    const framework = this.dependencies.empireIntelligenceFramework; let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({ definition: { intelligenceModuleIdentifier: EMPIRE_CAPITAL_ALLOCATION_ID, moduleVersion: "PILLOW-ECA-001", moduleType: "intelligence", supportedCapabilities: ["health_monitoring"] }, forceRegister: true });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_CAPITAL_ALLOCATION_ID, "start");
    }
    this.engineRecord = { engineRecordId: `eca-eng-${Date.now()}`, timestamp: new Date().toISOString(), engineId: EMPIRE_CAPITAL_ALLOCATION_ID, engineVersion: "PILLOW-ECA-001", currentOperationalState: "connected", healthStatus: framework ? "healthy" : "degraded", validationStatus: framework ? "passed" : "partial", supportedCapabilities: [...ECA_CAPABILITIES], frameworkModuleId, dependencyPresence: { empireIntelligenceFramework: Boolean(framework), empireMemoryEngine: Boolean(this.dependencies.empireMemoryEngine), empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine) }, metadataVersion: ECA_METADATA_VERSION };
    return this.report("connect", [], { validationReportId: `eca-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: framework ? "pass" : "partial", errors: [], warnings: framework ? [] : ["Empire Intelligence Framework unavailable"], durationMs: 0, metadataVersion: ECA_METADATA_VERSION });
  }
  run(action: string, input: EmpireCapitalAllocationInput, _config: EmpireCapitalAllocationConfiguration): EmpireCapitalAllocationRunReport {
    if (!this.engineRecord) throw new Error("Empire Capital Allocation not connected — call connectEmpireCapitalAllocation first");
    if (action === "rank_capital_allocation_priorities") { this.records = this.strategy.rank(this.records); return this.report(action, this.records, this.validator.validate({ validated: true })); }
    if (action === "recommend_capital_reallocation") { this.recommendations = this.recommender.recommend(this.records); return this.report(action, [], this.validator.validate({ validated: true })); }
    if (action === "track_allocation_outcomes") {
      const existing = input.capitalAllocationId ? this.records.find((record) => record.capitalAllocationId === input.capitalAllocationId) : undefined;
      return existing ? this.report(action, [existing], this.validator.validate({ validated: true })) : this.report(action, [], { ...this.validator.validate({ validated: false }), decision: "fail", errors: ["Capital allocation record not found"] });
    }
    const validation = this.validator.validate(input), availableCapital = this.capital.available(input), expectedRoi = this.roi.estimate(input);
    const priority = Math.max(0, Math.min(100, input.allocationPriority ?? Math.round(expectedRoi + this.capital.utilization(input) / 2)));
    const record: CapitalAllocationRecord = { capitalAllocationId: `eca-${Date.now()}`, timestamp: new Date().toISOString(), companyReference: input.companyReference?.trim() || "empire", investmentOpportunity: this.investment.evaluate(input), availableCapital, expectedRoi, allocationPriority: priority, recommendationSummary: input.recommendationSummary?.trim() || `Review capital allocation for ${this.investment.evaluate(input)}`, validationStatus: validation.decision === "pass" ? "passed" : "partial", metadataVersion: this.metadata.version, structuralSignalOnly: true, neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true, preserveAllocationTraceability: true, preserveAuditability: true, capitalTraceId: this.metadata.traceId(), unvalidatedClaim: "none", approvedForTransfer: false, maskSensitiveFinancialValues: true };
    this.records.push(record); this.engineRecord.currentOperationalState = "active"; this.engineRecord.timestamp = record.timestamp;
    return this.report(action, [record], validation);
  }
  diagnostics(config: EmpireCapitalAllocationConfiguration) { return this.engineRecord ? this.report("diagnostics", this.records, { validationReportId: `eca-val-${Date.now()}`, validationTimestamp: new Date().toISOString(), decision: config.enabled ? "pass" : "fail", errors: config.enabled ? [] : ["Engine disabled"], warnings: [], durationMs: 0, metadataVersion: ECA_METADATA_VERSION }) : this.connect({}, config); }
}
