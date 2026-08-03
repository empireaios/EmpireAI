import type { EmpireCapitalAllocation } from "../empire-capital-allocation/engine.js";
import type { EmpireIntelligenceFrameworkEngine } from "../empire-intelligence-framework/engine.js";
import type { CrossEmpireGovernanceEngine } from "../cross-empire-governance-engine/engine.js";
import type { AutonomousInvestmentEngineConfiguration } from "./configuration.js";
import { logInvestmentEvent } from "./aie-logging.js";
import {
  HealthMonitor,
  InvestmentEvaluationEngine,
  InvestmentMetadataGenerator,
  InvestmentOpportunityEngine,
  InvestmentRecommendationEngine,
  InvestmentRiskEngine,
  InvestmentStrategyEngine,
  InvestmentValidator,
  RecoveryManager,
} from "./investment-components.js";
import { AIE_CAPABILITIES, AIE_METADATA_VERSION, AUTONOMOUS_INVESTMENT_ENGINE_ID } from "./paths.js";
import { toStructuralInvestmentTarget } from "./structural-signals.js";
import type {
  AutonomousInvestmentEngineRecord,
  AutonomousInvestmentInput,
  AutonomousInvestmentRunReport,
  InvestmentRecommendation,
  InvestmentRecord,
  InvestmentValidationReport,
} from "./types.js";

export type AutonomousInvestmentDependencies = {
  empireIntelligenceFramework?: EmpireIntelligenceFrameworkEngine | null;
  empireCapitalAllocation?: EmpireCapitalAllocation | null;
  crossEmpireGovernanceEngine?: CrossEmpireGovernanceEngine | null;
};

export class AutonomousInvestmentManager {
  private engineRecord: AutonomousInvestmentEngineRecord | null = null;
  private records: InvestmentRecord[] = [];
  private recommendations: InvestmentRecommendation[] = [];
  private readonly opportunities = new InvestmentOpportunityEngine();
  private readonly evaluation = new InvestmentEvaluationEngine();
  private readonly riskEngine = new InvestmentRiskEngine();
  private readonly strategy = new InvestmentStrategyEngine();
  private readonly recommendationEngine = new InvestmentRecommendationEngine();
  private readonly metadata = new InvestmentMetadataGenerator();
  private readonly validator = new InvestmentValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();

