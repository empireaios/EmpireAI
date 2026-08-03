/** X1-12 — Growth Initialization Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { ProductPortfolioBuilder } from "../product-portfolio-builder/engine.js";
import type { PricingStrategyEngine } from "../pricing-strategy-engine/engine.js";
import type { BusinessLaunchOrchestrator } from "../business-launch-orchestrator/engine.js";
import { GIE_METADATA_VERSION, GROWTH_INITIALIZATION_ENGINE_ID } from "./paths.js";
import { appendGieLog } from "./gie-logging.js";
import { GrowthRecordStore } from "./growth-record-store.js";
import { GrowthStrategyEngine } from "./growth-strategy-engine.js";
import { SalesPlanningEngine } from "./sales-planning-engine.js";
import { CustomerAcquisitionPlanner } from "./customer-acquisition-planner.js";
import { GrowthAnalyticsEngine } from "./growth-analytics-engine.js";
import { GrowthRecommendationEngine } from "./growth-recommendation-engine.js";
import { GrowthValidator } from "./growth-validator.js";
import { GrowthMetadataGenerator } from "./growth-metadata-generator.js";
import type { GrowthInitializationEngineConfiguration } from "./configuration.js";
import type {
  ConnectGrowthInitializationEngineInput,
  GrowthActionInput,
  GrowthEngineRecord,
  GrowthPlanRecord,
  GrowthRunReport,
  InitializeGrowthPlanInput,
} from "./types.js";

export type GrowthInitializationEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  productPortfolioBuilder: ProductPortfolioBuilder | null;
  pricingStrategyEngine: PricingStrategyEngine | null;
  businessLaunchOrchestrator: BusinessLaunchOrchestrator | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class GrowthInitializationManager {
  private engineRecord: GrowthEngineRecord | null = null;
  private readonly store = new GrowthRecordStore();
  private readonly strategy = new GrowthStrategyEngine();
  private readonly sales = new SalesPlanningEngine();
  private readonly acquisition = new CustomerAcquisitionPlanner();
  private readonly analytics = new GrowthAnalyticsEngine();
  private readonly recommendations = new GrowthRecommendationEngine();
  private readonly validator = new GrowthValidator();
  private readonly metadataGenerator = new GrowthMetadataGenerator();

  constructor(private readonly deps: GrowthInitializationEngineDependencies) {}

  getEngineRecord(): GrowthEngineRecord | null {
    return this.engineRecord;
  }

  getGrowthRecords(): GrowthPlanRecord[] {
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

  private dependencyPresence(): GrowthEngineRecord["dependencyPresence"] {
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
      businessLaunchOrchestrator: this.deps.businessLaunchOrchestrator
        ? this.probe(() => this.deps.businessLaunchOrchestrator!.getState())
        : false,
    };
  }

  private requireConnected(): GrowthEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Growth Initialization Engine not connected — call connectGrowthInitializationEngine first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: InitializeGrowthPlanInput | GrowthActionInput): {
    companyReference: string;
    launchReference: string;
    portfolioReference: string;
    pricingReference: string;
    industry: string;
    hasLaunch: boolean;
    hasPortfolio: boolean;
    hasPricing: boolean;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const launch = safe(() => {
      const records = this.deps.businessLaunchOrchestrator?.getLaunchRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const portfolio = safe(() => {
      const records = this.deps.productPortfolioBuilder?.getPortfolioRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const pricing = safe(() => {
      const records = this.deps.pricingStrategyEngine?.getPricingRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);

    const launchReference =
      input.launchReference?.trim() ||
      launch?.launchId ||
      `structural://launch/${industry}`;
    const portfolioReference =
      input.portfolioReference?.trim() ||
      portfolio?.portfolioId ||
      `structural://portfolio/${industry}`;
    const pricingReference =
      input.pricingReference?.trim() ||
      pricing?.pricingRecordId ||
      `structural://pricing/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      launch?.companyReference ||
      portfolio?.companyReference ||
      `structural://company/${industry}`;

    return {
      companyReference,
      launchReference,
      portfolioReference,
      pricingReference,
      industry,
      hasLaunch: Boolean(launch) || Boolean(input.launchReference),
      hasPortfolio: Boolean(portfolio) || Boolean(input.portfolioReference),
      hasPricing: Boolean(pricing) || Boolean(input.pricingReference),
    };
  }

  registerWithFramework(
    config: GrowthInitializationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: GrowthRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: GROWTH_INITIALIZATION_ENGINE_ID,
        moduleVersion: GIE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-12",
        authenticationMethod: "none",
        credentialRef: "vault://growth-initialization-engine",
        apiEndpointConfig: {
          baseUrl: "internal://growth-initialization-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["growth.initialized", "growth.recommended", "growth.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(GROWTH_INITIALIZATION_ENGINE_ID);
    }

    appendGieLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Growth Initialization Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `gie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GIE_METADATA_VERSION,
      },
    };
  }

  connectGrowthInitializationEngine(
    _input: ConnectGrowthInitializationEngineInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
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

    appendGieLog({
      event: "engine_connect",
      level: "info",
      details: `Growth Initialization Engine connected · deps=${Object.values(deps).filter(Boolean).length}/4`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      growthRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  initializeGrowthPlan(
    input: InitializeGrowthPlanInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateInitializeInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "initialize_growth_plan",
        engineRecord: engine,
        growthRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxPlansPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "initialize_growth_plan",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [`Max growth plans per cycle reached (${config.maxPlansPerCycle})`],
          warnings: [],
          durationMs: 0,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.launchReference}|${ctx.portfolioReference}|${ctx.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "initialize_growth_plan",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate growth plan initialization detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const growthScore = this.analytics.computeGrowthScore({
      hasLaunch: ctx.hasLaunch,
      hasPortfolio: ctx.hasPortfolio,
      hasPricing: ctx.hasPricing,
      planningEnabled: config.growthPlanningRulesEnabled,
    });

    const growthObjectives = config.growthPlanningRulesEnabled
      ? this.strategy.generateObjectives({
          industry: ctx.industry,
          hasLaunch: ctx.hasLaunch,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
        })
      : "planning-disabled";

    const revenueMilestones = config.revenueMilestoneRulesEnabled
      ? this.sales.generateRevenueMilestones({
          industry: ctx.industry,
          growthScore,
        })
      : "milestones-disabled";

    const customerAcquisitionPlan = this.acquisition.plan({
      industry: ctx.industry,
      hasPortfolio: ctx.hasPortfolio,
      hasPricing: ctx.hasPricing,
    });

    const launchMarketingRecommendations = config.recommendationRulesEnabled
      ? this.acquisition.launchMarketingRecommendations(ctx.industry)
      : "recommendations-disabled";

    const salesTargets = this.sales.generateSalesTargets({
      industry: ctx.industry,
      growthScore,
    });

    const operationalPriorities = this.strategy.generateOperationalPriorities(ctx.industry);
    const performanceBaselines = this.analytics.performanceBaselines(growthScore);
    const earlyPerformanceSummary = this.analytics.trackEarlyPerformance({
      growthScore,
      milestones: revenueMilestones,
      acquisitionPlan: customerAcquisitionPlan,
    });
    const immediateOptimizations = config.recommendationRulesEnabled
      ? this.recommendations.recommendImmediateOptimizations({
          growthScore,
          hasLaunch: ctx.hasLaunch,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
        })
      : "recommendations-disabled";

    const record = this.store.create({
      companyReference: ctx.companyReference,
      launchReference: ctx.launchReference,
      portfolioReference: ctx.portfolioReference,
      pricingReference: ctx.pricingReference,
      growthObjectives,
      revenueMilestones,
      customerAcquisitionPlan,
      launchMarketingRecommendations,
      salesTargets,
      operationalPriorities,
      performanceBaselines,
      earlyPerformanceSummary,
      immediateOptimizations,
      growthScore,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validateGrowthRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    this.store.persist(record);

    appendGieLog({
      event: "growth_plan_generation",
      level: "info",
      details: `Growth plan initialized · id=${record.growthPlanId} · score=${record.growthScore}`,
    });
    appendGieLog({
      event: "revenue_milestone_generation",
      level: "info",
      details: record.revenueMilestones,
    });
    appendGieLog({
      event: "customer_acquisition_planning",
      level: "info",
      details: record.customerAcquisitionPlan,
    });
    appendGieLog({
      event: "recommendation_generation",
      level: "info",
      details: record.immediateOptimizations,
    });

    return this.metadataGenerator.buildRunReport({
      action: "initialize_growth_plan",
      engineRecord: engine,
      growthRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(growthPlanId?: string): GrowthPlanRecord {
    if (growthPlanId) {
      const found = this.store.get(growthPlanId);
      if (!found) throw new Error(`Growth plan record not found: ${growthPlanId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No growth plan records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthPlanRecord {
    try {
      return this.requireRecord(input.growthPlanId);
    } catch {
      const created = this.initializeGrowthPlan(
        {
          companyReference: input.companyReference,
          launchReference: input.launchReference,
          portfolioReference: input.portfolioReference,
          pricingReference: input.pricingReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.growthRecords[0]!;
    }
  }

  private actionPass(
    action: GrowthRunReport["action"],
    transform: (
      record: GrowthPlanRecord,
      ctx: ReturnType<GrowthInitializationManager["resolveContext"]>,
      config: GrowthInitializationEngineConfiguration,
    ) => GrowthPlanRecord,
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
    event: string,
  ): GrowthRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx, config);
    record.modifiedOperationalConfigWithoutValidation = false;
    record.structuralSignalOnly = true;
    record.fabricatedGrowthFacts = false;
    this.store.persist(record);

    appendGieLog({
      event,
      level: "info",
      details: `${action} · id=${record.growthPlanId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      growthRecords: [record],
      validation: this.validator.validateGrowthRecord(record),
      durationMs: Date.now() - started,
    });
  }

  generateGrowthStrategy(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    if (!config.growthPlanningRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_growth_strategy",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Growth planning rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_growth_strategy",
      (r, ctx) => ({
        ...r,
        growthObjectives: this.strategy.generateObjectives({
          industry: ctx.industry,
          hasLaunch: ctx.hasLaunch,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
        }),
        growthScore: this.analytics.computeGrowthScore({
          hasLaunch: ctx.hasLaunch,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
          planningEnabled: true,
        }),
      }),
      input,
      config,
      "growth_plan_generation",
    );
  }

  generateLaunchMarketingRecommendations(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    if (!config.recommendationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_launch_marketing_recommendations",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recommendation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_launch_marketing_recommendations",
      (r, ctx) => ({
        ...r,
        launchMarketingRecommendations: this.acquisition.launchMarketingRecommendations(
          ctx.industry,
        ),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }

  generateSalesTargets(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    return this.actionPass(
      "generate_sales_targets",
      (r, ctx) => ({
        ...r,
        salesTargets: this.sales.generateSalesTargets({
          industry: ctx.industry,
          growthScore: r.growthScore,
        }),
      }),
      input,
      config,
      "growth_plan_generation",
    );
  }

  generateOperationalPriorities(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    return this.actionPass(
      "generate_operational_priorities",
      (r, ctx) => ({
        ...r,
        operationalPriorities: this.strategy.generateOperationalPriorities(ctx.industry),
      }),
      input,
      config,
      "growth_plan_generation",
    );
  }

  generateRevenueMilestones(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    if (!config.revenueMilestoneRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "generate_revenue_milestones",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Revenue milestone rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "generate_revenue_milestones",
      (r, ctx) => ({
        ...r,
        revenueMilestones: this.sales.generateRevenueMilestones({
          industry: ctx.industry,
          growthScore: r.growthScore,
        }),
      }),
      input,
      config,
      "revenue_milestone_generation",
    );
  }

  generateCustomerAcquisitionPlan(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    return this.actionPass(
      "generate_customer_acquisition_plan",
      (r, ctx) => ({
        ...r,
        customerAcquisitionPlan: this.acquisition.plan({
          industry: ctx.industry,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
        }),
      }),
      input,
      config,
      "customer_acquisition_planning",
    );
  }

  generatePerformanceBaselines(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    return this.actionPass(
      "generate_performance_baselines",
      (r) => ({
        ...r,
        performanceBaselines: this.analytics.performanceBaselines(r.growthScore),
      }),
      input,
      config,
      "growth_plan_generation",
    );
  }

  trackEarlyPerformance(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    return this.actionPass(
      "track_early_performance",
      (r) => ({
        ...r,
        earlyPerformanceSummary: this.analytics.trackEarlyPerformance({
          growthScore: r.growthScore,
          milestones: r.revenueMilestones,
          acquisitionPlan: r.customerAcquisitionPlan,
        }),
      }),
      input,
      config,
      "growth_plan_generation",
    );
  }

  recommendImmediateOptimizations(
    input: GrowthActionInput,
    config: GrowthInitializationEngineConfiguration,
  ): GrowthRunReport {
    if (!config.recommendationRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "recommend_immediate_optimizations",
        engineRecord: engine,
        growthRecords: [],
        validation: {
          validationReportId: `gie-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Recommendation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: GIE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "recommend_immediate_optimizations",
      (r, ctx) => ({
        ...r,
        immediateOptimizations: this.recommendations.recommendImmediateOptimizations({
          growthScore: r.growthScore,
          hasLaunch: ctx.hasLaunch,
          hasPortfolio: ctx.hasPortfolio,
          hasPricing: ctx.hasPricing,
        }),
      }),
      input,
      config,
      "recommendation_generation",
    );
  }
}
