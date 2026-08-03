/** X2-20 — Autonomous Portfolio Board Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import type { AcquisitionEvaluationEngine } from "../acquisition-evaluation-engine/engine.js";
import type { PortfolioOptimizationEngine } from "../portfolio-optimization-engine/engine.js";
import type { CompanyLifecycleManager } from "../company-lifecycle-manager/engine.js";
import type { PortfolioExpansionPlanner } from "../portfolio-expansion-planner/engine.js";
import type { EnterpriseValueEngine } from "../enterprise-value-engine/engine.js";
import {
  AUTONOMOUS_PORTFOLIO_BOARD_ID,
  APB_CAPABILITIES,
  APB_METADATA_VERSION,
} from "./paths.js";
import { appendApbLog } from "./apb-logging.js";
import { StrategicAnalysisEngine } from "./strategic-analysis-engine.js";
import { ExecutiveDecisionEngine } from "./executive-decision-engine.js";
import { ExecutivePrioritizationEngine } from "./executive-prioritization-engine.js";
import { ExecutiveRecommendationEngine } from "./executive-recommendation-engine.js";
import { EnterpriseGovernanceEngine } from "./enterprise-governance-engine.js";
import { ExecutiveValidator } from "./executive-validator.js";
import { ExecutiveMetadataGenerator } from "./executive-metadata-generator.js";
import type { AutonomousPortfolioBoardConfiguration } from "./configuration.js";
import type {
  AutonomousPortfolioBoardEngineRecord,
  ConnectAutonomousPortfolioBoardInput,
  ExecutiveBoardRecord,
  ExecutiveBoardRunReport,
  ExecutiveRecommendation,
  GenerateExecutiveRecommendationsInput,
  PrioritizeExecutiveDecisionsInput,
  ReviewAcquisitionOpportunitiesInput,
  ReviewCapitalAllocationInput,
  ReviewEnterprisePerformanceInput,
  ReviewEnterpriseRisksInput,
  ReviewExpansionOpportunitiesInput,
  ReviewPortfolioHealthInput,
  ReviewStrategicOpportunitiesInput,
  RunExecutiveBoardDiagnosticsInput,
} from "./types.js";

export type AutonomousPortfolioBoardDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
  acquisitionEvaluationEngine: AcquisitionEvaluationEngine | null;
  portfolioOptimizationEngine: PortfolioOptimizationEngine | null;
  companyLifecycleManager: CompanyLifecycleManager | null;
  portfolioExpansionPlanner: PortfolioExpansionPlanner | null;
  enterpriseValueEngine: EnterpriseValueEngine | null;
};

export class AutonomousPortfolioBoardManager {
  private engineRecord: AutonomousPortfolioBoardEngineRecord | null = null;
  private readonly records = new Map<string, ExecutiveBoardRecord>();
  private readonly recommendationsRing: ExecutiveRecommendation[] = [];
  private readonly strategicAnalysis = new StrategicAnalysisEngine();
  private readonly decisionEngine = new ExecutiveDecisionEngine();
  private readonly prioritization = new ExecutivePrioritizationEngine();
  private readonly recommendationEngine = new ExecutiveRecommendationEngine();
  private readonly governance = new EnterpriseGovernanceEngine();
  private readonly validator = new ExecutiveValidator();
  private readonly metadataGenerator = new ExecutiveMetadataGenerator();

  constructor(private readonly deps: AutonomousPortfolioBoardDependencies) {}

  getEngineRecord(): AutonomousPortfolioBoardEngineRecord | null {
    return this.engineRecord;
  }

  getBoardRecords(): ExecutiveBoardRecord[] {
    return [...this.records.values()];
  }

  getRecommendations(): ExecutiveRecommendation[] {
    return [...this.recommendationsRing];
  }

  highConfidenceCount(config: AutonomousPortfolioBoardConfiguration): number {
    return this.getBoardRecords().filter(
      (r) => r.decisionConfidence >= config.highDecisionConfidenceThreshold,
    ).length;
  }

  averageDecisionConfidence(): number {
    const list = this.getBoardRecords();
    if (!list.length) return 0;
    return Math.round(
      list.reduce((sum, r) => sum + r.decisionConfidence, 0) / list.length,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.records.clear();
    this.recommendationsRing.length = 0;
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): AutonomousPortfolioBoardEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      capitalDistributionEngine: this.deps.capitalDistributionEngine
        ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
        : false,
      executivePortfolioDashboard: this.deps.executivePortfolioDashboard
        ? this.probe(() => this.deps.executivePortfolioDashboard!.getState())
        : false,
      portfolioRiskEngine: this.deps.portfolioRiskEngine
        ? this.probe(() => this.deps.portfolioRiskEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      portfolioForecastEngine: this.deps.portfolioForecastEngine
        ? this.probe(() => this.deps.portfolioForecastEngine!.getState())
        : false,
      acquisitionEvaluationEngine: this.deps.acquisitionEvaluationEngine
        ? this.probe(() => this.deps.acquisitionEvaluationEngine!.getState())
        : false,
      portfolioOptimizationEngine: this.deps.portfolioOptimizationEngine
        ? this.probe(() => this.deps.portfolioOptimizationEngine!.getState())
        : false,
      companyLifecycleManager: this.deps.companyLifecycleManager
        ? this.probe(() => this.deps.companyLifecycleManager!.getState())
        : false,
      portfolioExpansionPlanner: this.deps.portfolioExpansionPlanner
        ? this.probe(() => this.deps.portfolioExpansionPlanner!.getState())
        : false,
      enterpriseValueEngine: this.deps.enterpriseValueEngine
        ? this.probe(() => this.deps.enterpriseValueEngine!.getState())
        : false,
    };
  }

  private requireConnected(): AutonomousPortfolioBoardEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Autonomous Portfolio Board not connected — call connectAutonomousPortfolioBoard first",
      );
    }
    return this.engineRecord;
  }

  private store(record: ExecutiveBoardRecord): ExecutiveBoardRecord {
    this.records.set(record.executiveBoardId, { ...record });
    return { ...record };
  }

  private defaultPortfolio(input?: { portfolioReference?: string }): string {
    return input?.portfolioReference?.trim() || "portfolio-enterprise";
  }

  failReport(
    action: ExecutiveBoardRunReport["action"],
    errors: string[],
    durationMs: number,
  ): ExecutiveBoardRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "apb-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: AUTONOMOUS_PORTFOLIO_BOARD_ID,
        engineVersion: "PILLOW-APB-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...APB_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: APB_METADATA_VERSION,
      } satisfies AutonomousPortfolioBoardEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `apb-vrpt-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: APB_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: AutonomousPortfolioBoardConfiguration): {
    frameworkModuleId: string | null;
    validation: ExecutiveBoardRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: AUTONOMOUS_PORTFOLIO_BOARD_ID,
        moduleVersion: APB_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-20",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "executive.review",
            "executive.prioritized",
            "executive.recommended",
            "executive.governance",
          ],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "portfolio_module_registration",
          "portfolio_event_routing",
          "portfolio_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.enterprisePortfolioFramework.activatePortfolioModule(
        AUTONOMOUS_PORTFOLIO_BOARD_ID,
      );
    }

    appendApbLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Autonomous Portfolio Board with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `apb-vrpt-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: APB_METADATA_VERSION,
      },
    };
  }

  connectAutonomousPortfolioBoard(
    _input: ConnectAutonomousPortfolioBoardInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const corePresent =
      presence.enterprisePortfolioFramework && presence.portfolioPerformanceEngine;

    this.engineRecord = {
      engineRecordId: `apb-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: AUTONOMOUS_PORTFOLIO_BOARD_ID,
      engineVersion: "PILLOW-APB-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 6 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...APB_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: APB_METADATA_VERSION,
    };

    appendApbLog({
      event: "engine_connected",
      level: "info",
      details:
        "Autonomous Portfolio Board connected — strategic decisions never auto-execute beyond approval policies",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Strategic decisions require configured approval before execution",
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !corePresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runReview(input: {
    action: ExecutiveBoardRunReport["action"];
    validate: () => ExecutiveBoardRunReport["validation"];
    build: (portfolioReference: string) => ExecutiveBoardRecord;
    event: string;
    portfolioReference?: string;
    config: AutonomousPortfolioBoardConfiguration;
  }): ExecutiveBoardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = input.validate();
      if (validation.decision === "fail") {
        return this.failReport(input.action, validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio({
        portfolioReference: input.portfolioReference,
      });
      const raw = input.build(portfolioReference);
      const governed = this.governance.enforce({
        records: [raw],
        config: input.config,
      });
      const record = this.store(governed.records[0]!);

      appendApbLog({
        event: input.event,
        level: "info",
        details: `Executive review ${input.action} portfolio=${portfolioReference} autoExecutionBlocked=true`,
      });

      return this.metadataGenerator.buildRunReport({
        action: input.action,
        engineRecord,
        boardRecords: [record],
        validation: {
          ...validation,
          warnings: [...validation.warnings, ...governed.warnings],
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        input.action,
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  reviewEnterprisePerformance(
    input: ReviewEnterprisePerformanceInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_enterprise_performance",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validatePerformanceReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewPerformance(portfolioReference, config),
      event: "executive_performance_review",
    });
  }

  reviewPortfolioHealth(
    input: ReviewPortfolioHealthInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_portfolio_health",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateHealthReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewHealth(portfolioReference, config),
      event: "executive_health_review",
    });
  }

  reviewStrategicOpportunities(
    input: ReviewStrategicOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_strategic_opportunities",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateOpportunityReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewOpportunities(portfolioReference, config),
      event: "executive_opportunity_review",
    });
  }

  reviewEnterpriseRisks(
    input: ReviewEnterpriseRisksInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_enterprise_risks",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateRiskReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewRisks(portfolioReference, config),
      event: "executive_risk_review",
    });
  }

  reviewCapitalAllocation(
    input: ReviewCapitalAllocationInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_capital_allocation",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateCapitalReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewCapital(portfolioReference, config),
      event: "executive_capital_review",
    });
  }

  reviewExpansionOpportunities(
    input: ReviewExpansionOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_expansion_opportunities",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateExpansionReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewExpansion(portfolioReference, config),
      event: "executive_expansion_review",
    });
  }

  reviewAcquisitionOpportunities(
    input: ReviewAcquisitionOpportunitiesInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    return this.runReview({
      action: "review_acquisition_opportunities",
      portfolioReference: input.portfolioReference,
      config,
      validate: () => this.validator.validateAcquisitionReview(input, config),
      build: (portfolioReference) =>
        this.strategicAnalysis.reviewAcquisition(portfolioReference, config),
      event: "executive_acquisition_review",
    });
  }

  prioritizeExecutiveDecisions(
    input: PrioritizeExecutiveDecisionsInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePrioritization(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "prioritize_executive_decisions",
          validation.errors,
          Date.now() - started,
        );
      }

      const portfolioReference = this.defaultPortfolio(input);
      const existing = this.getBoardRecords().filter(
        (r) => r.portfolioReference === portfolioReference,
      );
      const prioritized = this.store(
        this.prioritization.prioritize({
          portfolioReference,
          records: existing,
          config,
        }),
      );
      void this.decisionEngine;

      appendApbLog({
        event: "executive_prioritization",
        level: "info",
        details: `Prioritized executive decisions portfolio=${portfolioReference}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "prioritize_executive_decisions",
        engineRecord,
        boardRecords: [prioritized],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "prioritize_executive_decisions",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateExecutiveRecommendations(
    input: GenerateExecutiveRecommendationsInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRecommendations(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_executive_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      const portfolioReference = this.defaultPortfolio(input);
      const recommendations = this.recommendationEngine.generate({
        portfolioReference,
        records: this.getBoardRecords().filter(
          (r) => r.portfolioReference === portfolioReference,
        ),
        config,
      });
      this.recommendationsRing.push(...recommendations);
      if (this.recommendationsRing.length > 100) {
        this.recommendationsRing.splice(0, this.recommendationsRing.length - 100);
      }

      appendApbLog({
        event: "executive_recommendations",
        level: "info",
        details: `Generated ${recommendations.length} executive recommendations (autoExecutionBlocked=true)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_executive_recommendations",
        engineRecord,
        boardRecords: this.getBoardRecords().filter(
          (r) => r.portfolioReference === portfolioReference,
        ),
        recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_executive_recommendations",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: RunExecutiveBoardDiagnosticsInput,
    config: AutonomousPortfolioBoardConfiguration,
  ): ExecutiveBoardRunReport {
    const started = Date.now();
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "apb-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: AUTONOMOUS_PORTFOLIO_BOARD_ID,
        engineVersion: "PILLOW-APB-001",
        currentOperationalState: "disconnected",
        healthStatus: "standby",
        validationStatus: "pending",
        supportedCapabilities: [...APB_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: APB_METADATA_VERSION,
      } satisfies AutonomousPortfolioBoardEngineRecord);

    const configValidation = this.validator.validateConfiguration(config);
    const presence = this.dependencyPresence();
    const warnings = [
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Diagnostics only — no strategic execution",
    ];

    appendApbLog({
      event: "diagnostics",
      level: "info",
      details: "Autonomous Portfolio Board diagnostics complete",
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      boardRecords: this.getBoardRecords(),
      recommendations: this.getRecommendations(),
      validation: {
        ...configValidation,
        warnings,
        decision: configValidation.decision === "fail" ? "fail" : "pass",
      },
      durationMs: Date.now() - started,
    });
  }
}
