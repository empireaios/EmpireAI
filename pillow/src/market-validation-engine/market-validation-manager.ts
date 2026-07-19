/** X1-03 — Market Validation Manager. */

import type { CompanyFactoryFrameworkEngine } from "../company-factory-framework/engine.js";
import type { BusinessOpportunityDiscovery } from "../business-opportunity-discovery/engine.js";
import {
  MARKET_VALIDATION_ENGINE_ID,
  MVE_METADATA_VERSION,
} from "./paths.js";
import { appendMveLog } from "./mve-logging.js";
import { OpportunityValidationEngine } from "./opportunity-validation-engine.js";
import { MarketDemandAnalyzer } from "./market-demand-analyzer.js";
import { CustomerValidationEngine } from "./customer-validation-engine.js";
import { CompetitiveValidationEngine } from "./competitive-validation-engine.js";
import { ValidationScoringEngine } from "./validation-scoring-engine.js";
import { ValidationValidator } from "./validation-validator.js";
import { ValidationMetadataGenerator } from "./validation-metadata-generator.js";
import type { MarketValidationEngineConfiguration } from "./configuration.js";
import type {
  ConnectMarketValidationEngineInput,
  MarketValidationActionInput,
  MarketValidationEngineRecord,
  MarketValidationRecord,
  MarketValidationRunReport,
  ValidateOpportunityInput,
} from "./types.js";