  constructor(private readonly dependencies: AutonomousInvestmentDependencies = {}) {}

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          dependencyPresence: { ...this.engineRecord.dependencyPresence },
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
        }
      : null;
  }

  getInvestmentRecords() {
    return this.records.map((r) => ({ ...r }));
  }

  getRecommendations() {
    return this.recommendations.map((r) => ({ ...r }));
  }

  private validation(input: AutonomousInvestmentInput, executionBlocked = false): InvestmentValidationReport {
    const decision = this.validator.decide(input, executionBlocked);
    logInvestmentEvent("validation_results");
    return {
      validationReportId: `aie-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors: decision === "fail" ? ["Investment execution blocked without governance approval."] : [],
      warnings:
        decision === "partial"
          ? ["Structural investment signal is not independently validated; execution still requires governance approval."]
          : [],
      durationMs: 0,
      metadataVersion: this.metadata.version(),
    };
  }

  private report(action: string, records: InvestmentRecord[], validation: InvestmentValidationReport): AutonomousInvestmentRunReport {
    return {
      investmentRunReportId: `aie-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord: this.engineRecord!,
      investmentRecords: records,
      recommendations: this.getRecommendations(),
      validation,
      durationMs: 0,
      metadataVersion: AIE_METADATA_VERSION,
    };
  }

  connect(_input: Record<string, unknown>, _config: AutonomousInvestmentEngineConfiguration): AutonomousInvestmentRunReport {
    const framework = this.dependencies.empireIntelligenceFramework;
    let frameworkModuleId: string | null = null;
    if (framework) {
      const registration = framework.registerEmpireIntelligenceModule({
        definition: {
          intelligenceModuleIdentifier: AUTONOMOUS_INVESTMENT_ENGINE_ID,
          moduleVersion: "PILLOW-AIE-001",
          moduleType: "intelligence",
          supportedCapabilities: ["health_monitoring"],
        },
        forceRegister: true,
      });
      frameworkModuleId = registration.records[0]?.frameworkId ?? null;
      if (registration.validation.decision !== "fail") {
        framework.manageEnterpriseIntelligenceLifecycle(AUTONOMOUS_INVESTMENT_ENGINE_ID, "start");
      }
    }
    this.engineRecord = {
      engineRecordId: `aie-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTONOMOUS_INVESTMENT_ENGINE_ID,
      engineVersion: "PILLOW-AIE-001",
      currentOperationalState: "connected",
      healthStatus: this.healthMonitor.health(Boolean(framework)),
      validationStatus: framework ? "passed" : "partial",
      supportedCapabilities: [...AIE_CAPABILITIES],
      frameworkModuleId,
      dependencyPresence: {
        empireIntelligenceFramework: Boolean(framework),
        empireCapitalAllocation: Boolean(this.dependencies.empireCapitalAllocation),
        crossEmpireGovernanceEngine: Boolean(this.dependencies.crossEmpireGovernanceEngine),
      },
      metadataVersion: AIE_METADATA_VERSION,
    };
    logInvestmentEvent("investment_connect");
    return this.report("connect", [], this.validation({ validated: Boolean(framework) }));
  }

  run(action: string, input: AutonomousInvestmentInput, config: AutonomousInvestmentEngineConfiguration): AutonomousInvestmentRunReport {
    if (!this.engineRecord) {
      throw new Error("Autonomous Investment Engine not connected — call connectAutonomousInvestmentEngine first");
    }

    if (action === "recommend" || action === "recommend_investment_strategies") {
      this.recommendations = this.records
        .filter((r) => r.investmentPriority >= config.recommendationPriorityThreshold)
        .map((r) => ({
          recommendationId: `aie-rec-${r.investmentId}`,
          timestamp: new Date().toISOString(),
          investmentId: r.investmentId,
          recommendationSummary: r.recommendationSummary,
          investmentPriority: r.investmentPriority,
          structuralSignalOnly: true,
          neverExecuteInvestmentsWithoutGovernanceApproval: true,
          executedWithoutGovernanceApproval: false,
        }));
      logInvestmentEvent("recommendation_generation");
      return this.report(action, [], this.validation({ validated: true }));
    }

    const target = toStructuralInvestmentTarget(input.investmentTarget);
    const category = this.opportunities.resolveCategory(action, input);
    const expectedReturn = this.evaluation.expectedReturn(input);
    const riskScore = this.riskEngine.riskScore(input, config.riskThreshold);
    const investmentPriority = this.strategy.priority(input, expectedReturn, riskScore);
    const isExecute = action.includes("execute");
    const executionStatus = this.strategy.executionStatus(action, input, riskScore, config.riskThreshold);
    const executionBlocked = isExecute && input.governanceApproved !== true;
    const validation = this.validation(input, executionBlocked);

    const record: InvestmentRecord = {
      investmentId: `aie-${Date.now()}-${this.records.length}`,
      timestamp: new Date().toISOString(),
      investmentCategory: category,
      investmentTarget: target,
      expectedReturn,
      riskScore,
      investmentPriority,
      executionStatus: executionBlocked ? "blocked" : executionStatus,
      recommendationSummary: this.recommendationEngine.summarize(input, target, category),
      validationStatus: validation.decision === "pass" ? "passed" : validation.decision === "fail" ? "failed" : "partial",
      metadataVersion: this.metadata.version(),
      structuralSignalOnly: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      neverExecuteInvestmentsWithoutGovernanceApproval: true,
      governanceApproved: input.governanceApproved === true,
      executedWithoutGovernanceApproval: false,
      preserveInvestmentTraceability: true,
      preserveAuditability: true,
      preserveEnterpriseIntegrity: true,
      investmentTraceId: this.metadata.traceId(this.records.length),
      maskSensitiveValues: true,
    };

    this.records.push(record);
    this.engineRecord.currentOperationalState = "active";
    this.engineRecord.timestamp = record.timestamp;
    this.engineRecord.healthStatus = this.healthMonitor.health(config.enabled);

    if (executionBlocked || action.includes("underperform") || validation.decision === "fail") {
      logInvestmentEvent("investment_failures");
      this.recovery.attempt();
    }

    if (isExecute && !executionBlocked) logInvestmentEvent("strategy_execution");
    else if (action.includes("discover")) logInvestmentEvent("investment_discovery");
    else if (action.includes("evaluat")) logInvestmentEvent("investment_evaluation");
    else if (action.includes("risk")) logInvestmentEvent("risk_analysis");
    else logInvestmentEvent(action);

    return this.report(action, [record], validation);
  }

  diagnostics(config: AutonomousInvestmentEngineConfiguration) {
    if (!this.engineRecord) return this.connect({}, config);
    const validation: InvestmentValidationReport = {
      ...this.validation({ validated: config.enabled }),
      decision: config.enabled ? "pass" : "fail",
      errors: config.enabled ? [] : ["Engine disabled"],
    };
    logInvestmentEvent("health_information");
    return this.report("diagnostics", this.records, validation);
  }
}
