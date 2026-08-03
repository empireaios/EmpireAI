import type { AutonomousInvestmentEngine } from "../autonomous-investment-engine/engine.js";
import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireResilienceEngine } from "../empire-resilience-engine/engine.js";
import type { EnterpriseSuccessionEngineConfiguration } from "./configuration.js";
import { logSuccessionEvent } from "./ese-logging.js";
import {
  ContinuityPlanningEngine,
  ExecutiveSuccessionEngine,
  HealthMonitor,
  OrganizationalContinuityEngine,
  RecoveryManager,
  SuccessionMetadataGenerator,
  SuccessionReadinessEngine,
  SuccessionRecommendationEngine,
  SuccessionValidator,
} from "./succession-components.js";
import { ENTERPRISE_SUCCESSION_ENGINE_ID, ESE_CAPABILITIES, ESE_METADATA_VERSION } from "./paths.js";
import { toStructuralOrganizationalUnit } from "./structural-signals.js";
import type {
  EnterpriseSuccessionEngineRecord,
  EnterpriseSuccessionInput,
  EnterpriseSuccessionRunReport,
  SuccessionRecommendation,
  SuccessionRecord,
  SuccessionValidationReport,
} from "./types.js";

export type EnterpriseSuccessionDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empireResilienceEngine?: EmpireResilienceEngine | null;
  autonomousInvestmentEngine?: AutonomousInvestmentEngine | null;
};

export class EnterpriseSuccessionManager {
  private engineRecord: EnterpriseSuccessionEngineRecord | null = null;
  private records: SuccessionRecord[] = [];
  private recommendations: SuccessionRecommendation[] = [];
  private readonly continuityPlanning = new ContinuityPlanningEngine();
  private readonly executiveSuccession = new ExecutiveSuccessionEngine();
  private readonly organizationalContinuity = new OrganizationalContinuityEngine();
  private readonly readiness = new SuccessionReadinessEngine();
  private readonly recommendationEngine = new SuccessionRecommendationEngine();
  private readonly metadata = new SuccessionMetadataGenerator();
  private readonly validator = new SuccessionValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: EnterpriseSuccessionDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getSuccessionRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: EnterpriseSuccessionInput): SuccessionValidationReport {
    const decision = this.validator.decide(input);
    logSuccessionEvent("validation_results");
    return {
      validationReportId: `ese-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Governance-approved succession plans cannot be modified automatically."] : [],
      warnings:
        decision === "partial"
          ? ["Structural succession signal is not independently validated; governance-approved plans remain unchanged."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: SuccessionRecord[], validation: SuccessionValidationReport): EnterpriseSuccessionRunReport {
    return {
      successionRunReportId: `ese-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      successionRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: ESE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: EnterpriseSuccessionEngineConfiguration): EnterpriseSuccessionRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: ENTERPRISE_SUCCESSION_ENGINE_ID,
          moduleVersion: "PILLOW-ESE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(ENTERPRISE_SUCCESSION_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `ese-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ENTERPRISE_SUCCESSION_ENGINE_ID,
      engineVersion: "PILLOW-ESE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...ESE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empireResilienceEngine: Boolean(this.dependencies.empireResilienceEngine),
        autonomousInvestmentEngine: Boolean(this.dependencies.autonomousInvestmentEngine),
      },
      metadataVersion: ESE_METADATA_VERSION,
    };
    logSuccessionEvent("succession_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: EnterpriseSuccessionInput, config: EnterpriseSuccessionEngineConfiguration): EnterpriseSuccessionRunReport {
    if (!this.engineRecord) {
      throw new Error("Enterprise Succession Engine not connected — call connectEnterpriseSuccessionEngine first");
    }

    if (action === "recommend" || action === "generate_continuity_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.continuityStatus !== "ready" || r.readinessScore < config.readinessThreshold)
        .map((r) => ({
          recommendationId: `ese-rec-${r.successionRecordId}`,
          timestamp: new Date().toISOString(),
          successionRecordId: r.successionRecordId,
          recommendationSummary: r.recommendationSummary,
          readinessScore: r.readinessScore,
          riskLevel: r.riskLevel,
          structuralSignalOnly: true,
          neverModifyGovernanceApprovedSuccessionPlansAutomatically: true,
          modifiedGovernanceApprovedSuccessionPlan: false,
        }));
      logSuccessionEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const unit = toStructuralOrganizationalUnit(input.organizationalUnit);
    const category = this.continuityPlanning.resolveCategory(action, input);
    const readinessScore = this.organizationalContinuity.readinessScore(input);
    const continuityStatus = this.executiveSuccession.continuityStatus(input, readinessScore, config.readinessThreshold);
    const riskLevel = this.readiness.riskLevel(input, continuityStatus);
    const validation = this.validation(input);

    const record: SuccessionRecord = {
      successionRecordId: `ese-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      organizationalUnit: unit,
      successionCategory: category,
      continuityStatus,
      readinessScore,
      riskLevel,
      recommendationSummary: this.recommendationEngine.summarize(input, unit, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverModifyGovernanceApprovedSuccessionPlansAutomatically: true,
      modifiedGovernanceApprovedSuccessionPlan: false,
      preserveSuccessionTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      successionTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (action.includes("risk") || action.includes("gap") || validation.decision === "fail" || continuityStatus === "gap_detected") {
      logSuccessionEvent("succession_failures");
      this.recovery.attempt();
    }

    if (action.includes("continuity") || action.includes("plan")) logSuccessionEvent("continuity_planning");
    else if (action.includes("readiness")) logSuccessionEvent("readiness_evaluation");
    else if (action.includes("assess") || action.includes("succession")) logSuccessionEvent("succession_assessment");
    else logSuccessionEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: EnterpriseSuccessionEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: SuccessionValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logSuccessionEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
