import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireMemoryEngine } from "../empire-memory-engine/engine.js";
import type { EnterpriseSuccessionEngine } from "../enterprise-succession-engine/engine.js";
import type { EmpireLegacyEngineConfiguration } from "./configuration.js";
import { logLegacyEvent } from "./ele-logging.js";
import {
  AchievementRegistryEngine,
  EnterpriseTimelineEngine,
  HealthMonitor,
  HistoricalArchiveEngine,
  HistoricalIntelligenceEngine,
  LegacyMetadataGenerator,
  LegacyRecommendationEngine,
  LegacyValidator,
  RecoveryManager,
} from "./legacy-components.js";
import { ELE_CAPABILITIES, ELE_METADATA_VERSION, EMPIRE_LEGACY_ENGINE_ID } from "./paths.js";
import { toStructuralCompanyReference } from "./structural-signals.js";
import type {
  EmpireLegacyEngineRecord,
  EmpireLegacyInput,
  EmpireLegacyRunReport,
  LegacyRecommendation,
  LegacyRecord,
  LegacyValidationReport,
} from "./types.js";

export type EmpireLegacyDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empireMemoryEngine?: EmpireMemoryEngine | null;
  enterpriseSuccessionEngine?: EnterpriseSuccessionEngine | null;
};

export class EmpireLegacyManager {
  private engineRecord: EmpireLegacyEngineRecord | null = null;
  private records: LegacyRecord[] = [];
  private recommendations: LegacyRecommendation[] = [];
  private readonly archive = new HistoricalArchiveEngine();
  private readonly timeline = new EnterpriseTimelineEngine();
  private readonly achievements = new AchievementRegistryEngine();
  private readonly intelligence = new HistoricalIntelligenceEngine();
  private readonly recommendationEngine = new LegacyRecommendationEngine();
  private readonly metadata = new LegacyMetadataGenerator();
  private readonly validator = new LegacyValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: EmpireLegacyDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getLegacyRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: EmpireLegacyInput): LegacyValidationReport {
    const decision = this.validator.decide(input);
    logLegacyEvent("validation_results");
    return {
      validationReportId: `ele-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Validated historical records cannot be modified without authorization."] : [],
      warnings:
        decision === "partial"
          ? ["Structural legacy signal is not independently validated; validated historical records remain immutable without authorization."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: LegacyRecord[], validation: LegacyValidationReport): EmpireLegacyRunReport {
    return {
      legacyRunReportId: `ele-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      legacyRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: ELE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: EmpireLegacyEngineConfiguration): EmpireLegacyRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: EMPIRE_LEGACY_ENGINE_ID,
          moduleVersion: "PILLOW-ELE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(EMPIRE_LEGACY_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `ele-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EMPIRE_LEGACY_ENGINE_ID,
      engineVersion: "PILLOW-ELE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...ELE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empireMemoryEngine: Boolean(this.dependencies.empireMemoryEngine),
        enterpriseSuccessionEngine: Boolean(this.dependencies.enterpriseSuccessionEngine),
      },
      metadataVersion: ELE_METADATA_VERSION,
    };
    logLegacyEvent("legacy_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: EmpireLegacyInput, config: EmpireLegacyEngineConfiguration): EmpireLegacyRunReport {
    if (!this.engineRecord) {
      throw new Error("Empire Legacy Engine not connected — call connectEmpireLegacyEngine first");
    }

    if (action === "recommend" || action === "generate_historical_intelligence_recommendations") {
      this.recommendations = this.records
        .filter((r) => this.intelligence.significanceRank(r.historicalSignificance) >= config.significanceRecommendationThreshold || r.legacyCategory.includes("missing"))
        .map((r) => ({
          recommendationId: `ele-rec-${r.legacyRecordId}`,
          timestamp: new Date().toISOString(),
          legacyRecordId: r.legacyRecordId,
          recommendationSummary: r.recommendationSummary,
          historicalSignificance: r.historicalSignificance,
          structuralSignalOnly: true,
          neverModifyValidatedHistoricalRecordsWithoutAuthorization: true,
          modifiedValidatedHistoricalRecordWithoutAuthorization: false,
        }));
      logLegacyEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const company = toStructuralCompanyReference(input.companyReference);
    const category = this.archive.resolveCategory(action, input);
    const eventReference = input.missingHistoryHint === true
      ? `missing-${this.archive.eventReference(input, category)}`
      : this.archive.eventReference(input, category);
    const achievementReference = this.achievements.achievementReference(input, category);
    const historicalSignificance = this.intelligence.significance(input);
    const validation = this.validation(input);
    const timestamp = this.timeline.chronologicalStamp();

    const record: LegacyRecord = {
      legacyRecordId: `ele-${Date.now()}-${this.records.length}`,
      timestamp,
      companyReference: company,
      legacyCategory: category,
      historicalEventReference: eventReference,
      achievementReference,
      historicalSignificance,
      recommendationSummary: this.recommendationEngine.summarize(input, company, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverModifyValidatedHistoricalRecordsWithoutAuthorization: true,
      modifiedValidatedHistoricalRecordWithoutAuthorization: false,
      preserveHistoricalTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      legacyTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail" || input.missingHistoryHint === true) {
      logLegacyEvent("legacy_failures");
      this.recovery.attempt();
    }

    if (action.includes("timeline") || action.includes("chronolog")) logLegacyEvent("timeline_updates");
    else if (action.includes("achievement")) logLegacyEvent("achievement_registration");
    else if (action.includes("preserv") || action.includes("archiv")) logLegacyEvent("historical_archiving");
    else logLegacyEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: EmpireLegacyEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: LegacyValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logLegacyEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
