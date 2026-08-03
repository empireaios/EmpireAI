import type { AutonomousEmpireEvolution } from "../autonomous-empire-evolution/engine.js";
import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { ExecutiveEmpireDashboardEngine } from "../executive-empire-dashboard/engine.js";
import type { EmpirePerformanceGuardianConfiguration } from "./configuration.js";
import { logPerformanceEvent } from "./epg-logging.js";
import {
  AnomalyDetectionEngine,
  EnterpriseHealthMonitor,
  HealthMonitor,
  KpiMonitoringEngine,
  PerformanceAnalyticsEngine,
  PerformanceMetadataGenerator,
  PerformanceRecommendationEngine,
  PerformanceValidator,
  RecoveryManager,
} from "./performance-components.js";
import { EMPIRE_PERFORMANCE_GUARDIAN_ID, EPG_CAPABILITIES, EPG_METADATA_VERSION } from "./paths.js";
import { toStructuralCompanyReference } from "./structural-signals.js";
import type {
  EmpirePerformanceGuardianEngineRecord,
  EmpirePerformanceGuardianInput,
  EmpirePerformanceGuardianRunReport,
  PerformanceRecommendation,
  PerformanceRecord,
  PerformanceValidationReport,
} from "./types.js";

export type EmpirePerformanceGuardianDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  executiveEmpireDashboard?: ExecutiveEmpireDashboardEngine | null;
  autonomousEmpireEvolution?: AutonomousEmpireEvolution | null;
};

export class EmpirePerformanceGuardianManager {
  private engineRecord: EmpirePerformanceGuardianEngineRecord | null = null;
  private records: PerformanceRecord[] = [];
  private recommendations: PerformanceRecommendation[] = [];
  private readonly enterpriseHealth = new EnterpriseHealthMonitor();
  private readonly kpi = new KpiMonitoringEngine();
  private readonly analytics = new PerformanceAnalyticsEngine();
  private readonly anomalies = new AnomalyDetectionEngine();
  private readonly recommendationEngine = new PerformanceRecommendationEngine();
  private readonly metadata = new PerformanceMetadataGenerator();
  private readonly validator = new PerformanceValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: EmpirePerformanceGuardianDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getPerformanceRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: EmpirePerformanceGuardianInput): PerformanceValidationReport {
    const decision = this.validator.decide(input);
    logPerformanceEvent("validation_results");
    return {
      validationReportId: `epg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Critical enterprise alerts cannot be suppressed."] : [],
      warnings:
        decision === "partial"
          ? ["Structural performance signal is not independently validated; critical alerts remain unsuppressed."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: PerformanceRecord[], validation: PerformanceValidationReport): EmpirePerformanceGuardianRunReport {
    return {
      performanceRunReportId: `epg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      performanceRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: EPG_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: EmpirePerformanceGuardianConfiguration): EmpirePerformanceGuardianRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: EMPIRE_PERFORMANCE_GUARDIAN_ID,
          moduleVersion: "PILLOW-EPG-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_PERFORMANCE_GUARDIAN_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `epg-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EMPIRE_PERFORMANCE_GUARDIAN_ID,
      engineVersion: "PILLOW-EPG-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...EPG_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        executiveEmpireDashboard: Boolean(this.dependencies.executiveEmpireDashboard),
        autonomousEmpireEvolution: Boolean(this.dependencies.autonomousEmpireEvolution),
      },
      metadataVersion: EPG_METADATA_VERSION,
    };
    logPerformanceEvent("performance_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: EmpirePerformanceGuardianInput, config: EmpirePerformanceGuardianConfiguration): EmpirePerformanceGuardianRunReport {
    if (!this.engineRecord) {
      throw new Error("Empire Performance Guardian not connected — call connectEmpirePerformanceGuardian first");
    }

    if (action === "recommend" || action === "generate_performance_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.priorityScore >= config.recommendationThreshold || r.anomalyStatus === "critical" || r.anomalyStatus === "degraded")
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .map((r) => ({
          recommendationId: `epg-rec-${r.performanceRecordId}`,
          timestamp: new Date().toISOString(),
          performanceRecordId: r.performanceRecordId,
          recommendationSummary: r.recommendationSummary,
          healthScore: r.healthScore,
          anomalyStatus: r.anomalyStatus,
          structuralSignalOnly: true,
          neverSuppressCriticalEnterpriseAlerts: true,
          criticalAlertSuppressed: false,
        }));
      logPerformanceEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const company = toStructuralCompanyReference(input.companyReference);
    const category = this.kpi.resolveCategory(action, input);
    const healthScore = this.enterpriseHealth.healthScore(input, config.healthThreshold);
    const anomalyStatus = this.anomalies.status(input, healthScore, config.healthThreshold);
    const priorityScore = this.analytics.priorityScore(input, healthScore, anomalyStatus);
    const validation = this.validation(input);

    const record: PerformanceRecord = {
      performanceRecordId: `epg-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      companyReference: company,
      performanceCategory: category,
      kpiSummary: this.kpi.kpiSummary(input, category),
      healthScore,
      anomalyStatus,
      recommendationSummary: this.recommendationEngine.summarize(input, company, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverSuppressCriticalEnterpriseAlerts: true,
      criticalAlertSuppressed: false,
      preservePerformanceTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      performanceTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
      priorityScore,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail" || anomalyStatus === "critical" || anomalyStatus === "degraded") {
      logPerformanceEvent(anomalyStatus === "critical" || anomalyStatus === "degraded" ? "anomaly_detection" : "performance_failures");
      if (validation.decision === "fail") this.recovery.attempt();
    }

    if (action.includes("monitor") || action.includes("kpi")) logPerformanceEvent("kpi_monitoring");
    else if (action.includes("analyz") || action.includes("rank")) logPerformanceEvent("performance_analysis");
    else if (action.includes("detect") || action.includes("anomal") || action.includes("degrad")) logPerformanceEvent("anomaly_detection");
    else logPerformanceEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: EmpirePerformanceGuardianConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: PerformanceValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logPerformanceEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
