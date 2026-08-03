/** X2-16 — Portfolio Optimization Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { PortfolioRiskEngine } from "../portfolio-risk-engine/engine.js";
import type { PortfolioBalanceEngine } from "../portfolio-balance-engine/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { SharedCustomerIntelligence } from "../shared-customer-intelligence/engine.js";
import type { SharedSupplierIntelligence } from "../shared-supplier-intelligence/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import type { AcquisitionEvaluationEngine } from "../acquisition-evaluation-engine/engine.js";
import {
  POE_CAPABILITIES,
  POE_METADATA_VERSION,
  PORTFOLIO_OPTIMIZATION_ENGINE_ID,
  OPTIMIZATION_CATEGORIES,
} from "./paths.js";
import { appendPoeLog } from "./poe-logging.js";
import { EnterpriseOptimizationEngine } from "./enterprise-optimization-engine.js";
import { CapitalOptimizationEngine } from "./capital-optimization-engine.js";
import { ResourceOptimizationEngine } from "./resource-optimization-engine.js";
import { PriorityOptimizationEngine } from "./priority-optimization-engine.js";
import { OptimizationRecommendationEngine } from "./optimization-recommendation-engine.js";
import { OptimizationValidator } from "./optimization-validator.js";
import { OptimizationMetadataGenerator } from "./optimization-metadata-generator.js";
import type { PortfolioOptimizationEngineConfiguration } from "./configuration.js";
import type {
  ConnectPortfolioOptimizationEngineInput,
  DetectOptimizationOpportunitiesInput,
  GenerateOptimizationRecommendationsInput,
  OptimizationCategory,
  OptimizationRecord,
  OptimizationRunReport,
  OptimizePortfolioInput,
  PortfolioOptimizationEngineRecord,
  RankOptimizationPrioritiesInput,
  RunOptimizationDiagnosticsInput,
} from "./types.js";

export type PortfolioOptimizationEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  portfolioRiskEngine: PortfolioRiskEngine | null;
  portfolioBalanceEngine: PortfolioBalanceEngine | null;
  businessHealthRanking: BusinessHealthRanking | null;
  sharedCustomerIntelligence: SharedCustomerIntelligence | null;
  sharedSupplierIntelligence: SharedSupplierIntelligence | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
  acquisitionEvaluationEngine: AcquisitionEvaluationEngine | null;
};

export class PortfolioOptimizationManager {
  private engineRecord: PortfolioOptimizationEngineRecord | null = null;
  private records = new Map<string, OptimizationRecord>();
  private readonly enterprise = new EnterpriseOptimizationEngine();
  private readonly capital = new CapitalOptimizationEngine();
  private readonly resource = new ResourceOptimizationEngine();
  private readonly priority = new PriorityOptimizationEngine();
  private readonly recommendations = new OptimizationRecommendationEngine();
  private readonly validator = new OptimizationValidator();
  private readonly metadataGenerator = new OptimizationMetadataGenerator();

  constructor(private readonly deps: PortfolioOptimizationEngineDependencies) {}

  getEngineRecord(): PortfolioOptimizationEngineRecord | null {
    return this.engineRecord;
  }

  getOptimizationRecords(): OptimizationRecord[] {
    return [...this.records.values()];
  }

  highPriorityCount(): number {
    return this.getOptimizationRecords().filter(
      (r) => r.optimizationPriority === "high" || r.optimizationPriority === "critical",
    ).length;
  }

  averageExpectedBenefit(): number {
    const list = this.getOptimizationRecords();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + r.expectedBenefit, 0) / list.length);
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

  private dependencyPresence(): PortfolioOptimizationEngineRecord["dependencyPresence"] {
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
      portfolioBalanceEngine: this.deps.portfolioBalanceEngine
        ? this.probe(() => this.deps.portfolioBalanceEngine!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      sharedCustomerIntelligence: this.deps.sharedCustomerIntelligence
        ? this.probe(() => this.deps.sharedCustomerIntelligence!.getState())
        : false,
      sharedSupplierIntelligence: this.deps.sharedSupplierIntelligence
        ? this.probe(() => this.deps.sharedSupplierIntelligence!.getState())
        : false,
      portfolioForecastEngine: this.deps.portfolioForecastEngine
        ? this.probe(() => this.deps.portfolioForecastEngine!.getState())
        : false,
      acquisitionEvaluationEngine: this.deps.acquisitionEvaluationEngine
        ? this.probe(() => this.deps.acquisitionEvaluationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): PortfolioOptimizationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Portfolio Optimization Engine not connected — call connectPortfolioOptimizationEngine first",
      );
    }
    return this.engineRecord;
  }

  private store(record: OptimizationRecord): OptimizationRecord {
    const key = `${record.portfolioReference}::${record.optimizationCategory}::${record.optimizationOpportunity}`;
    this.records.set(key, { ...record });
    return { ...record };
  }

  private defaultPortfolio(input?: { portfolioReference?: string }): string {
    return input?.portfolioReference?.trim() || "portfolio-enterprise";
  }

  private failReport(
    action: OptimizationRunReport["action"],
    errors: string[],
    durationMs: number,
  ): OptimizationRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "poe-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: PORTFOLIO_OPTIMIZATION_ENGINE_ID,
        engineVersion: "PILLOW-POE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...POE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: POE_METADATA_VERSION,
      } satisfies PortfolioOptimizationEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `poe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: POE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: PortfolioOptimizationEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: OptimizationRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: PORTFOLIO_OPTIMIZATION_ENGINE_ID,
        moduleVersion: POE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-16",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "optimization.detected",
            "optimization.ranked",
            "optimization.recommended",
            "optimization.analyzed",
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
        PORTFOLIO_OPTIMIZATION_ENGINE_ID,
      );
    }

    appendPoeLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Portfolio Optimization Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `poe-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: POE_METADATA_VERSION,
      },
    };
  }

  connectPortfolioOptimizationEngine(
    _input: ConnectPortfolioOptimizationEngineInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
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
      engineRecordId: `poe-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PORTFOLIO_OPTIMIZATION_ENGINE_ID,
      engineVersion: "PILLOW-POE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 6 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...POE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: POE_METADATA_VERSION,
    };

    appendPoeLog({
      event: "engine_connected",
      level: "info",
      details: "Portfolio Optimization Engine connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Automatic optimization execution blocked beyond approval policies",
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

  private runCategoryOptimization(
    action: OptimizationRunReport["action"],
    category: OptimizationCategory,
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
    factory: () => OptimizationRecord,
  ): OptimizationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateOptimize(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const record = this.store(factory());
      appendPoeLog({
        event: "optimization_analysis",
        level: "info",
        details: `${action} category=${category} portfolio=${record.portfolioReference} benefit=${record.expectedBenefit}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        optimizationRecords: [record],
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

  optimizeEnterprisePerformance(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_enterprise_performance",
      "performance",
      input,
      config,
      () =>
        this.enterprise.optimize({
          portfolioReference,
          category: "performance",
          opportunity:
            input.opportunityHint ??
            "Improve enterprise performance through structural operating adjustments",
          expectedBenefitHint: input.expectedBenefitHint,
          config,
        }),
    );
  }

  optimizeCapitalAllocation(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_capital_allocation",
      "capital",
      input,
      config,
      () =>
        this.capital.optimize({
          portfolioReference,
          expectedBenefitHint: input.expectedBenefitHint,
          opportunityHint: input.opportunityHint,
          config,
        }),
    );
  }

  optimizeResourceUtilization(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_resource_utilization",
      "resource",
      input,
      config,
      () =>
        this.resource.optimize({
          portfolioReference,
          expectedBenefitHint: input.expectedBenefitHint,
          opportunityHint: input.opportunityHint,
          config,
        }),
    );
  }

  optimizeCompanyPriorities(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_company_priorities",
      "priority",
      input,
      config,
      () =>
        this.priority.optimize({
          portfolioReference,
          expectedBenefitHint: input.expectedBenefitHint,
          opportunityHint: input.opportunityHint,
          config,
        }),
    );
  }

  optimizeOperationalEfficiency(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_operational_efficiency",
      "operational_efficiency",
      input,
      config,
      () =>
        this.enterprise.optimize({
          portfolioReference,
          category: "operational_efficiency",
          opportunity:
            input.opportunityHint ??
            "Raise operational efficiency across portfolio companies",
          expectedBenefitHint: input.expectedBenefitHint,
          config,
        }),
    );
  }

  optimizePortfolioBalance(
    input: OptimizePortfolioInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const portfolioReference = this.defaultPortfolio(input);
    return this.runCategoryOptimization(
      "optimize_portfolio_balance",
      "portfolio_balance",
      input,
      config,
      () =>
        this.enterprise.optimize({
          portfolioReference,
          category: "portfolio_balance",
          opportunity:
            input.opportunityHint ??
            "Rebalance portfolio concentration and diversification posture",
          expectedBenefitHint: input.expectedBenefitHint ?? 36,
          config,
        }),
    );
  }

  detectOpportunities(
    input: DetectOptimizationOpportunitiesInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDetect(input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_opportunities", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const categories = (input.categories?.length
        ? input.categories
        : [...OPTIMIZATION_CATEGORIES]) as OptimizationCategory[];

      const detected = categories.map((category) =>
        this.store(
          this.enterprise.optimize({
            portfolioReference,
            category,
            opportunity: `Detected ${category} optimization opportunity for continuous enterprise efficiency`,
            expectedBenefitHint:
              category === "capital" ? 45 : category === "performance" ? 40 : 30,
            config,
          }),
        ),
      );

      appendPoeLog({
        event: "opportunity_detection",
        level: "info",
        details: `Detected ${detected.length} optimization opportunities`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "detect_opportunities",
        engineRecord,
        optimizationRecords: detected,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_opportunities",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  rankPriorities(
    input: RankOptimizationPrioritiesInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "rank_priorities",
          ["Priority ranking requires validated=true"],
          Date.now() - started,
        );
      }
      if (!config.priorityCalculationRulesEnabled) {
        return this.failReport(
          "rank_priorities",
          ["Priority calculation rules disabled"],
          Date.now() - started,
        );
      }

      const scoped = this.getOptimizationRecords().filter((r) =>
        input.portfolioReference ? r.portfolioReference === input.portfolioReference : true,
      );
      const ranked = this.priority.rank(scoped).map((r) => this.store(r));

      appendPoeLog({
        event: "priority_calculation",
        level: "info",
        details: `Ranked ${ranked.length} optimization priorities`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_priorities",
        engineRecord,
        optimizationRecords: ranked,
        validation: {
          validationReportId: `poe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: ranked.length ? "pass" : "partial",
          errors: [],
          warnings: ranked.length ? [] : ["No optimization records to rank"],
          durationMs: Date.now() - started,
          metadataVersion: POE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "rank_priorities",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: GenerateOptimizationRecommendationsInput,
    config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
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

      const recommendations = this.recommendations.recommend({
        records: this.getOptimizationRecords(),
        config,
        portfolioReference: input.portfolioReference,
      });

      appendPoeLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${recommendations.length} optimization recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        optimizationRecords: this.getOptimizationRecords(),
        recommendations,
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
    _input: RunOptimizationDiagnosticsInput,
    _config: PortfolioOptimizationEngineConfiguration,
  ): OptimizationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.getOptimizationRecords();
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        optimizationRecords: records,
        validation: {
          validationReportId: `poe-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: records.length ? [] : ["No optimization analyses yet"],
          durationMs: Date.now() - started,
          metadataVersion: POE_METADATA_VERSION,
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
