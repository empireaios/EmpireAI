/** X1-10 — Launch Readiness Manager. */

import { createHash } from "node:crypto";
import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessModelGenerator } from "../business-model-generator/engine.js";
import type { BrandCreationEngine } from "../brand-creation-engine/engine.js";
import type { DomainDigitalAssetPlanner } from "../domain-digital-asset-planner/engine.js";
import type { StoreGenerationEngine } from "../store-generation-engine/engine.js";
import type { ProductPortfolioBuilder } from "../product-portfolio-builder/engine.js";
import type { PricingStrategyEngine } from "../pricing-strategy-engine/engine.js";
import { LAUNCH_READINESS_VALIDATOR_ID, LRV_METADATA_VERSION } from "./paths.js";
import { appendLrvLog } from "./lrv-logging.js";
import { LaunchReadinessRecordStore } from "./launch-readiness-record-store.js";
import { BusinessValidationEngine } from "./business-validation-engine.js";
import { StoreReadinessEngine } from "./store-readiness-engine.js";
import { ProductReadinessEngine } from "./product-readiness-engine.js";
import { PricingValidationEngine } from "./pricing-validation-engine.js";
import { LaunchReadinessScoringEngine } from "./launch-readiness-scoring-engine.js";
import { LaunchValidator } from "./launch-validator.js";
import { LaunchMetadataGenerator } from "./launch-metadata-generator.js";
import type { LaunchReadinessValidatorConfiguration } from "./configuration.js";
import type {
  ConnectLaunchReadinessValidatorInput,
  LaunchActionInput,
  LaunchEngineRecord,
  LaunchReadinessRecord,
  LaunchRunReport,
  ValidateLaunchReadinessInput,
} from "./types.js";

export type LaunchReadinessValidatorDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessModelGenerator: BusinessModelGenerator | null;
  brandCreationEngine: BrandCreationEngine | null;
  domainDigitalAssetPlanner: DomainDigitalAssetPlanner | null;
  storeGenerationEngine: StoreGenerationEngine | null;
  productPortfolioBuilder: ProductPortfolioBuilder | null;
  pricingStrategyEngine: PricingStrategyEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class LaunchReadinessManager {
  private engineRecord: LaunchEngineRecord | null = null;
  private readonly store = new LaunchReadinessRecordStore();
  private readonly business = new BusinessValidationEngine();
  private readonly storefront = new StoreReadinessEngine();
  private readonly products = new ProductReadinessEngine();
  private readonly pricing = new PricingValidationEngine();
  private readonly scoring = new LaunchReadinessScoringEngine();
  private readonly validator = new LaunchValidator();
  private readonly metadataGenerator = new LaunchMetadataGenerator();

  constructor(private readonly deps: LaunchReadinessValidatorDependencies) {}

  getEngineRecord(): LaunchEngineRecord | null {
    return this.engineRecord;
  }

  getReadinessRecords(): LaunchReadinessRecord[] {
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

  private dependencyPresence(): LaunchEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessModelGenerator: this.deps.businessModelGenerator
        ? this.probe(() => this.deps.businessModelGenerator!.getState())
        : false,
      brandCreationEngine: this.deps.brandCreationEngine
        ? this.probe(() => this.deps.brandCreationEngine!.getState())
        : false,
      domainDigitalAssetPlanner: this.deps.domainDigitalAssetPlanner
        ? this.probe(() => this.deps.domainDigitalAssetPlanner!.getState())
        : false,
      storeGenerationEngine: this.deps.storeGenerationEngine
        ? this.probe(() => this.deps.storeGenerationEngine!.getState())
        : false,
      productPortfolioBuilder: this.deps.productPortfolioBuilder
        ? this.probe(() => this.deps.productPortfolioBuilder!.getState())
        : false,
      pricingStrategyEngine: this.deps.pricingStrategyEngine
        ? this.probe(() => this.deps.pricingStrategyEngine!.getState())
        : false,
    };
  }

  private requireConnected(): LaunchEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Launch Readiness Validator not connected — call connectLaunchReadinessValidator first",
      );
    }
    return this.engineRecord;
  }

  private resolveContext(input: ValidateLaunchReadinessInput | LaunchActionInput): {
    companyReference: string;
    businessModelReference: string;
    brandReference: string;
    digitalAssetPlanReference: string;
    storefrontReference: string;
    productPortfolioReference: string;
    pricingReference: string;
    industry: string;
    domainScores: ReturnType<LaunchReadinessManager["collectDomainScores"]>;
  } {
    const industry = input.industry?.trim() || "general-structural";

    const model = safe(() => {
      const records = this.deps.businessModelGenerator?.getBusinessModelRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const brand = safe(() => {
      const records = this.deps.brandCreationEngine?.getBrandRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const plan = safe(() => {
      const records = this.deps.domainDigitalAssetPlanner?.getPlanRecords() ?? [];
      return records.length ? records[records.length - 1]! : null;
    }, null);
    const store = safe(() => {
      const records = this.deps.storeGenerationEngine?.getStorefrontRecords() ?? [];
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

    const businessModelReference =
      input.businessModelReference?.trim() ||
      model?.businessModelId ||
      `structural://business-model/${industry}`;
    const brandReference =
      input.brandReference?.trim() || brand?.brandId || `structural://brand/${industry}`;
    const digitalAssetPlanReference =
      input.digitalAssetPlanReference?.trim() ||
      plan?.digitalAssetPlanId ||
      `structural://domain-plan/${industry}`;
    const storefrontReference =
      input.storefrontReference?.trim() ||
      store?.storefrontId ||
      `structural://storefront/${industry}`;
    const productPortfolioReference =
      input.productPortfolioReference?.trim() ||
      portfolio?.portfolioId ||
      `structural://portfolio/${industry}`;
    const pricingReference =
      input.pricingReference?.trim() ||
      pricing?.pricingRecordId ||
      `structural://pricing/${industry}`;
    const companyReference =
      input.companyReference?.trim() ||
      store?.companyReference ||
      portfolio?.companyReference ||
      brand?.companyName ||
      `structural://company/${industry}`;

    const domainScores = this.collectDomainScores({
      model,
      brand,
      plan,
      store,
      portfolio,
      pricing,
    });

    return {
      companyReference,
      businessModelReference,
      brandReference,
      digitalAssetPlanReference,
      storefrontReference,
      productPortfolioReference,
      pricingReference,
      industry,
      domainScores,
    };
  }

  private collectDomainScores(sources: {
    model: { businessModelId: string } | null;
    brand: { brandId: string } | null;
    plan: { digitalAssetPlanId: string } | null;
    store: {
      storefrontId: string;
      deploymentReadiness?: string;
      automaticDeployment?: boolean;
    } | null;
    portfolio: {
      portfolioId: string;
      productReferences?: string;
      portfolioProfitabilityScore?: number;
    } | null;
    pricing: {
      pricingRecordId: string;
      estimatedProfitMargin?: number;
      unprofitableFlags?: string;
      automaticPublication?: boolean;
    } | null;
  }) {
    const productCount =
      sources.portfolio?.productReferences?.split("|").filter(Boolean).length ?? 0;
    return {
      business: this.business.validateBusinessConfiguration(Boolean(sources.model)),
      brand: this.business.validateBrandReadiness(Boolean(sources.brand)),
      digitalAssets: this.business.validateDigitalAssetReadiness(Boolean(sources.plan)),
      storefront: this.storefront.validateStorefrontReadiness({
        hasStorefront: Boolean(sources.store),
        deploymentReadiness: sources.store?.deploymentReadiness,
        automaticDeployment: sources.store?.automaticDeployment,
      }),
      portfolio: this.products.validateProductPortfolioReadiness({
        hasPortfolio: Boolean(sources.portfolio),
        productCount,
        profitability: sources.portfolio?.portfolioProfitabilityScore,
      }),
      pricing: this.pricing.validatePricingReadiness({
        hasPricing: Boolean(sources.pricing),
        margin: sources.pricing?.estimatedProfitMargin,
        unprofitableFlags: sources.pricing?.unprofitableFlags,
        automaticPublication: sources.pricing?.automaticPublication,
      }),
    };
  }

  registerWithFramework(
    config: LaunchReadinessValidatorConfiguration,
  ): { frameworkModuleId: string | null; validation: LaunchRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: LAUNCH_READINESS_VALIDATOR_ID,
        moduleVersion: LRV_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-10",
        authenticationMethod: "none",
        credentialRef: "vault://launch-readiness-validator",
        apiEndpointConfig: {
          baseUrl: "internal://launch-readiness-validator",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["launch.validated", "launch.blocked", "launch.failed"],
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
      this.deps.companyFactoryFramework.activateCompanyModule(LAUNCH_READINESS_VALIDATOR_ID);
    }

    appendLrvLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Launch Readiness Validator with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `lrv-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: LRV_METADATA_VERSION,
      },
    };
  }

  connectLaunchReadinessValidator(
    _input: ConnectLaunchReadinessValidatorInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
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

    appendLrvLog({
      event: "engine_connect",
      level: "info",
      details: `Launch Readiness Validator connected · deps=${Object.values(deps).filter(Boolean).length}/7`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      readinessRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  validateLaunchReadiness(
    input: ValidateLaunchReadinessInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateLaunchInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "validate_launch_readiness",
        engineRecord: engine,
        readinessRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    if (this.store.list().length >= config.maxReadinessRecordsPerCycle) {
      return this.metadataGenerator.buildRunReport({
        action: "validate_launch_readiness",
        engineRecord: engine,
        readinessRecords: [],
        validation: {
          validationReportId: `lrv-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: [
            `Max readiness records per cycle reached (${config.maxReadinessRecordsPerCycle})`,
          ],
          warnings: [],
          durationMs: 0,
          metadataVersion: LRV_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const ctx = this.resolveContext(input);
    const scored = config.readinessScoringRulesEnabled
      ? this.scoring.score(ctx.domainScores)
      : {
          readinessScore: 50,
          readinessBreakdown: "scoring-disabled",
          launchBlockers: "scoring-disabled",
          launchRecommendation: "Enable readiness scoring rules",
        };

    const launchCertified = config.neverCertifyWithoutValidation
      ? this.scoring.certify(
          scored.readinessScore,
          scored.launchBlockers,
          config.launchThreshold,
          input.validated !== false,
        )
      : false;

    const fingerprint = createHash("sha256")
      .update(
        `${ctx.companyReference}|${ctx.businessModelReference}|${ctx.storefrontReference}|${ctx.productPortfolioReference}|${ctx.pricingReference}`.toLowerCase(),
      )
      .digest("hex")
      .slice(0, 16);
    if (this.store.hasFingerprint(fingerprint)) {
      return this.metadataGenerator.buildRunReport({
        action: "validate_launch_readiness",
        engineRecord: engine,
        readinessRecords: [],
        validation: {
          validationReportId: `lrv-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Duplicate launch readiness assessment detected — blocked"],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: LRV_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    }

    const record = this.store.create({
      companyReference: ctx.companyReference,
      businessModelReference: ctx.businessModelReference,
      brandReference: ctx.brandReference,
      digitalAssetPlanReference: ctx.digitalAssetPlanReference,
      storefrontReference: ctx.storefrontReference,
      productPortfolioReference: ctx.productPortfolioReference,
      pricingReference: ctx.pricingReference,
      readinessScore: scored.readinessScore,
      readinessBreakdown: scored.readinessBreakdown,
      launchBlockers: scored.launchBlockers,
      launchRecommendation: scored.launchRecommendation,
      launchCertified,
      validationStatus: "pending",
    });

    const recordValidation = this.validator.validateReadinessRecord(record);
    record.validationStatus =
      recordValidation.decision === "fail"
        ? "failed"
        : recordValidation.decision === "partial"
          ? "partial"
          : "passed";
    if (record.validationStatus === "failed") record.launchCertified = false;
    this.store.persist(record);

    appendLrvLog({
      event: "launch_validation",
      level: "info",
      details: `Launch readiness validated · id=${record.launchReadinessId}`,
    });
    appendLrvLog({
      event: "readiness_scoring",
      level: "info",
      details: `Score=${record.readinessScore} · certified=${record.launchCertified}`,
    });
    appendLrvLog({
      event: "launch_recommendations",
      level: "info",
      details: record.launchRecommendation,
    });

    return this.metadataGenerator.buildRunReport({
      action: "validate_launch_readiness",
      engineRecord: engine,
      readinessRecords: [record],
      validation: recordValidation,
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(launchReadinessId?: string): LaunchReadinessRecord {
    if (launchReadinessId) {
      const found = this.store.get(launchReadinessId);
      if (!found) throw new Error(`Launch readiness record not found: ${launchReadinessId}`);
      return found;
    }
    const all = this.store.list();
    if (all.length === 0) throw new Error("No launch readiness records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchReadinessRecord {
    try {
      return this.requireRecord(input.launchReadinessId);
    } catch {
      const created = this.validateLaunchReadiness(
        {
          companyReference: input.companyReference,
          businessModelReference: input.businessModelReference,
          brandReference: input.brandReference,
          digitalAssetPlanReference: input.digitalAssetPlanReference,
          storefrontReference: input.storefrontReference,
          productPortfolioReference: input.productPortfolioReference,
          pricingReference: input.pricingReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.readinessRecords[0]!;
    }
  }

  private actionPass(
    action: LaunchRunReport["action"],
    transform: (
      record: LaunchReadinessRecord,
      ctx: ReturnType<LaunchReadinessManager["resolveContext"]>,
      config: LaunchReadinessValidatorConfiguration,
    ) => LaunchReadinessRecord,
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
    event: string,
  ): LaunchRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const ctx = this.resolveContext(input);
    let record = this.ensureRecord(input, config);
    record = transform(record, ctx, config);
    record.structuralSignalOnly = true;
    record.fabricatedLaunchFacts = false;
    this.store.persist(record);

    appendLrvLog({
      event,
      level: "info",
      details: `${action} · id=${record.launchReadinessId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      readinessRecords: [record],
      validation: this.validator.validateReadinessRecord(record),
      durationMs: Date.now() - started,
    });
  }

  validateBusinessConfiguration(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_business_configuration",
      (r, ctx) => ({
        ...r,
        businessModelReference: ctx.businessModelReference,
        readinessBreakdown: `business:${ctx.domainScores.business.score}(${ctx.domainScores.business.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  validateBrandReadiness(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_brand_readiness",
      (r, ctx) => ({
        ...r,
        brandReference: ctx.brandReference,
        readinessBreakdown: `brand:${ctx.domainScores.brand.score}(${ctx.domainScores.brand.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  validateDigitalAssetReadiness(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_digital_asset_readiness",
      (r, ctx) => ({
        ...r,
        digitalAssetPlanReference: ctx.digitalAssetPlanReference,
        readinessBreakdown: `digitalAssets:${ctx.domainScores.digitalAssets.score}(${ctx.domainScores.digitalAssets.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  validateStorefrontReadiness(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_storefront_readiness",
      (r, ctx) => ({
        ...r,
        storefrontReference: ctx.storefrontReference,
        readinessBreakdown: `storefront:${ctx.domainScores.storefront.score}(${ctx.domainScores.storefront.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  validateProductPortfolioReadiness(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_product_portfolio_readiness",
      (r, ctx) => ({
        ...r,
        productPortfolioReference: ctx.productPortfolioReference,
        readinessBreakdown: `portfolio:${ctx.domainScores.portfolio.score}(${ctx.domainScores.portfolio.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  validatePricingReadiness(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "validate_pricing_readiness",
      (r, ctx) => ({
        ...r,
        pricingReference: ctx.pricingReference,
        readinessBreakdown: `pricing:${ctx.domainScores.pricing.score}(${ctx.domainScores.pricing.note})`,
      }),
      input,
      config,
      "launch_validation",
    );
  }

  detectLaunchBlockers(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "detect_launch_blockers",
      (r, ctx) => {
        const scored = this.scoring.score(ctx.domainScores);
        return { ...r, launchBlockers: scored.launchBlockers };
      },
      input,
      config,
      "launch_validation",
    );
  }

  calculateReadinessScore(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    if (!config.readinessScoringRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "calculate_readiness_score",
        engineRecord: engine,
        readinessRecords: [],
        validation: {
          validationReportId: `lrv-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Readiness scoring rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: LRV_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }
    return this.actionPass(
      "calculate_readiness_score",
      (r, ctx, cfg) => {
        const scored = this.scoring.score(ctx.domainScores);
        const launchCertified = this.scoring.certify(
          scored.readinessScore,
          scored.launchBlockers,
          cfg.launchThreshold,
          true,
        );
        return {
          ...r,
          readinessScore: scored.readinessScore,
          readinessBreakdown: scored.readinessBreakdown,
          launchBlockers: scored.launchBlockers,
          launchRecommendation: scored.launchRecommendation,
          launchCertified,
        };
      },
      input,
      config,
      "readiness_scoring",
    );
  }

  generateLaunchRecommendations(
    input: LaunchActionInput,
    config: LaunchReadinessValidatorConfiguration,
  ): LaunchRunReport {
    return this.actionPass(
      "generate_launch_recommendations",
      (r, ctx) => {
        const scored = this.scoring.score(ctx.domainScores);
        return { ...r, launchRecommendation: scored.launchRecommendation };
      },
      input,
      config,
      "launch_recommendations",
    );
  }
}
