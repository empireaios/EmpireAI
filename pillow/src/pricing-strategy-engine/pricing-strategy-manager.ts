/** X1-09 — Pricing Strategy Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { MarketValidationEngine } from "../market-validation-engine/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { ProductPortfolioBuilder } from "../product-portfolio-builder/engine.js";
import { PRICING_STRATEGY_ENGINE_ID, PSE_METADATA_VERSION } from "./paths.js";
import { appendPseLog } from "./pse-logging.js";
import { PricingRecordStore } from "./pricing-record-store.js";
import { PriceCalculationEngine } from "./price-calculation-engine.js";
import { CompetitorPricingAnalyzer } from "./competitor-pricing-analyzer.js";
import { MarginOptimizationEngine } from "./margin-optimization-engine.js";
import { PricingRecommendationEngine } from "./pricing-recommendation-engine.js";
import { PricingAnalyticsEngine } from "./pricing-analytics-engine.js";
import { PricingValidator } from "./pricing-validator.js";
import { PricingMetadataGenerator } from "./pricing-metadata-generator.js";
import type { PricingStrategyEngineConfiguration } from "./configuration.js";
import type {
  ConnectPricingStrategyEngineInput,
  GeneratePricingStrategyInput,
  PricingActionInput,
  PricingEngineRecord,
  PricingModel,
  PricingRecord,
  PricingRunReport,
} from "./types.js";

export type PricingStrategyEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  marketValidationEngine: MarketValidationEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  productPortfolioBuilder: ProductPortfolioBuilder | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class PricingStrategyManager {
  private engineRecord: PricingEngineRecord | null = null;
  private readonly store = new PricingRecordStore();
  private readonly priceCalc = new PriceCalculationEngine();
  private readonly competitor = new CompetitorPricingAnalyzer();
  private readonly margins = new MarginOptimizationEngine();
  private readonly recommendations = new PricingRecommendationEngine();
  private readonly analytics = new PricingAnalyticsEngine();
  private readonly validator = new PricingValidator();
  private readonly metadataGenerator = new PricingMetadataGenerator();

  constructor(private readonly deps: PricingStrategyEngineDependencies) {}

  getEngineRecord(): PricingEngineRecord | null {
    return this.engineRecord;
  }

  getPricingRecords(): PricingRecord[] {
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

  private dependencyPresence(): PricingEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      marketValidationEngine: this.deps.marketValidationEngine
        ? this.probe(() => this.deps.marketValidationEngine!.getState())
        : false,
      businessModelGenerator: this.deps.businessModelGenerator
        ? this.probe(() => this.deps.businessModelGenerator!.getState())
        : false,
      productPortfolioBuilder: this.deps.productPortfolioBuilder
        ? this.probe(() => this.deps.productPortfolioBuilder!.getState())
        : false,
    };
  }

  private requireConnected(): PricingEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Pricing Strategy Engine not connected — call connectPricingStrategyEngine first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: {
    companyReference?: string;
    productReference?: string;
    pricingModel?: PricingModel;
    industry?: string;
  }): {
    companyReference: string;
    productReference: string;
    pricingModel: PricingModel;
    industry: string;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const portfolio = safe(() => {
      const records = this.deps.productPortfolioBuilder?.getPortfolioRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const model = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      if (records.length === 0) return null;
      return records[records.length - 1]!;
    }, null);

    const firstProduct =
      portfolio?.productReferences
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean)[0] || `structural://product/${industry}-1`;

    const companyReference =
      input.companyReference?.trim() ||
      portfolio?.companyReference ||
      model?.businessModelId ||
      `structural://company/${industry}`;
    const productReference = input.productReference?.trim() || firstProduct;
    const pricingModel = this.priceCalc.selectModel(industry, input.pricingModel);

    return { companyReference, productReference, pricingModel, industry };
  }

  registerWithFramework(
    config: PricingStrategyEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: PricingRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: PRICING_STRATEGY_ENGINE_ID,
        moduleVersion: PSE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-09",
        authenticationMethod: "none",
        credentialRef: "vault://pricing-strategy-engine",
        apiEndpointConfig: {
          baseUrl: "internal://pricing-strategy-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["pricing.generated", "pricing.optimized", "pricing.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(PRICING_STRATEGY_ENGINE_ID);
    }

    appendPseLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Pricing Strategy Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `pse-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: PSE_METADATA_VERSION,
      },
    };
  }

  connectPricingStrategyEngine(
    _input: ConnectPricingStrategyEngineInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
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

    appendPseLog({
      event: "engine_connect",
      level: "info",
      details: `Pricing Strategy Engine connected · cff=${deps.companyFactoryFramework} · mve=${deps.marketValidationEngine} · bmg=${deps.businessModelGenerator} · ppb=${deps.productPortfolioBuilder}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      pricingRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  generatePricingStrategy(
    input: GeneratePricingStrategyInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateGenerateInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "generate_pricing_strategy",
        engineRecord: engine,
        pricingRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxPricingRecordsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_pricing_strategy",
        engineRecord: engine,
        pricingRecords: [],
        validation: {
          validationReportId: `pse-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max pricing records per cycle reached (${config.maxPricingRecordsPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: PSE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const estimatedProfitMargin = config.marginRulesEnabled
      ? this.margins.targetMargin(ctx.industry, ctx.pricingModel)
      : 25;
    const recommendedSellingPrice = config.priceCalculationRulesEnabled
      ? this.priceCalc.calculateSellingPrice(
          ctx.industry,
          ctx.pricingModel,
          estimatedProfitMargin,
        )
      : 39.99;
    const competitiveScore = config.competitorAnalysisRulesEnabled
      ? this.competitor.evaluateCompetitiveScore(ctx.industry, recommendedSellingPrice)
      : 50;
    const willingnessToPayScore = this.analytics.evaluateWillingnessToPay(
      ctx.industry,
      recommendedSellingPrice,
    );
    const unprofitableFlags = this.margins.detectUnprofitable(
      estimatedProfitMargin,
      recommendedSellingPrice,
    );
    const pricingConflictsSummary = this.analytics.detectConflicts({
      sellingPrice: recommendedSellingPrice,
      margin: estimatedProfitMargin,
      competitiveScore,
      willingnessToPayScore,
    });
    const recommendations = this.recommendations.recommend({
      industry: ctx.industry,
      margin: estimatedProfitMargin,
      competitiveScore,
      willingnessToPayScore,
      unprofitableFlags,
      conflicts: pricingConflictsSummary,
    });
    const analyticsSummary = this.analytics.analyze({
      pricingModel: ctx.pricingModel,
      sellingPrice: recommendedSellingPrice,
      margin: estimatedProfitMargin,
      competitiveScore,
      willingnessToPayScore,
    });

    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.productReference}|${ctx.pricingModel}|${recommendedSellingPrice}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_pricing_strategy",
        engineRecord: engine,
        pricingRecords: [],
        validation: {
          validationReportId: `pse-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate pricing strategy detected — generation blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: PSE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.store.create({
      companyReference: ctx.companyReference,
      productReference: ctx.productReference,
      pricingModel: ctx.pricingModel,
      recommendedSellingPrice,
      estimatedProfitMargin,
      competitiveScore,
      willingnessToPayScore,
      pricingConflictsSummary,
      unprofitableFlags,
      recommendations,
      analyticsSummary,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validatePricingRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendPseLog({
      event: "price_calculations",
      level: "info",
      details: `Selling price=${record.recommendedSellingPrice} · model=${record.pricingModel}`,
    });
    appendPseLog({
      event: "margin_calculations",
      level: "info",
      details: `Margin=${record.estimatedProfitMargin}`,
    });
    appendPseLog({
      event: "competitor_pricing_analysis",
      level: "info",
      details: `Competitive score=${record.competitiveScore}`,
    });
    appendPseLog({
      event: "recommendation_generation",
      level: "info",
      details: `Recommendations · ${record.recommendations}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_pricing_strategy",
      engineRecord: engine,
      pricingRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(pricingRecordId?: string): PricingRecord {
    if (pricingRecordId) {
      const found = this.store.get(pricingRecordId);
      if (!found) throw new Error(`Pricing record not found: ${pricingRecordId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No pricing records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRecord {
    try {
      return this.requireRecord(input.pricingRecordId);
    } catch {
      const created = this.generatePricingStrategy(
        {
          companyReference: input.companyReference,
          productReference: input.productReference,
          pricingModel: input.pricingModel,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.pricingRecords[0]!;
    }
  }

  private actionPass(
    action: PricingRunReport["action"],
    transform: (
      record: PricingRecord,
      ctx: ReturnType<PricingStrategyManager["resolveContext"]>,
    ) => PricingRecord,
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
    event: string,
  ): PricingRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx);
    record.automaticPublication = false;
    record.structuralSignalOnly = true;
    record.fabricatedPricingFacts = false;
    this.store.persist(record);

    appendPseLog({
      event,
      level: "info",
      details: `${action} · id=${record.pricingRecordId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      pricingRecords: [record],
      validation: this.validator.validatePricingRecord(record),
      durationMs: Date.now() - started,
    });
  }

  calculateSellingPrice(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    if (!config.priceCalculationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "calculate_selling_price",
        engineRecord: engine,
        pricingRecords: [],
        validation: {
          validationReportId: `pse-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Price calculation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PSE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "calculate_selling_price",
      (r, ctx) => ({
        ...r,
        recommendedSellingPrice: this.priceCalc.calculateSellingPrice(
          ctx.industry,
          r.pricingModel,
          r.estimatedProfitMargin,
        ),
      }),
      input,
      config,
      "price_calculations",
    );
  }

  calculateProfitMargin(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    if (!config.marginRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "calculate_profit_margin",
        engineRecord: engine,
        pricingRecords: [],
        validation: {
          validationReportId: `pse-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Margin rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PSE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "calculate_profit_margin",
      (r, ctx) => ({
        ...r,
        estimatedProfitMargin: this.margins.targetMargin(ctx.industry, r.pricingModel),
        unprofitableFlags: this.margins.detectUnprofitable(
          this.margins.targetMargin(ctx.industry, r.pricingModel),
          r.recommendedSellingPrice,
        ),
      }),
      input,
      config,
      "margin_calculations",
    );
  }

  evaluateCompetitorPricing(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    if (!config.competitorAnalysisRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "evaluate_competitor_pricing",
        engineRecord: engine,
        pricingRecords: [],
        validation: {
          validationReportId: `pse-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Competitor analysis rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: PSE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "evaluate_competitor_pricing",
      (r, ctx) => {
        const competitiveScore = this.competitor.evaluateCompetitiveScore(
          ctx.industry,
          r.recommendedSellingPrice,
        );
        return {
          ...r,
          competitiveScore,
          analyticsSummary: this.competitor.summarize(ctx.industry, competitiveScore),
        };
      },
      input,
      config,
      "competitor_pricing_analysis",
    );
  }

  evaluateWillingnessToPay(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "evaluate_willingness_to_pay",
      (r, ctx) => ({
        ...r,
        willingnessToPayScore: this.analytics.evaluateWillingnessToPay(
          ctx.industry,
          r.recommendedSellingPrice,
        ),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }

  selectPricingModel(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "select_pricing_model",
      (r, ctx) => ({
        ...r,
        pricingModel: this.priceCalc.selectModel(ctx.industry, input.pricingModel),
      }),
      input,
      config,
      "price_calculations",
    );
  }

  detectPricingConflicts(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "detect_pricing_conflicts",
      (r) => ({
        ...r,
        pricingConflictsSummary: this.analytics.detectConflicts({
          sellingPrice: r.recommendedSellingPrice,
          margin: r.estimatedProfitMargin,
          competitiveScore: r.competitiveScore,
          willingnessToPayScore: r.willingnessToPayScore,
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }

  detectUnprofitablePricing(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "detect_unprofitable_pricing",
      (r) => ({
        ...r,
        unprofitableFlags: this.margins.detectUnprofitable(
          r.estimatedProfitMargin,
          r.recommendedSellingPrice,
        ),
      }),
      input,
      config,
      "margin_calculations",
    );
  }

  recommendImprovements(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "recommend_improvements",
      (r, ctx) => ({
        ...r,
        recommendations: this.recommendations.recommend({
          industry: ctx.industry,
          margin: r.estimatedProfitMargin,
          competitiveScore: r.competitiveScore,
          willingnessToPayScore: r.willingnessToPayScore,
          unprofitableFlags: r.unprofitableFlags,
          conflicts: r.pricingConflictsSummary,
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }

  analyzePricing(
    input: PricingActionInput,
    config: PricingStrategyEngineConfiguration,
  ): PricingRunReport {
    return this.actionPass(
      "analyze_pricing",
      (r) => ({
        ...r,
        analyticsSummary: this.analytics.analyze({
          pricingModel: r.pricingModel,
          sellingPrice: r.recommendedSellingPrice,
          margin: r.estimatedProfitMargin,
          competitiveScore: r.competitiveScore,
          willingnessToPayScore: r.willingnessToPayScore,
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }
}
