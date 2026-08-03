import type { AutonomousEmpireEvolution } from "../autonomous-empire-evolution/engine.js";
import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpirePerformanceGuardian } from "../empire-performance-guardian/engine.js";
import type { InfiniteGrowthEngineConfiguration } from "./configuration.js";
import { logGrowthEvent } from "./ige-logging.js";
import {
  GrowthConstraintEngine,
  GrowthMetadataGenerator,
  GrowthOpportunityEngine,
  GrowthRecommendationEngine,
  GrowthValidator,
  HealthMonitor,
  LongTermGrowthEngine,
  RecoveryManager,
  SustainabilityAnalysisEngine,
} from "./growth-components.js";
import { IGE_CAPABILITIES, IGE_METADATA_VERSION, INFINITE_GROWTH_ENGINE_ID } from "./paths.js";
import { toStructuralEnterpriseScope } from "./structural-signals.js";
import type {
  GrowthRecommendation,
  GrowthRecord,
  GrowthValidationReport,
  InfiniteGrowthEngineRecord,
  InfiniteGrowthInput,
  InfiniteGrowthRunReport,
} from "./types.js";

export type InfiniteGrowthDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empirePerformanceGuardian?: EmpirePerformanceGuardian | null;
  autonomousEmpireEvolution?: AutonomousEmpireEvolution | null;
};

export class InfiniteGrowthManager {
  private engineRecord: InfiniteGrowthEngineRecord | null = null;
  private records: GrowthRecord[] = [];
  private recommendations: GrowthRecommendation[] = [];
  private readonly longTermGrowth = new LongTermGrowthEngine();
  private readonly sustainability = new SustainabilityAnalysisEngine();
  private readonly constraints = new GrowthConstraintEngine();
  private readonly opportunities = new GrowthOpportunityEngine();
  private readonly recommendationEngine = new GrowthRecommendationEngine();
  private readonly metadata = new GrowthMetadataGenerator();
  private readonly validator = new GrowthValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: InfiniteGrowthDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getGrowthRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: InfiniteGrowthInput): GrowthValidationReport {
    const decision = this.validator.decide(input);
    logGrowthEvent("validation_results");
    return {
      validationReportId: `ige-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors:
        decision === "fail"
          ? ["Constitutional governance cannot be sacrificed for growth; operational quality cannot be reduced to increase growth."]
          : [],
      warnings:
        decision === "partial"
          ? ["Structural growth signal is not independently validated; governance and operational quality remain protected."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: GrowthRecord[], validation: GrowthValidationReport): InfiniteGrowthRunReport {
    return {
      growthRunReportId: `ige-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      growthRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: IGE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: InfiniteGrowthEngineConfiguration): InfiniteGrowthRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: INFINITE_GROWTH_ENGINE_ID,
          moduleVersion: "PILLOW-IGE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(INFINITE_GROWTH_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `ige-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: INFINITE_GROWTH_ENGINE_ID,
      engineVersion: "PILLOW-IGE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...IGE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empirePerformanceGuardian: Boolean(this.dependencies.empirePerformanceGuardian),
        autonomousEmpireEvolution: Boolean(this.dependencies.autonomousEmpireEvolution),
      },
      metadataVersion: IGE_METADATA_VERSION,
    };
    logGrowthEvent("growth_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: InfiniteGrowthInput, config: InfiniteGrowthEngineConfiguration): InfiniteGrowthRunReport {
    if (!this.engineRecord) {
      throw new Error("Infinite Growth Engine not connected — call connectInfiniteGrowthEngine first");
    }

    if (action === "recommend" || action === "generate_long_term_growth_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.growthPriority >= config.recommendationThreshold)
        .sort((a, b) => b.growthPriority - a.growthPriority)
        .map((r) => ({
          recommendationId: `ige-rec-${r.growthRecordId}`,
          timestamp: new Date().toISOString(),
          growthRecordId: r.growthRecordId,
          recommendationSummary: r.recommendationSummary,
          growthPriority: r.growthPriority,
          structuralSignalOnly: true,
          neverSacrificeConstitutionalGovernanceForGrowth: true,
          neverReduceOperationalQualityToIncreaseGrowth: true,
          sacrificedConstitutionalGovernanceForGrowth: false,
          reducedOperationalQualityForGrowth: false,
        }));
      logGrowthEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const scope = toStructuralEnterpriseScope(input.enterpriseScope);
    const category = this.longTermGrowth.resolveCategory(action, input);
    const sustainabilityScore = this.sustainability.sustainabilityScore(input);
    const governanceScore = this.sustainability.governanceScore(input);
    const operationalScore = this.sustainability.operationalScore(input);
    this.constraints.detectConstraint(input, sustainabilityScore, governanceScore, operationalScore);
    const growthPriority = this.opportunities.priority(input, sustainabilityScore, governanceScore, operationalScore);
    const validation = this.validation(input);

    const record: GrowthRecord = {
      growthRecordId: `ige-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      enterpriseScope: scope,
      growthCategory: category,
      sustainabilityScore,
      governanceScore,
      operationalScore,
      growthPriority,
      recommendationSummary: this.recommendationEngine.summarize(input, scope, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverSacrificeConstitutionalGovernanceForGrowth: true,
      neverReduceOperationalQualityToIncreaseGrowth: true,
      sacrificedConstitutionalGovernanceForGrowth: false,
      reducedOperationalQualityForGrowth: false,
      preserveGrowthTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      growthTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail") {
      logGrowthEvent("growth_failures");
      this.recovery.attempt();
    }

    if (action.includes("sustainab")) logGrowthEvent("sustainability_analysis");
    else if (action.includes("opportunit") || action.includes("rank") || action.includes("constraint") || action.includes("risk")) {
      logGrowthEvent("growth_opportunity_analysis");
    } else if (action.includes("evaluat") || action.includes("monitor")) logGrowthEvent("growth_evaluation");
    else logGrowthEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: InfiniteGrowthEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: GrowthValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logGrowthEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
