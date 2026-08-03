/** X1-08 — Product Portfolio Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessOpportunityDiscovery } from "../business-opportunity-discovery/engine.js";
import type { MarketValidationEngine } from "../market-validation-engine/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { StoreGenerationEngine } from "../store-generation-engine/engine.js";
import { PPB_METADATA_VERSION, PRODUCT_PORTFOLIO_BUILDER_ID } from "./paths.js";
import { appendPpbLog } from "./ppb-logging.js";
import { ProductPortfolioRecordStore } from "./product-portfolio-record-store.js";
import { ProductDiscoveryEngine } from "./product-discovery-engine.js";
import { ProductEvaluationEngine } from "./product-evaluation-engine.js";
import { ProductClassificationEngine } from "./product-classification-engine.js";
import { PortfolioOptimizationEngine } from "./portfolio-optimization-engine.js";
import { PortfolioRecommendationEngine } from "./portfolio-recommendation-engine.js";
import { ProductPortfolioValidator } from "./product-portfolio-validator.js";
import { ProductPortfolioMetadataGenerator } from "./product-portfolio-metadata-generator.js";
import type { ProductPortfolioBuilderConfiguration } from "./configuration.js";
import type {
  BuildPortfolioInput,
  ConnectProductPortfolioBuilderInput,
  PortfolioActionInput,
  ProductPortfolioEngineRecord,
  ProductPortfolioRecord,
  ProductPortfolioRunReport,
} from "./types.js";

export type ProductPortfolioBuilderDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessOpportunityDiscovery: BusinessOpportunityDiscovery | null;
  marketValidationEngine: MarketValidationEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  storeGenerationEngine: StoreGenerationEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class ProductPortfolioManager {
  private engineRecord: ProductPortfolioEngineRecord | null = null;
  private readonly store = new ProductPortfolioRecordStore();
  private readonly discovery = new ProductDiscoveryEngine();
  private readonly evaluation = new ProductEvaluationEngine();
  private readonly classification = new ProductClassificationEngine();
  private readonly optimization = new PortfolioOptimizationEngine();
  private readonly recommendations = new PortfolioRecommendationEngine();
  private readonly validator = new ProductPortfolioValidator();
  private readonly metadataGenerator = new ProductPortfolioMetadataGenerator();

  constructor(private readonly deps: ProductPortfolioBuilderDependencies) {}

  getEngineRecord(): ProductPortfolioEngineRecord | null {
    return this.engineRecord;
  }

  getPortfolioRecords(): ProductPortfolioRecord[] {
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

  private dependencyPresence(): ProductPortfolioEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessOpportunityDiscovery: this.deps.businessOpportunityDiscovery
        ? this.probe(() => this.deps.businessOpportunityDiscovery!.getState())
        : false,
      marketValidationEngine: this.deps.marketValidationEngine
        ? this.probe(() => this.deps.marketValidationEngine!.getState())
        : false,
      businessModelGenerator: this.deps.businessModelGenerator
        ? this.probe(() => this.deps.businessModelGenerator!.getState())
        : false,
      storeGenerationEngine: this.deps.storeGenerationEngine
        ? this.probe(() => this.deps.storeGenerationEngine!.getState())
        : false,
    };
  }

  private requireConnected(): ProductPortfolioEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Product Portfolio Builder not connected — call connectProductPortfolioBuilder first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: {
    companyReference?: string;
    businessModelReference?: string;
    industry?: string;
  }): {
    companyReference: string;
    businessModelReference: string;
    industry: string;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const model = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const storefront = safe(() => {
      const records = this.deps.storeGenerationEngine?.getStorefrontRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const opportunity = safe(() => {
      const records = this.deps.businessOpportunityDiscovery?.getOpportunityRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const businessModelReference =
      input.businessModelReference?.trim() ||
      model?.businessModelId ||
      `structural://business-model/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      storefront?.companyReference ||
      opportunity?.opportunityId ||
      `structural://company/${industry}`;

    return { companyReference, businessModelReference, industry };
  }

  registerWithFramework(
    config: ProductPortfolioBuilderConfiguration,
  ): { frameworkModuleId: string | null; validation: ProductPortfolioRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: PRODUCT_PORTFOLIO_BUILDER_ID,
        moduleVersion: PPB_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-08",
        authenticationMethod: "none",
        credentialRef: "vault://product-portfolio-builder",
        apiEndpointConfig: {
          baseUrl: "internal://product-portfolio-builder",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["portfolio.built", "portfolio.optimized", "portfolio.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(PRODUCT_PORTFOLIO_BUILDER_ID);
    }

    appendPpbLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Product Portfolio Builder with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `ppb-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PPB_METADATA_VERSION,
      },
    };
  }

  connectProductPortfolioBuilder(
    _input: ConnectProductPortfolioBuilderInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
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

    appendPpbLog({
      event: "engine_connect",
      level: "info",
      details: `Product Portfolio Builder connected · cff=${deps.companyFactoryFramework} · bod=${deps.businessOpportunityDiscovery} · mve=${deps.marketValidationEngine} · bmg=${deps.businessModelGenerator} · sge=${deps.storeGenerationEngine}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      portfolioRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  buildPortfolio(
    input: BuildPortfolioInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateBuildInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "build_portfolio",
        engineRecord: engine,
        portfolioRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxPortfoliosPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "build_portfolio",
        engineRecord: engine,
        portfolioRecords: [],
        validation: {
          validationReportId: `ppb-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max portfolios per cycle reached (${config.maxPortfoliosPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: PPB_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    let productReferences = this.discovery.discover(ctx.industry, 5);
    const productCount = productReferences.split("|").filter(Boolean).length;
    let portfolioProfitabilityScore = config.productEvaluationRulesEnabled
      ? this.evaluation.estimateProfitability(ctx.industry, productCount)
      : 50;
    let portfolioDemandScore = config.productEvaluationRulesEnabled
      ? this.evaluation.estimateDemand(ctx.industry, productCount)
      : 50;
    let productCategories = this.classification.categorize(ctx.industry, productReferences);
    let rankingSummary = config.productRankingRulesEnabled
      ? this.classification.rank(
          productReferences,
          portfolioProfitabilityScore,
          portfolioDemandScore,
        )
      : "ranking-disabled";
    let overlappingProductsSummary = this.optimization.detectOverlaps(
      productReferences,
      productCategories,
    );

    if (config.portfolioOptimizationRulesEnabled) {
      const optimized = this.optimization.optimize(
        productReferences,
        portfolioProfitabilityScore,
        portfolioDemandScore,
      );
      productReferences = optimized.productReferences;
      portfolioProfitabilityScore = optimized.portfolioProfitabilityScore;
      portfolioDemandScore = optimized.portfolioDemandScore;
      productCategories = this.classification.categorize(ctx.industry, productReferences);
      rankingSummary = this.classification.rank(
        productReferences,
        portfolioProfitabilityScore,
        portfolioDemandScore,
      );
      overlappingProductsSummary = this.optimization.detectOverlaps(
        productReferences,
        productCategories,
      );
    }

    const recommendations = this.recommendations.recommend({
      industry: ctx.industry,
      profitability: portfolioProfitabilityScore,
      demand: portfolioDemandScore,
      overlapSummary: overlappingProductsSummary,
    });

    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.businessModelReference}|${productReferences}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "build_portfolio",
        engineRecord: engine,
        portfolioRecords: [],
        validation: {
          validationReportId: `ppb-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate product portfolio detected — generation blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PPB_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.store.create({
      companyReference: ctx.companyReference,
      businessModelReference: ctx.businessModelReference,
      productReferences,
      productCategories,
      rankingSummary,
      overlappingProductsSummary,
      recommendations,
      portfolioProfitabilityScore,
      portfolioDemandScore,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validatePortfolioRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendPpbLog({
      event: "portfolio_generation",
      level: "info",
      details: `Created structural portfolio · id=${record.portfolioId}`,
    });
    appendPpbLog({
      event: "product_discovery",
      level: "info",
      details: `Products discovered · ${record.productReferences}`,
    });
    appendPpbLog({
      event: "product_evaluation",
      level: "info",
      details: `Profitability=${record.portfolioProfitabilityScore} · Demand=${record.portfolioDemandScore}`,
    });
    appendPpbLog({
      event: "portfolio_optimization",
      level: "info",
      details: `Overlap · ${record.overlappingProductsSummary}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "build_portfolio",
      engineRecord: engine,
      portfolioRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(portfolioId?: string): ProductPortfolioRecord {
    if (portfolioId) {
      const found = this.store.get(portfolioId);
      if (!found) throw new Error(`Portfolio not found: ${portfolioId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No portfolio records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRecord {
    try {
      return this.requireRecord(input.portfolioId);
    } catch {
      const created = this.buildPortfolio(
        {
          companyReference: input.companyReference,
          businessModelReference: input.businessModelReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.portfolioRecords[0]!;
    }
  }

  private actionPass(
    action: ProductPortfolioRunReport["action"],
    transform: (
      record: ProductPortfolioRecord,
      ctx: ReturnType<ProductPortfolioManager["resolveContext"]>,
    ) => ProductPortfolioRecord,
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
    event: string,
  ): ProductPortfolioRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx);
    record.automaticPublication = false;
    record.structuralSignalOnly = true;
    record.fabricatedPortfolioFacts = false;
    this.store.persist(record);

    appendPpbLog({
      event,
      level: "info",
      details: `${action} · id=${record.portfolioId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      portfolioRecords: [record],
      validation: this.validator.validatePortfolioRecord(record),
      durationMs: Date.now() - started,
    });
  }

  discoverProducts(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "discover_products",
      (r, ctx) => ({
        ...r,
        productReferences: this.discovery.discover(ctx.industry, 5),
      }),
      input,
      config,
      "product_discovery",
    );
  }

  evaluateProducts(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    if (!config.productEvaluationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "evaluate_products",
        engineRecord: engine,
        portfolioRecords: [],
        validation: {
          validationReportId: `ppb-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Product evaluation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PPB_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "evaluate_products",
      (r, ctx) => {
        const count = r.productReferences.split("|").filter(Boolean).length;
        const profitability = this.evaluation.estimateProfitability(ctx.industry, count);
        const demand = this.evaluation.estimateDemand(ctx.industry, count);
        return {
          ...r,
          portfolioProfitabilityScore: profitability,
          portfolioDemandScore: demand,
          rankingSummary: this.evaluation.evaluateOpportunitySummary(
            ctx.industry,
            profitability,
            demand,
          ),
        };
      },
      input,
      config,
      "product_evaluation",
    );
  }

  categorizeProducts(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "categorize_products",
      (r, ctx) => ({
        ...r,
        productCategories: this.classification.categorize(ctx.industry, r.productReferences),
      }),
      input,
      config,
      "portfolio_generation",
    );
  }

  rankProducts(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    if (!config.productRankingRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "rank_products",
        engineRecord: engine,
        portfolioRecords: [],
        validation: {
          validationReportId: `ppb-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Product ranking rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PPB_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "rank_products",
      (r) => ({
        ...r,
        rankingSummary: this.classification.rank(
          r.productReferences,
          r.portfolioProfitabilityScore,
          r.portfolioDemandScore,
        ),
      }),
      input,
      config,
      "portfolio_generation",
    );
  }

  estimateProfitability(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "estimate_profitability",
      (r, ctx) => {
        const count = r.productReferences.split("|").filter(Boolean).length;
        return {
          ...r,
          portfolioProfitabilityScore: this.evaluation.estimateProfitability(ctx.industry, count),
        };
      },
      input,
      config,
      "product_evaluation",
    );
  }

  estimateDemand(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "estimate_demand",
      (r, ctx) => {
        const count = r.productReferences.split("|").filter(Boolean).length;
        return {
          ...r,
          portfolioDemandScore: this.evaluation.estimateDemand(ctx.industry, count),
        };
      },
      input,
      config,
      "product_evaluation",
    );
  }

  detectOverlappingProducts(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "detect_overlapping_products",
      (r) => ({
        ...r,
        overlappingProductsSummary: this.optimization.detectOverlaps(
          r.productReferences,
          r.productCategories,
        ),
      }),
      input,
      config,
      "portfolio_optimization",
    );
  }

  optimizePortfolio(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    if (!config.portfolioOptimizationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "optimize_portfolio",
        engineRecord: engine,
        portfolioRecords: [],
        validation: {
          validationReportId: `ppb-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Portfolio optimization rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PPB_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "optimize_portfolio",
      (r, ctx) => {
        const optimized = this.optimization.optimize(
          r.productReferences,
          r.portfolioProfitabilityScore,
          r.portfolioDemandScore,
        );
        return {
          ...r,
          productReferences: optimized.productReferences,
          portfolioProfitabilityScore: optimized.portfolioProfitabilityScore,
          portfolioDemandScore: optimized.portfolioDemandScore,
          productCategories: this.classification.categorize(
            ctx.industry,
            optimized.productReferences,
          ),
          rankingSummary: this.classification.rank(
            optimized.productReferences,
            optimized.portfolioProfitabilityScore,
            optimized.portfolioDemandScore,
          ),
        };
      },
      input,
      config,
      "portfolio_optimization",
    );
  }

  recommendImprovements(
    input: PortfolioActionInput,
    config: ProductPortfolioBuilderConfiguration,
  ): ProductPortfolioRunReport {
    return this.actionPass(
      "recommend_improvements",
      (r, ctx) => ({
        ...r,
        recommendations: this.recommendations.recommend({
          industry: ctx.industry,
          profitability: r.portfolioProfitabilityScore,
          demand: r.portfolioDemandScore,
          overlapSummary: r.overlappingProductsSummary,
        }),
      }),
      input,
      config,
      "portfolio_generation",
    );
  }
}