export type MarketValidationEngineDependencies = {
  companyFactoryFramework: CompanyFactoryFrameworkEngine | null;
  businessOpportunityDiscovery: BusinessOpportunityDiscovery | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class MarketValidationManager {
  private engineRecord: MarketValidationEngineRecord | null = null;
  private readonly opportunityValidation = new OpportunityValidationEngine();
  private readonly demandAnalyzer = new MarketDemandAnalyzer();
  private readonly customerValidation = new CustomerValidationEngine();
  private readonly competitiveValidation = new CompetitiveValidationEngine();
  private readonly scoring = new ValidationScoringEngine();
  private readonly validator = new ValidationValidator();
  private readonly metadataGenerator = new ValidationMetadataGenerator();

  constructor(private readonly deps: MarketValidationEngineDependencies) {}

  getEngineRecord(): MarketValidationEngineRecord | null {
    return this.engineRecord;
  }

  getValidationRecords(): MarketValidationRecord[] {
    return this.opportunityValidation.list();
  }

  averageValidationConfidence(): number {
    return this.opportunityValidation.averageConfidence();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): MarketValidationEngineRecord["dependencyPresence"] {
    return {
      companyFactoryFramework: this.deps.companyFactoryFramework
        ? this.probe(() => this.deps.companyFactoryFramework!.getState())
        : false,
      businessOpportunityDiscovery: this.deps.businessOpportunityDiscovery
        ? this.probe(() => this.deps.businessOpportunityDiscovery!.getState())
        : false,
    };
  }

  private requireConnected(): MarketValidationEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Market Validation Engine not connected — call connectMarketValidationEngine first",
      );
    }
    return this.engineRecord;
  }

  private structuralHealthScore(): number {
    const frameworkScore = safe(() => {
      const state = this.deps.companyFactoryFramework?.getState();
      const score = state?.health?.healthScore;
      return typeof score === "number" ? score : 60;
    }, 60);

    const discoveryScore = safe(() => {
      const state = this.deps.businessOpportunityDiscovery?.getState();
      const score = state?.health?.healthScore;
      return typeof score === "number" ? score : 60;
    }, 60);

    return Math.round((frameworkScore + discoveryScore) / 2);
  }

  private resolveOpportunityReference(input: {
    opportunityReference?: string;
    industry?: string;
  }): { opportunityReference: string; industry: string } {
    const industry = input.industry?.trim() || "general-structural";

    if (input.opportunityReference?.trim()) {
      return {
        opportunityReference: input.opportunityReference.trim(),
        industry,
      };
    }

    const fromDiscovery = safe(() => {
      const records = this.deps.businessOpportunityDiscovery?.getOpportunityRecords() ?? [];
      if (records.length === 0) return null;
      const latest = records[records.length - 1]!;
      return {
        opportunityReference: latest.opportunityId,
        industry: latest.industry || industry,
      };
    }, null);

    if (fromDiscovery) return fromDiscovery;

    return {
      opportunityReference: `structural://opportunity/${industry}`,
      industry,
    };
  }

  registerWithFramework(
    config: MarketValidationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: MarketValidationRunReport["validation"] } {
    if (!this.deps.companyFactoryFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.companyFactoryFramework.registerCompanyModule({
      definition: {
        companyModuleIdentifier: MARKET_VALIDATION_ENGINE_ID,
        moduleVersion: MVE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X1-03",
        authenticationMethod: "none",
        credentialRef: "vault://market-validation-engine",
        apiEndpointConfig: {
          baseUrl: "internal://market-validation-engine",
          protocol: "rest",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "market.validated",
            "market.demand_analyzed",
            "market.recommendation",
            "market.validation_failed",
          ],
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
      this.deps.companyFactoryFramework.activateCompanyModule(MARKET_VALIDATION_ENGINE_ID);
    }

    appendMveLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Market Validation Engine with Company Factory Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `mve-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: MVE_METADATA_VERSION,
      },
    };
  }

  connectMarketValidationEngine(
    _input: ConnectMarketValidationEngineInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
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

    appendMveLog({
      event: "engine_connect",
      level: "info",
      details: `Market Validation Engine connected · framework=${deps.companyFactoryFramework} · discovery=${deps.businessOpportunityDiscovery}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      validationRecords: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  validateOpportunity(
    input: ValidateOpportunityInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    const validation = this.validator.validateOpportunityInput(input, config);
    if (validation.decision === "fail") {
      return this.metadataGenerator.buildRunReport({
        action: "validate_opportunity",
        engineRecord: engine,
        validationRecords: [],
        validation,
        durationMs: Date.now() - started,
      });
    }

    const resolved = this.resolveOpportunityReference(input);
    const health = this.structuralHealthScore();
    let record = this.opportunityValidation.create({
      opportunityReference: resolved.opportunityReference,
      industry: resolved.industry,
      marketDemandScore: config.minMarketDemandScore,
      competitionScore: config.minCompetitionScore,
      profitabilityScore: config.minProfitabilityScore,
      marketSizeScore: 50,
      customerInterestScore: 50,
      validationConfidence: config.minValidationConfidence,
      investmentRecommendation: "investigate",
      identifiedRisks: ["structural_only"],
    });
    record = this.scoring.score(record, health, config);
    record.structuralSignalOnly = true;
    record.fabricatedValidationResults = false;
    this.opportunityValidation.persist(record);

    appendMveLog({
      event: "validation_execution",
      level: "info",
      details: `Validated structural opportunity · id=${record.validationId} · confidence=${record.validationConfidence}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "validate_opportunity",
      engineRecord: engine,
      validationRecords: [record],
      validation: this.validator.validateValidationRecord(record),
      durationMs: Date.now() - started,
    });
  }

  private requireRecord(validationId?: string): MarketValidationRecord {
    if (validationId) {
      const found = this.opportunityValidation.get(validationId);
      if (!found) throw new Error(`Validation record not found: ${validationId}`);
      return found;
    }
    const all = this.opportunityValidation.list();
    if (all.length === 0) throw new Error("No validation records available");
    return all[all.length - 1]!;
  }

  private ensureRecord(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRecord {
    try {
      return this.requireRecord(input.validationId);
    } catch {
      const created = this.validateOpportunity(
        {
          opportunityReference: input.opportunityReference,
          industry: input.industry,
          validated: true,
        },
        config,
      );
      return created.validationRecords[0]!;
    }
  }

  private actionPass(
    action: MarketValidationRunReport["action"],
    transform: (record: MarketValidationRecord, health: number) => MarketValidationRecord,
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
    event: string,
  ): MarketValidationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();

    let record = this.ensureRecord(input, config);
    const health = this.structuralHealthScore();
    record = transform(record, health);
    record.structuralSignalOnly = true;
    record.fabricatedValidationResults = false;
    this.opportunityValidation.persist(record);

    appendMveLog({
      event,
      level: "info",
      details: `${action} · id=${record.validationId}`,
    });

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord: engine,
      validationRecords: [record],
      validation: this.validator.validateValidationRecord(record),
      durationMs: Date.now() - started,
    });
  }

  validateMarketDemand(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "validate_market_demand",
      (r, h) =>
        this.demandAnalyzer.analyzeDemand(
          r,
          Math.max(config.minMarketDemandScore, Math.round(h * 0.8)),
        ),
      input,
      config,
      "market_analysis",
    );
  }

  validateCustomerInterest(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "validate_customer_interest",
      (r, h) =>
        this.customerValidation.validateCustomerInterest(r, Math.max(45, Math.round(h * 0.78))),
      input,
      config,
      "customer_validation",
    );
  }

  validateCompetitiveLandscape(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "validate_competitive_landscape",
      (r, h) =>
        this.competitiveValidation.validateCompetitiveLandscape(
          r,
          Math.max(config.minCompetitionScore, Math.round(h * 0.7)),
        ),
      input,
      config,
      "market_analysis",
    );
  }

  validateMarketSize(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "validate_market_size",
      (r, h) => this.demandAnalyzer.analyzeMarketSize(r, Math.max(40, Math.round(h * 0.75))),
      input,
      config,
      "market_analysis",
    );
  }

  validateProfitabilityPotential(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "validate_profitability_potential",
      (r, h) => ({
        ...r,
        profitabilityScore: Math.max(config.minProfitabilityScore, Math.round(h * 0.82)),
        structuralSignalOnly: true as const,
        fabricatedValidationResults: false as const,
        timestamp: new Date().toISOString(),
      }),
      input,
      config,
      "market_analysis",
    );
  }

  calculateValidationConfidence(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    if (!config.marketScoringRulesEnabled) {
      const engine = this.requireConnected();
      return this.metadataGenerator.buildRunReport({
        action: "calculate_validation_confidence",
        engineRecord: engine,
        validationRecords: [],
        validation: {
          validationReportId: `mve-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Market scoring rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: MVE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    return this.actionPass(
      "calculate_validation_confidence",
      (r) => this.scoring.calculateConfidence(r, config.minValidationConfidence),
      input,
      config,
      "market_analysis",
    );
  }

  identifyMarketRisks(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    return this.actionPass(
      "identify_market_risks",
      (r) => ({
        ...r,
        identifiedRisks: this.scoring.identifyRisks({
          marketDemandScore: r.marketDemandScore,
          competitionScore: r.competitionScore,
          profitabilityScore: r.profitabilityScore,
          marketSizeScore: r.marketSizeScore,
          validationConfidence: r.validationConfidence,
        }),
        structuralSignalOnly: true as const,
        fabricatedValidationResults: false as const,
        timestamp: new Date().toISOString(),
      }),
      input,
      config,
      "market_analysis",
    );
  }

  generateInvestmentRecommendation(
    input: MarketValidationActionInput,
    config: MarketValidationEngineConfiguration,
  ): MarketValidationRunReport {
    const started = Date.now();
    const engine = this.requireConnected();
    if (!config.investmentRecommendationRulesEnabled) {
      return this.metadataGenerator.buildRunReport({
        action: "generate_investment_recommendation",
        engineRecord: engine,
        validationRecords: [],
        validation: {
          validationReportId: `mve-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "fail",
          errors: ["Investment recommendation rules disabled"],
          warnings: [],
          durationMs: 0,
          metadataVersion: MVE_METADATA_VERSION,
        },
        durationMs: 0,
      });
    }

    let record = this.ensureRecord(input, config);
    record = this.scoring.calculateConfidence(record, config.minValidationConfidence);
    record = {
      ...record,
      investmentRecommendation: this.scoring.recommend(record.validationConfidence, config),
      structuralSignalOnly: true,
      fabricatedValidationResults: false,
      timestamp: new Date().toISOString(),
    };
    this.opportunityValidation.persist(record);

    appendMveLog({
      event: "recommendation_generation",
      level: "info",
      details: `Investment recommendation · id=${record.validationId} · rec=${record.investmentRecommendation}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_investment_recommendation",
      engineRecord: engine,
      validationRecords: [record],
      validation: this.validator.validateValidationRecord(record),
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.opportunityValidation.resetForTesting();
  }
}
