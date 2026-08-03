import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireKnowledgeEngine } from "../empire-knowledge-engine/engine.js";
import type { GrandKingAdvisoryEngine } from "../grand-king-advisory-engine/engine.js";
import type { CivilizationKnowledgeEngineConfiguration } from "./configuration.js";
import { logKnowledgeEvent } from "./cke-logging.js";
import {
  ExternalKnowledgeAcquisitionEngine,
  HealthMonitor,
  IndustryIntelligenceEngine,
  KnowledgeMetadataGenerator,
  KnowledgeRecommendationEngine,
  KnowledgeValidator,
  RecoveryManager,
  StrategicKnowledgeAnalysisEngine,
  TechnologyIntelligenceEngine,
} from "./knowledge-components.js";
import { CKE_CAPABILITIES, CKE_METADATA_VERSION, CIVILIZATION_KNOWLEDGE_ENGINE_ID } from "./paths.js";
import { toStructuralSourceDomain } from "./structural-signals.js";
import type {
  CivilizationKnowledgeEngineRecord,
  CivilizationKnowledgeInput,
  CivilizationKnowledgeRecommendation,
  CivilizationKnowledgeRecord,
  CivilizationKnowledgeRunReport,
  CivilizationKnowledgeValidationReport,
} from "./types.js";

export type CivilizationKnowledgeDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empireKnowledgeEngine?: EmpireKnowledgeEngine | null;
  grandKingAdvisoryEngine?: GrandKingAdvisoryEngine | null;
};

export class CivilizationKnowledgeManager {
  private engineRecord: CivilizationKnowledgeEngineRecord | null = null;
  private records: CivilizationKnowledgeRecord[] = [];
  private recommendations: CivilizationKnowledgeRecommendation[] = [];
  private readonly acquisition = new ExternalKnowledgeAcquisitionEngine();
  private readonly industry = new IndustryIntelligenceEngine();
  private readonly technology = new TechnologyIntelligenceEngine();
  private readonly analysis = new StrategicKnowledgeAnalysisEngine();
  private readonly recommendationEngine = new KnowledgeRecommendationEngine();
  private readonly metadata = new KnowledgeMetadataGenerator();
  private readonly validator = new KnowledgeValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: CivilizationKnowledgeDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getKnowledgeRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: CivilizationKnowledgeInput): CivilizationKnowledgeValidationReport {
    const decision = this.validator.decide(input);
    logKnowledgeEvent("validation_results");
    return {
      validationReportId: `cke-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Unvalidated external knowledge cannot integrate into enterprise decision-making automatically."] : [],
      warnings:
        decision === "partial"
          ? ["Structural civilization knowledge signal is not independently validated; automatic decision integration remains blocked."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: CivilizationKnowledgeRecord[], validation: CivilizationKnowledgeValidationReport): CivilizationKnowledgeRunReport {
    return {
      knowledgeRunReportId: `cke-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      knowledgeRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: CKE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: CivilizationKnowledgeEngineConfiguration): CivilizationKnowledgeRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: CIVILIZATION_KNOWLEDGE_ENGINE_ID,
          moduleVersion: "PILLOW-CKE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(CIVILIZATION_KNOWLEDGE_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `cke-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CIVILIZATION_KNOWLEDGE_ENGINE_ID,
      engineVersion: "PILLOW-CKE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...CKE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empireKnowledgeEngine: Boolean(this.dependencies.empireKnowledgeEngine),
        grandKingAdvisoryEngine: Boolean(this.dependencies.grandKingAdvisoryEngine),
      },
      metadataVersion: CKE_METADATA_VERSION,
    };
    logKnowledgeEvent("knowledge_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: CivilizationKnowledgeInput, config: CivilizationKnowledgeEngineConfiguration): CivilizationKnowledgeRunReport {
    if (!this.engineRecord) {
      throw new Error("Civilization Knowledge Engine not connected — call connectCivilizationKnowledgeEngine first");
    }

    if (action === "recommend" || action === "generate_strategic_knowledge_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.strategicRelevanceScore >= config.strategicRelevanceThreshold)
        .sort((a, b) => b.strategicRelevanceScore - a.strategicRelevanceScore)
        .map((r) => ({
          recommendationId: `cke-rec-${r.knowledgeRecordId}`,
          timestamp: new Date().toISOString(),
          knowledgeRecordId: r.knowledgeRecordId,
          recommendationSummary: r.recommendationSummary,
          strategicRelevanceScore: r.strategicRelevanceScore,
          structuralSignalOnly: true,
          neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true,
          integratedUnvalidatedExternalKnowledgeAutomatically: false,
        }));
      logKnowledgeEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const domain = toStructuralSourceDomain(input.sourceDomain);
    const category = this.acquisition.resolveCategory(action, input);
    const strategicRelevanceScore = this.industry.relevanceScore(input);
    const businessImpact = this.technology.impact(input, strategicRelevanceScore);
    this.analysis.analyze(input, strategicRelevanceScore);
    const validation = this.validation(input);

    const record: CivilizationKnowledgeRecord = {
      knowledgeRecordId: `cke-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      knowledgeCategory: category,
      sourceDomain: domain,
      strategicRelevanceScore,
      businessImpact,
      recommendationSummary: this.recommendationEngine.summarize(input, domain, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true,
      integratedUnvalidatedExternalKnowledgeAutomatically: false,
      preserveKnowledgeTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      knowledgeTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (validation.decision === "fail") {
      logKnowledgeEvent("knowledge_failures");
      this.recovery.attempt();
    }

    if (action.includes("monitor") || action.includes("acquir")) logKnowledgeEvent("external_knowledge_acquisition");
    else if (action.includes("rank") || action.includes("relevance")) logKnowledgeEvent("strategic_relevance_evaluation");
    else if (action.includes("analyz") || action.includes("identif")) logKnowledgeEvent("knowledge_analysis");
    else logKnowledgeEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: CivilizationKnowledgeEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: CivilizationKnowledgeValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logKnowledgeEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
