/** X2-18 — Portfolio Expansion Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { AcquisitionEvaluationEngine } from "../acquisition-evaluation-engine/engine.js";
import type { PortfolioOptimizationEngine } from "../portfolio-optimization-engine/engine.js";
import type { CompanyLifecycleManager } from "../company-lifecycle-manager/engine.js";
import {
  EXPANSION_CATEGORIES,
  PEP_CAPABILITIES,
  PEP_METADATA_VERSION,
  PORTFOLIO_EXPANSION_PLANNER_ID,
} from "./paths.js";
import { appendPepLog } from "./pep-logging.js";
import { ExpansionOpportunityEngine } from "./expansion-opportunity-engine.js";
import { MarketExpansionEngine } from "./market-expansion-engine.js";
import { AcquisitionExpansionEngine } from "./acquisition-expansion-engine.js";
import { ExpansionPrioritizationEngine } from "./expansion-prioritization-engine.js";
import { ExpansionRecommendationEngine } from "./expansion-recommendation-engine.js";
import { ExpansionValidator } from "./expansion-validator.js";
import { ExpansionMetadataGenerator } from "./expansion-metadata-generator.js";
import type { PortfolioExpansionPlannerConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioExpansionPlannerInput,
  EstimateExpansionCostsInput,
  EstimateExpansionReturnsInput,
  EvaluateExpansionInput,
  ExpansionCategory,
  ExpansionRecord,
  ExpansionRunReport,
  GenerateExpansionRecommendationsInput,
  IdentifyExpansionOpportunitiesInput,
  PortfolioExpansionEngineRecord,
  PrioritizeExpansionsInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";

export type PortfolioExpansionPlannerDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  acquisitionEvaluationEngine: AcquisitionEvaluationEngine | null;
  portfolioOptimizationEngine: PortfolioOptimizationEngine | null;
  companyLifecycleManager: CompanyLifecycleManager | null;
};

export class PortfolioExpansionManager {
  private engineRecord: PortfolioExpansionEngineRecord | null = null;
  private records = new Map<string, ExpansionRecord>();
  private readonly opportunities = new ExpansionOpportunityEngine();
  private readonly market = new MarketExpansionEngine();
  private readonly acquisition = new AcquisitionExpansionEngine();
  private readonly prioritization = new ExpansionPrioritizationEngine();
  private readonly recommendations = new ExpansionRecommendationEngine();
  private readonly validator = new ExpansionValidator();
  private readonly metadataGenerator = new ExpansionMetadataGenerator();

  constructor(private readonly deps: PortfolioExpansionPlannerDependencies) {}

  getEngineRecord(): PortfolioExpansionEngineRecord | null {
    return this.engineRecord;
  }

  getExpansionRecords(): ExpansionRecord[] {
    return [...this.records.values()];
  }

  highPriorityCount(): number {
    return this.getExpansionRecords().filter(
      (r) => r.expansionPriority === "high" || r.expansionPriority === "critical",
    ).length;
  }

  averageExpectedReturn(): number {
    const list = this.getExpansionRecords();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + r.expectedReturn, 0) / list.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.records.clear();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): PortfolioExpansionEngineRecord["dependencyPresence"] {
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
      portfolioRiskEngine: this.deps.portfolioRiskEngine
        ? this.probe(() => this.deps.portfolioRiskEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
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
    };
  }

  private requireConnected(): PortfolioExpansionEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Expansion Planner not connected — call connectPortfolioExpansionPlanner first",
      );
    }
    return this.engineRecord;
  }

  private store(record: ExpansionRecord): ExpansionRecord {
    const key = `${record.portfolioReference}::${record.expansionCategory}::${record.expansionPlanId}`;
    this.records.set(key, { ...record });
    return { ...record };
  }

  private defaultPortfolio(input?: { portfolioReference?: string }): string {
    return input?.portfolioReference?.trim() || "portfolio-enterprise";
  }

  failReport(
    action: ExpansionRunReport["action"],
    errors: string[],
    durationMs: number,
  ): ExpansionRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "pep-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_EXPANSION_PLANNER_ID,
        engineVersion: "PILLOW-PEP-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...PEP_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: PEP_METADATA_VERSION,
      } satisfies PortfolioExpansionEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `pep-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: PEP_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: PortfolioExpansionPlannerConfiguration): {
    frameworkModuleId: string | null;
    validation: ExpansionRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_EXPANSION_PLANNER_ID,
        moduleVersion: PEP_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-18",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "expansion.identified",
            "expansion.evaluated",
            "expansion.prioritized",
            "expansion.recommended",
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
        PORTFOLIO_EXPANSION_PLANNER_ID,
      );
    }

    appendPepLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Expansion Planner with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `pep-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PEP_METADATA_VERSION,
      },
    };
  }

  connectPortfolioExpansionPlanner(
    _input: ConnectPortfolioExpansionPlannerInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
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
      engineRecordId: `pep-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_EXPANSION_PLANNER_ID,
      engineVersion: "PILLOW-PEP-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 5 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...PEP_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: PEP_METADATA_VERSION,
    };

    appendPepLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Expansion Planner connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Automatic expansion initiation blocked beyond approval policies",
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

  identifyOpportunities(
    input: IdentifyExpansionOpportunitiesInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateIdentify(input, config);
      if (validation.decision === "fail") {
        return this.failReport("identify_opportunities", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const categories = (input.categories?.length
        ? input.categories
        : [...EXPANSION_CATEGORIES]) as ExpansionCategory[];

      const discovered = this.opportunities
        .discover({ portfolioReference, categories, config })
        .map((r) => this.store(r));

      appendPepLog({
        event: "opportunity_identification",
        level: "info",
        details: `Identified ${discovered.length} expansion opportunities`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "identify_opportunities",
        engineRecord,
        expansionRecords: discovered,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "identify_opportunities",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  private runEvaluation(
    action: ExpansionRunReport["action"],
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
    factory: () => ExpansionRecord,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEvaluate(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = this.store(factory());
      appendPepLog({
        event: "expansion_evaluation",
        level: "info",
        details: `${action} category=${record.expansionCategory} portfolio=${record.portfolioReference} return=${record.expectedReturn}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        expansionRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        action,
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  evaluateMarkets(
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runEvaluation("evaluate_markets", input, config, () =>
      this.market.evaluateMarket({
        portfolioReference,
        opportunityHint: input.opportunityHint,
        investmentHint: input.investmentHint,
        returnHint: input.returnHint,
        config,
      }),
    );
  }

  evaluateIndustries(
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runEvaluation("evaluate_industries", input, config, () =>
      this.market.evaluateIndustry({
        portfolioReference,
        opportunityHint: input.opportunityHint,
        investmentHint: input.investmentHint,
        returnHint: input.returnHint,
        config,
      }),
    );
  }

  evaluateInternal(
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runEvaluation("evaluate_internal", input, config, () =>
      this.opportunities.evaluateInternal({
        portfolioReference,
        opportunityHint: input.opportunityHint,
        investmentHint: input.investmentHint,
        returnHint: input.returnHint,
        config,
      }),
    );
  }

  evaluateAcquisition(
    input: EvaluateExpansionInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runEvaluation("evaluate_acquisition", input, config, () =>
      this.acquisition.evaluate({
        portfolioReference,
        opportunityHint: input.opportunityHint,
        investmentHint: input.investmentHint,
        returnHint: input.returnHint,
        config,
      }),
    );
  }

  prioritizeExpansions(
    input: PrioritizeExpansionsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePrioritize(input, config);
      if (validation.decision === "fail") {
        return this.failReport("prioritize", validation.errors, Date.now() - started);
      }

      const scoped = this.getExpansionRecords().filter((r) =>
        input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
      );
      const ranked = this.prioritization.rank(scoped).map((r) => this.store(r));

      appendPepLog({
        event: "expansion_prioritization",
        level: "info",
        details: `Prioritized ${ranked.length} expansion plans`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "prioritize",
        engineRecord,
        expansionRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "prioritize",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  estimateCosts(
    input: EstimateExpansionCostsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEstimateCosts(input, config);
      if (validation.decision === "fail") {
        return this.failReport("estimate_costs", validation.errors, Date.now() - started);
      }

      const scoped = this.getExpansionRecords().filter((r) =>
        input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
      );
      const estimated = this.market.estimateCosts(scoped).map((r) => this.store(r));

      appendPepLog({
        event: "cost_estimation",
        level: "info",
        details: `Estimated costs for ${estimated.length} expansion plans`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "estimate_costs",
        engineRecord,
        expansionRecords: estimated,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "estimate_costs",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  estimateReturns(
    input: EstimateExpansionReturnsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEstimateReturns(input, config);
      if (validation.decision === "fail") {
        return this.failReport("estimate_returns", validation.errors, Date.now() - started);
      }

      const scoped = this.getExpansionRecords().filter((r) =>
        input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
      );
      const estimated = this.market.estimateReturns(scoped).map((r) => this.store(r));

      appendPepLog({
        event: "return_estimation",
        level: "info",
        details: `Estimated returns for ${estimated.length} expansion plans`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "estimate_returns",
        engineRecord,
        expansionRecords: estimated,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "estimate_returns",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: GenerateExpansionRecommendationsInput,
    config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRecommendations(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "generate_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      const recs = this.recommendations.recommend({
        records: this.getExpansionRecords(),
        config,
        portfolioReference: input.portfolioReference,
      });

      appendPepLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${recs.length} expansion recommendations (auto-initiation blocked)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        expansionRecords: this.getExpansionRecords(),
        recommendations: recs,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_recommendations",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    _input: RunExpansionDiagnosticsInput,
    _config: PortfolioExpansionPlannerConfiguration,
  ): ExpansionRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.getExpansionRecords();
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        expansionRecords: records,
        validation: {
          validationReportId: `pep-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: records.length ? [] : ["No expansion plans yet"],
          durationMs: Date.now() - started,
          metadataVersion: PEP_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }
}
