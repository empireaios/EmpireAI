import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { EmpireSelfImprovementEngine } from "../empire-self-improvement-engine/engine.js";
import type { ExecutiveEmpireDashboardEngine } from "../executive-empire-dashboard/engine.js";
import type { CrossEmpireGovernanceEngineConfiguration } from "./configuration.js";
import {
  ConstitutionalRulesEngine,
  GovernanceComplianceEngine,
  GovernanceMetadataGenerator,
  GovernancePolicyEngine,
  GovernanceRecommendationEngine,
  GovernanceRiskAnalyzer,
  GovernanceValidator,
  HealthMonitor,
  RecoveryManager,
} from "./constitutional-rules-engine.js";
import { logGovernanceEvent } from "./ceg-logging.js";
import { CEG_CAPABILITIES, CEG_METADATA_VERSION, CROSS_EMPIRE_GOVERNANCE_ENGINE_ID } from "./paths.js";
import { toStructuralCompanyReference } from "./structural-signals.js";
import type {
  CrossEmpireGovernanceEngineRecord,
  CrossEmpireGovernanceInput,
  CrossEmpireGovernanceRunReport,
  GovernanceRecommendation,
  GovernanceRecord,
  GovernanceValidationReport,
} from "./types.js";

export type CrossEmpireGovernanceDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  executiveEmpireDashboard?: ExecutiveEmpireDashboardEngine | null;
  empireSelfImprovementEngine?: EmpireSelfImprovementEngine | null;
};

export class CrossEmpireGovernanceManager {
  private engineRecord: CrossEmpireGovernanceEngineRecord | null = null;
  private records: GovernanceRecord[] = [];
  private recommendations: GovernanceRecommendation[] = [];
  private readonly constitutionalRules = new ConstitutionalRulesEngine();
  private readonly policies = new GovernancePolicyEngine();
  private readonly compliance = new GovernanceComplianceEngine();
  private readonly riskAnalyzer = new GovernanceRiskAnalyzer();
  private readonly recommendationEngine = new GovernanceRecommendationEngine();
  private readonly metadata = new GovernanceMetadataGenerator();
  private readonly validator = new GovernanceValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: CrossEmpireGovernanceDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? { ...this.engineRecord, dependencyPresence: { ...this.engineRecord.dependencyPresence }, supportedCapabilities: [...this.engineRecord.supportedCapabilities] }
      : null;
  }

  getGovernanceRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: CrossEmpireGovernanceInput): GovernanceValidationReport {
    const decision = this.validator.decide(input);
    logGovernanceEvent("governance_validation");
    return {
      validationReportId: `ceg-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Non-compliant operation cannot be approved automatically."] : [],
      warnings:
        decision === "partial"
          ? ["Structural governance signal is not independently validated; constitutional governance remains enforced."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: GovernanceRecord[], validation: GovernanceValidationReport): CrossEmpireGovernanceRunReport {
    return {
      governanceRunReportId: `ceg-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      governanceRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: CEG_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: CrossEmpireGovernanceEngineConfiguration): CrossEmpireGovernanceRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: CROSS_EMPIRE_GOVERNANCE_ENGINE_ID,
          moduleVersion: "PILLOW-CEG-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(CROSS_EMPIRE_GOVERNANCE_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `ceg-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: CROSS_EMPIRE_GOVERNANCE_ENGINE_ID,
      engineVersion: "PILLOW-CEG-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...CEG_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        executiveEmpireDashboard: Boolean(this.dependencies.executiveEmpireDashboard),
        empireSelfImprovementEngine: Boolean(this.dependencies.empireSelfImprovementEngine),
      },
      metadataVersion: CEG_METADATA_VERSION,
    };
    logGovernanceEvent("governance_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: CrossEmpireGovernanceInput, config: CrossEmpireGovernanceEngineConfiguration): CrossEmpireGovernanceRunReport {
    if (!this.engineRecord) {
      throw new Error("Cross-Empire Governance Engine not connected — call connectCrossEmpireGovernanceEngine first");
    }

    if (action === "recommend" || action === "generate_governance_recommendations") {
      this.recommendations = this.records
        .filter((r) => r.complianceStatus !== "compliant" || r.riskLevel !== "low")
        .map((r) => ({
          recommendationId: `ceg-rec-${r.governanceRecordId}`,
          timestamp: new Date().toISOString(),
          governanceRecordId: r.governanceRecordId,
          recommendationSummary: r.recommendationSummary,
          riskLevel: r.riskLevel,
          structuralSignalOnly: true,
          neverBypassConstitutionalGovernance: true,
          neverApproveNonCompliantOperationsAutomatically: true,
          approvedNonCompliantOperation: false,
        }));
      logGovernanceEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const company = toStructuralCompanyReference(input.companyReference);
    const category = this.policies.resolveCategory(action, input);
    const ruleRef = this.constitutionalRules.resolveRuleReference(input);
    const compliance = this.compliance.evaluate(input, config.complianceThreshold);
    const riskLevel = this.riskAnalyzer.evaluate(input, compliance.complianceStatus);
    const validation = this.validation(input);

    // Safety: never approve non-compliant operations automatically, even if caller requests it.
    const approvedNonCompliantOperation = false as const;

    const record: GovernanceRecord = {
      governanceRecordId: `ceg-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      companyReference: company,
      governanceCategory: category,
      constitutionalRuleReference: ruleRef,
      complianceStatus: compliance.complianceStatus,
      riskLevel,
      recommendationSummary: this.recommendationEngine.summarize(input, company, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverBypassConstitutionalGovernance: true,
      neverApproveNonCompliantOperationsAutomatically: true,
      approvedNonCompliantOperation,
      preserveGovernanceTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      governanceTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (action.includes("violation") || action.includes("conflict") || validation.decision === "fail") {
      logGovernanceEvent("governance_failure_signal");
      this.recovery.attempt();
    }

    logGovernanceEvent(action);
    return this.report(action, [record], validation);
  }

  diagnostics(config: CrossEmpireGovernanceEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: GovernanceValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logGovernanceEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
