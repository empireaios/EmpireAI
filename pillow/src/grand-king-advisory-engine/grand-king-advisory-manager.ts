import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireLegacyEngine } from "../empire-legacy-engine/engine.js";
import type { ExecutiveEmpireDashboardEngine } from "../executive-empire-dashboard/engine.js";
import type { GrandKingAdvisoryEngineConfiguration } from "./configuration.js";
import { logAdvisoryEvent } from "./gka-logging.js";
import {
  AdvisoryMetadataGenerator,
  AdvisoryValidator,
  DecisionPrioritizationEngine,
  ExecutiveRecommendationEngine,
  HealthMonitor,
  OpportunityAdvisoryEngine,
  RecoveryManager,
  RiskAdvisoryEngine,
  StrategicAnalysisEngine,
} from "./advisory-components.js";
import { GKA_CAPABILITIES, GKA_METADATA_VERSION, GRAND_KING_ADVISORY_ENGINE_ID } from "./paths.js";
import { toStructuralEnterpriseScope } from "./structural-signals.js";
import type {
  AdvisoryRecommendation,
  AdvisoryRecord,
  AdvisoryValidationReport,
  GrandKingAdvisoryEngineRecord,
  GrandKingAdvisoryInput,
  GrandKingAdvisoryRunReport,
} from "./types.js";

export type GrandKingAdvisoryDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  executiveEmpireDashboard?: ExecutiveEmpireDashboardEngine | null;
  empireLegacyEngine?: EmpireLegacyEngine | null;
};

export class GrandKingAdvisoryManager {
  private engineRecord: GrandKingAdvisoryEngineRecord | null = null;
  private records: AdvisoryRecord[] = [];
  private recommendations: AdvisoryRecommendation[] = [];
  private readonly analysis = new StrategicAnalysisEngine();
  private readonly prioritization = new DecisionPrioritizationEngine();
  private readonly opportunities = new OpportunityAdvisoryEngine();
  private readonly risks = new RiskAdvisoryEngine();
  private readonly recommendationsEngine = new ExecutiveRecommendationEngine();
  private readonly metadata = new AdvisoryMetadataGenerator();
  private readonly validator = new AdvisoryValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: GrandKingAdvisoryDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getAdvisoryRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: GrandKingAdvisoryInput): AdvisoryValidationReport {
    const decision = this.validator.decide(input);
    logAdvisoryEvent("validation_results");
    return {
      validationReportId: `gka-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Executive decisions cannot execute automatically without approved governance."] : [],
      warnings:
        decision === "partial"
          ? ["Structural advisory signal is not independently validated; executive decisions still require approved governance."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: AdvisoryRecord[], validation: AdvisoryValidationReport): GrandKingAdvisoryRunReport {
    return {
      advisoryRunReportId: `gka-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      advisoryRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: GKA_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: GrandKingAdvisoryEngineConfiguration): GrandKingAdvisoryRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: GRAND_KING_ADVISORY_ENGINE_ID,
          moduleVersion: "PILLOW-GKA-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(GRAND_KING_ADVISORY_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `gka-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GRAND_KING_ADVISORY_ENGINE_ID,
      engineVersion: "PILLOW-GKA-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...GKA_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        executiveEmpireDashboard: Boolean(this.dependencies.executiveEmpireDashboard),
        empireLegacyEngine: Boolean(this.dependencies.empireLegacyEngine),
      },
      metadataVersion: GKA_METADATA_VERSION,
    };
    logAdvisoryEvent("advisory_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: GrandKingAdvisoryInput, config: GrandKingAdvisoryEngineConfiguration): GrandKingAdvisoryRunReport {
    if (!this.engineRecord) {
      throw new Error("Grand King Advisory Engine not connected — call connectGrandKingAdvisoryEngine first");
    }

    if (action === "recommend" || action === "generate_ranked_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.priorityScore >= config.recommendationThreshold)
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map((r) => ({
          recommendationId: `gka-rec-${r.advisoryId}`,
          timestamp: new Date().toISOString(),
          advisoryId: r.advisoryId,
          recommendationSummary: r.recommendationSummary,
          priorityLevel: r.priorityLevel,
          priorityScore: r.priorityScore,
          structuralSignalOnly: true,
          neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true,
          executedExecutiveDecisionAutomatically: false,
        }));
      logAdvisoryEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const scope = toStructuralEnterpriseScope(input.enterpriseScope);
    const category = this.analysis.resolveCategory(action, input);
    const priorityScore = this.prioritization.score(input);
    const priorityLevel = this.prioritization.priorityLevel(priorityScore, input);
    const businessImpact = this.risks.impact(input, priorityScore);
    const validation = this.validation(input);

    const record: AdvisoryRecord = {
      advisoryId: `gka-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      strategicCategory: category,
      enterpriseScope: scope,
      priorityLevel,
      businessImpact,
      recommendationSummary: this.recommendationsEngine.summarize(input, scope, category),
      supportingEvidence: this.opportunities.evidence(input, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: true,
      executedExecutiveDecisionAutomatically: false,
      preserveAdvisoryTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      advisoryTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
      priorityScore,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail" || action.includes("failure")) {
      logAdvisoryEvent("advisory_failures");
      this.recovery.attempt();
    }

    if (action.includes("analyz") || action.includes("performance")) logAdvisoryEvent("strategic_analysis");
    else if (action.includes("priorit")) logAdvisoryEvent("priority_calculations");
    else if (action.includes("recommend")) logAdvisoryEvent("advisory_generation");
    else logAdvisoryEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: GrandKingAdvisoryEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: AdvisoryValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logAdvisoryEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
