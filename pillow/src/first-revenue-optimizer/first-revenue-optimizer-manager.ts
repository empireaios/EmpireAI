/** X1-14 — First Revenue Optimizer Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { ProductPortfolioBuilder } from "../product-portfolio-builder/engine.js";
import type { PricingStrategyEngine } from "../pricing-strategy-engine/engine.js";
import type { GrowthInitializationEngine } from "../growth-initialization-engine/engine.js";
import type { LaunchMonitoringEngine } from "../launch-monitoring-engine/engine.js";
import { FIRST_REVENUE_OPTIMIZER_ID, FRO_METADATA_VERSION } from "./paths.js";
import { appendFroLog } from "./fro-logging.js";
import { RevenueRecordStore } from "./revenue-record-store.js";
import { RevenueAnalysisEngine } from "./revenue-analysis-engine.js";
import { ProductPerformanceEngine } from "./product-performance-engine.js";
import { CustomerPurchaseAnalyzer } from "./customer-purchase-analyzer.js";
import { RevenueOptimizationEngine } from "./revenue-optimization-engine.js";
import { RevenueRecommendationEngine } from "./revenue-recommendation-engine.js";
import { RevenueValidator } from "./revenue-validator.js";
import { RevenueMetadataGenerator } from "./revenue-metadata-generator.js";
import type { FirstRevenueOptimizerConfiguration } from "./configuration.js";
import type {
  ConnectFirstRevenueOptimizerInput,
  OptimizeFirstRevenueInput,
  RevenueActionInput,
  RevenueOptimizationRecord,
  RevenueOptimizerEngineRecord,
  RevenueRunReport,
} from "./types.js";

export type FirstRevenueOptimizerDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  productPortfolioBuilder: ProductPortfolioBuilder | null;
  pricingStrategyEngine: PricingStrategyEngine | null;
  growthInitializationEngine: GrowthInitializationEngine | null;
  launchMonitoringEngine: LaunchMonitoringEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class FirstRevenueOptimizerManager {
  private engineRecord: RevenueOptimizerEngineRecord | null = null;
  private readonly store = new RevenueRecordStore();
  private readonly analysis = new RevenueAnalysisEngine();
  private readonly products = new ProductPerformanceEngine();
  private readonly customers = new CustomerPurchaseAnalyzer();
  private readonly optimization = new RevenueOptimizationEngine();
  private readonly recommendations = new RevenueRecommendationEngine();
  private readonly validator = new RevenueValidator();
  private readonly metadataGenerator = new RevenueMetadataGenerator();

  constructor(private readonly deps: FirstRevenueOptimizerDependencies) {}

  getEngineRecord(): RevenueOptimizerEngineRecord | null {
    return this.engineRecord;
  }

  getRevenueRecords(): RevenueOptimizationRecord[] {
    return this.store.list();
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.store.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): RevenueOptimizerEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      productPortfolioBuilder: this.deps.productPortfolioBuilder
        ? this.probe(() => this.deps.productPortfolioBuilder!.getState())
        : false,
      pricingStrategyEngine: this.deps.pricingStrategyEngine
        ? this.probe(() => this.deps.pricingStrategyEngine!.getState())
        : false,
      growthInitializationEngine: this.deps.growthInitializationEngine
        ? this.probe(() => this.deps.growthInitializationEngine!.getState())
        : false,
      launchMonitoringEngine: this.deps.launchMonitoringEngine
        ? this.probe(() => this.deps.launchMonitoringEngine!.getState())
        : false,
    };
  }

  private requireConnected(): RevenueOptimizerEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "First Revenue Optimizer not connected — call connectFirstRevenueOptimizer first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: OptimizeFirstRevenueInput | RevenueActionInput): {
    companyReference: string;
    productReference: string;
    pricingReference: string;
    growthPlanReference: string;
    monitoringReference: string;
    industry: string;
    hasPortfolio: boolean;
    hasPricing: boolean;
    hasGrowth: boolean;
    hasMonitoring: boolean;
    portfolioProfitabilityScore: number | null;
    portfolioDemandScore: number | null;
    productReferences: string | null;
    growthScore: number | null;
    operationalHealthScore: number | null;
    salesSummary: string | null;
    customerActivitySummary: string | null;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const portfolio = safe(() => {
      const records = this.deps.productPortfolioBuilder?.getPortfolioRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const pricing = safe(() => {
      const records = this.deps.pricingStrategyEngine?.getPricingRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const growth = safe(() => {
      const records = this.deps.growthInitializationEngine?.getGrowthRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const monitoring = safe(() => {
      const records = this.deps.launchMonitoringEngine?.getMonitoringRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);

    const productReference =
      input.productReference?.trim() ||
      portfolio?.portfolioId ||
      `structural://product/${industry}`;
    const pricingReference =
      input.pricingReference?.trim() ||
      pricing?.pricingRecordId ||
      `structural://pricing/${industry}`;
    const growthPlanReference =
      input.growthPlanReference?.trim() ||
      growth?.growthPlanId ||
      `structural://growth-plan/${industry}`;
    const monitoringReference =
      input.monitoringReference?.trim() ||
      monitoring?.launchMonitoringId ||
      `structural://monitoring/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      portfolio?.companyReference ||
      growth?.companyReference ||
      monitoring?.companyReference ||
      `structural://company/${industry}`;

    return {
      companyReference,
      productReference,
      pricingReference,
      growthPlanReference,
      monitoringReference,
      industry,
      hasPortfolio: Boolean(portfolio) || Boolean(input.productReference),
      hasPricing: Boolean(pricing) || Boolean(input.pricingReference),
      hasGrowth: Boolean(growth) || Boolean(input.growthPlanReference),
      hasMonitoring: Boolean(monitoring) || Boolean(input.monitoringReference),
      portfolioProfitabilityScore: portfolio?.portfolioProfitabilityScore ?? null,
      portfolioDemandScore: portfolio?.portfolioDemandScore ?? null,
      productReferences: portfolio?.productReferences ?? null,
      growthScore: growth?.growthScore ?? null,
      operationalHealthScore: monitoring?.operationalHealthScore ?? null,
      salesSummary: monitoring?.salesSummary ?? null,
      customerActivitySummary: monitoring?.customerActivitySummary ?? null,
    };
  }

  registerWithFramework(
    config: FirstRevenueOptimizerConfiguration,
  ): { frameworkModuleId: string | null; validation: RevenueRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: FIRST_REVENUE_OPTIMIZER_ID,
        moduleVersion: FRO_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-14",
        authenticationMethod: "none",
        credentialRef: "vault://first-revenue-optimizer",
        apiEndpointConfig: {
          baseUrl: "internal://first-revenue-optimizer",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["revenue.optimized", "revenue.recommended", "revenue.failed"],
          maxEventsPerMinute: 60,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: true,
          requestsPerMinute: 60,
          burstLimit: 10,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "company_module_registration",
          "company_module_activation",
          "company_event_routing",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.companyFactoryFramework.activateCompanyModule(FIRST_REVENUE_OPTIMIZER_ID);
    }

    appendFroLog({
      event: "framework_registration",
      level: "info",
      details: `Registered First Revenue Optimizer with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `fro-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: FRO_METADATA_VERSION,
      },
    };
  }

  connectFirstRevenueOptimizer(
    _input: ConnectFirstRevenueOptimizerInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    const started = Date.now();
    const frameworkReg = this.registerWithFramework(config);
    const deps = this.dependencyPresence();

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: frameworkReg.validation.decision === "fail" ? "failed" : "active",
      validationStatus:
        frameworkReg.validation.decision === "fail"
          ? "failed"
          : frameworkReg.validation.decision === "partial"
            ? "partial"
            : "passed",
      dependencyPresence: deps,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (frameworkReg.validation.warnings.length > 0) {
      validation.warnings.push(...frameworkReg.validation.warnings);
      if (validation.decision === "pass") validation.decision = "partial";
    }

    appendFroLog({
      event: "engine_connect",
      level: "info",
      details: `First Revenue Optimizer connected · deps=${Object.values(deps).filter(Boolean).length}/5`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      revenueRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  optimizeFirstRevenue(
    input: OptimizeFirstRevenueInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateOptimizeInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_first_revenue",
        engineRecord: engine,
        revenueRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxOptimizationsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_first_revenue",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max optimizations per cycle reached (${config.maxOptimizationsPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.productReference}|${ctx.pricingReference}|${ctx.monitoringReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "optimize_first_revenue",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate revenue optimization detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const productPerformanceScore = this.products.score({
      portfolioProfitabilityScore: ctx.portfolioProfitabilityScore,
      portfolioDemandScore: ctx.portfolioDemandScore,
      hasPortfolio: ctx.hasPortfolio,
      evaluationEnabled: config.productEvaluationRulesEnabled,
    });

    const revenueSummary = config.revenueAnalysisRulesEnabled
      ? this.analysis.analyzeEarlyRevenue({
          industry: ctx.industry,
          growthScore: ctx.growthScore,
          operationalHealthScore: ctx.operationalHealthScore,
          hasMonitoring: ctx.hasMonitoring,
        })
      : "analysis-disabled";

    const customerPurchaseSummary = this.customers.analyze({
      industry: ctx.industry,
      hasMonitoring: ctx.hasMonitoring,
      customerActivitySummary: ctx.customerActivitySummary,
      growthScore: ctx.growthScore,
    });

    const bottleneckSummary = this.analysis.detectBottlenecks({
      productPerformanceScore,
      operationalHealthScore: ctx.operationalHealthScore,
      hasPricing: ctx.hasPricing,
    });

    const underperformingProductsSummary = this.products.detectUnderperforming({
      productPerformanceScore,
      productReferences: ctx.productReferences,
    });

    const productPriorityOptimization = config.optimizationRulesEnabled
      ? this.products.optimizePriorities({
          productPerformanceScore,
          underperformingSummary: underperformingProductsSummary,
        })
      : "optimization-disabled";

    const pricingOptimizationRecommendation = config.optimizationRulesEnabled
      ? this.optimization.optimizePricingRecommendations({
          productPerformanceScore,
          hasPricing: ctx.hasPricing,
          bottleneckSummary,
        })
      : "optimization-disabled";

    const optimizationRecommendation = config.recommendationRulesEnabled
      ? this.recommendations.generate({
          productPerformanceScore,
          bottleneckSummary,
          underperformingSummary: underperformingProductsSummary,
          pricingRecommendation: pricingOptimizationRecommendation,
          productPriorityOptimization,
        })
      : "recommendations-disabled";

    const expectedRevenueImprovement = this.optimization.expectedImprovement({
      productPerformanceScore,
      bottleneckSummary,
    });

    const record = this.store.create({
      companyReference: ctx.companyReference,
      productReference: ctx.productReference,
      pricingReference: ctx.pricingReference,
      growthPlanReference: ctx.growthPlanReference,
      monitoringReference: ctx.monitoringReference,
      revenueSummary,
      productPerformanceScore,
      customerPurchaseSummary,
      bottleneckSummary,
      underperformingProductsSummary,
      productPriorityOptimization,
      pricingOptimizationRecommendation,
      optimizationRecommendation,
      expectedRevenueImprovement,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validateRevenueRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendFroLog({
      event: "revenue_analysis",
      level: "info",
      details: `First revenue optimized · id=${record.revenueOptimizationId} · score=${record.productPerformanceScore}`,
    });
    appendFroLog({
      event: "product_performance_analysis",
      level: "info",
      details: record.underperformingProductsSummary,
    });
    appendFroLog({
      event: "optimization_generation",
      level: "info",
      details: record.productPriorityOptimization,
    });
    appendFroLog({
      event: "recommendation_generation",
      level: "info",
      details: record.optimizationRecommendation,
    });

    return this.metadataGenerator.buildRunReport({
      action: "optimize_first_revenue",
      engineRecord: engine,
      revenueRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(revenueOptimizationId?: string): RevenueOptimizationRecord {
    if (revenueOptimizationId) {
      const found = this.store.get(revenueOptimizationId);
      if (!found) throw new Error(`Revenue optimization record not found: ${revenueOptimizationId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No revenue optimization records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueOptimizationRecord {
    try {
      return this.requireRecord(input.revenueOptimizationId);
    } catch {
      const created = this.optimizeFirstRevenue(
        {
          companyReference: input.companyReference,
          productReference: input.productReference,
          pricingReference: input.pricingReference,
          growthPlanReference: input.growthPlanReference,
          monitoringReference: input.monitoringReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.revenueRecords[0]!;
    }
  }

  private actionPass(
    action: RevenueRunReport["action"],
    transform: (
      record: RevenueOptimizationRecord,
      ctx: ReturnType<FirstRevenueOptimizerManager["resolveContext"]>,
      config: FirstRevenueOptimizerConfiguration,
    ) => RevenueOptimizationRecord,
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
    event: string,
  ): RevenueRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx, config);
    record.modifiedProductionPricingWithoutValidation = false;
    record.structuralSignalOnly = true;
    record.fabricatedRevenueFacts = false;
    this.store.persist(record);

    appendFroLog({
      event,
      level: "info",
      details: `${action} · id=${record.revenueOptimizationId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      revenueRecords: [record],
      validation: this.validator.validateRevenueRecord(record),
      durationMs: Date.now() - started,
    });
  }

  monitorFirstSales(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    return this.actionPass(
      "monitor_first_sales",
      (r, ctx) => ({
        ...r,
        revenueSummary: this.analysis.monitorFirstSales({
          industry: ctx.industry,
          hasMonitoring: ctx.hasMonitoring,
          salesSummary: ctx.salesSummary,
        }),
      }),
      input,
      config,
      "revenue_analysis",
    );
  }

  analyzeEarlyRevenue(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    if (!config.revenueAnalysisRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "analyze_early_revenue",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Revenue analysis rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "analyze_early_revenue",
      (r, ctx) => ({
        ...r,
        revenueSummary: this.analysis.analyzeEarlyRevenue({
          industry: ctx.industry,
          growthScore: ctx.growthScore,
          operationalHealthScore: ctx.operationalHealthScore,
          hasMonitoring: ctx.hasMonitoring,
        }),
      }),
      input,
      config,
      "revenue_analysis",
    );
  }

  analyzeProductPerformance(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    if (!config.productEvaluationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "analyze_product_performance",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Product evaluation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "analyze_product_performance",
      (r, ctx) => {
        const score = this.products.score({
          portfolioProfitabilityScore: ctx.portfolioProfitabilityScore,
          portfolioDemandScore: ctx.portfolioDemandScore,
          hasPortfolio: ctx.hasPortfolio,
          evaluationEnabled: true,
        });
        return {
          ...r,
          productPerformanceScore: score,
          underperformingProductsSummary: this.products.detectUnderperforming({
            productPerformanceScore: score,
            productReferences: ctx.productReferences,
          }),
        };
      },
      input,
      config,
      "product_performance_analysis",
    );
  }

  analyzeCustomerPurchasing(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    return this.actionPass(
      "analyze_customer_purchasing",
      (r, ctx) => ({
        ...r,
        customerPurchaseSummary: this.customers.analyze({
          industry: ctx.industry,
          hasMonitoring: ctx.hasMonitoring,
          customerActivitySummary: ctx.customerActivitySummary,
          growthScore: ctx.growthScore,
        }),
      }),
      input,
      config,
      "revenue_analysis",
    );
  }

  detectRevenueBottlenecks(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    return this.actionPass(
      "detect_revenue_bottlenecks",
      (r, ctx) => ({
        ...r,
        bottleneckSummary: this.analysis.detectBottlenecks({
          productPerformanceScore: r.productPerformanceScore,
          operationalHealthScore: ctx.operationalHealthScore,
          hasPricing: ctx.hasPricing,
        }),
      }),
      input,
      config,
      "revenue_analysis",
    );
  }

  detectUnderperformingProducts(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    return this.actionPass(
      "detect_underperforming_products",
      (r, ctx) => ({
        ...r,
        underperformingProductsSummary: this.products.detectUnderperforming({
          productPerformanceScore: r.productPerformanceScore,
          productReferences: ctx.productReferences,
        }),
      }),
      input,
      config,
      "product_performance_analysis",
    );
  }

  optimizeProductPriorities(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    if (!config.optimizationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "optimize_product_priorities",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Optimization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "optimize_product_priorities",
      (r) => ({
        ...r,
        productPriorityOptimization: this.products.optimizePriorities({
          productPerformanceScore: r.productPerformanceScore,
          underperformingSummary: r.underperformingProductsSummary,
        }),
      }),
      input,
      config,
      "optimization_generation",
    );
  }

  optimizePricingRecommendations(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    if (!config.optimizationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "optimize_pricing_recommendations",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Optimization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "optimize_pricing_recommendations",
      (r, ctx) => ({
        ...r,
        pricingOptimizationRecommendation: this.optimization.optimizePricingRecommendations({
          productPerformanceScore: r.productPerformanceScore,
          hasPricing: ctx.hasPricing,
          bottleneckSummary: r.bottleneckSummary,
        }),
        expectedRevenueImprovement: this.optimization.expectedImprovement({
          productPerformanceScore: r.productPerformanceScore,
          bottleneckSummary: r.bottleneckSummary,
        }),
      }),
      input,
      config,
      "optimization_generation",
    );
  }

  generateEarlyRevenueRecommendations(
    input: RevenueActionInput,
    config: FirstRevenueOptimizerConfiguration,
  ): RevenueRunReport {
    if (!config.recommendationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_early_revenue_recommendations",
        engineRecord: engine,
        revenueRecords: [],
        validation: {
          validationReportId: `fro-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recommendation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: FRO_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_early_revenue_recommendations",
      (r) => ({
        ...r,
        optimizationRecommendation: this.recommendations.generate({
          productPerformanceScore: r.productPerformanceScore,
          bottleneckSummary: r.bottleneckSummary,
          underperformingSummary: r.underperformingProductsSummary,
          pricingRecommendation: r.pricingOptimizationRecommendation,
          productPriorityOptimization: r.productPriorityOptimization,
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }
}
