/** X4-09 — Global Market Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import type { GlobalTaxIntelligenceEngine } from "../global-tax-intelligence/engine.js";
import type { InternationalLogisticsEngine } from "../international-logistics-engine/engine.js";
import {
  GMI_CAPABILITIES,
  GMI_METADATA_VERSION,
  GLOBAL_MARKET_INTELLIGENCE_ID,
} from "./paths.js";
import type { GlobalMarketIntelligenceConfiguration } from "./configuration.js";
import { appendGmiLog } from "./gmi-logging.js";
import { MarketMonitoringEngine } from "./market-monitoring-engine.js";
import { MarketTrendEngine } from "./market-trend-engine.js";
import { CompetitorIntelligenceEngine } from "./competitor-intelligence-engine.js";
import { OpportunityDiscoveryEngine } from "./opportunity-discovery-engine.js";
import { GlobalOpportunityRankingEngine } from "./global-opportunity-ranking-engine.js";
import { MarketRecommendationEngine } from "./market-recommendation-engine.js";
import { MarketMetadataGenerator } from "./market-metadata-generator.js";
import { MarketValidator } from "./market-validator.js";
import type {
  ConnectGlobalMarketIntelligenceInput,
  GlobalMarketIntelligenceEngineRecord,
  GmiRunReport,
  MarketAnalysisInput,
  MarketIntelligenceRecord,
  MarketRecommendation,
  MarketValidationReport,
  RunGmiDiagnosticsInput,
} from "./types.js";

export type GlobalMarketIntelligenceDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
  globalTaxIntelligence?: GlobalTaxIntelligenceEngine | null;
  internationalLogisticsEngine?: InternationalLogisticsEngine | null;
};

export class GlobalMarketIntelligenceManager {
  private engineRecord: GlobalMarketIntelligenceEngineRecord | null = null;
  private marketRecords: MarketIntelligenceRecord[] = [];
  private recommendations: MarketRecommendation[] = [];

  private readonly monitoringEngine = new MarketMonitoringEngine();
  private readonly trendEngine = new MarketTrendEngine();
  private readonly competitorEngine = new CompetitorIntelligenceEngine();
  private readonly opportunityEngine = new OpportunityDiscoveryEngine();
  private readonly rankingEngine = new GlobalOpportunityRankingEngine();
  private readonly recommendationEngine = new MarketRecommendationEngine();
  private readonly metadataGenerator = new MarketMetadataGenerator();
  private readonly validator = new MarketValidator();

  constructor(private readonly deps: GlobalMarketIntelligenceDependencies = {}) {}

  getEngineRecord(): GlobalMarketIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getMarketRecords(): MarketIntelligenceRecord[] {
    return this.marketRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): MarketRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  emergingCount(): number {
    return this.opportunityEngine.emergingCount(this.marketRecords);
  }

  decliningCount(): number {
    return this.opportunityEngine.decliningCount(this.marketRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.marketRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): GlobalMarketIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
      regionalComplianceEngine: Boolean(this.deps.regionalComplianceEngine),
      globalTaxIntelligence: Boolean(this.deps.globalTaxIntelligence),
      internationalLogisticsEngine: Boolean(this.deps.internationalLogisticsEngine),
    };
  }

  private requireConnected(): GlobalMarketIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Global Market Intelligence not connected — call connectGlobalMarketIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: MarketIntelligenceRecord): void {
    const key = `${record.country}::${record.region}::${record.marketCategory}`;
    const idx = this.marketRecords.findIndex(
      (r) => `${r.country}::${r.region}::${r.marketCategory}` === key,
    );
    if (idx >= 0) this.marketRecords[idx] = record;
    else this.marketRecords.push(record);
  }

  failReport(
    action: GmiRunReport["action"],
    errors: string[],
    durationMs: number,
  ): GmiRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "gmi-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_MARKET_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GMI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...GMI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GMI_METADATA_VERSION,
      } satisfies GlobalMarketIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `gmi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: GMI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: GlobalMarketIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: MarketValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: GLOBAL_MARKET_INTELLIGENCE_ID,
        moduleVersion: GMI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-09",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "market.international",
            "market.trend",
            "market.demand",
            "market.competitor",
            "market.product",
            "market.regional_growth",
            "market.emerging",
            "market.declining",
            "market.ranked",
            "market.recommended",
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
          "global_expansion_module_registration",
          "international_expansion_lifecycle_management",
          "global_expansion_event_routing",
          "regional_data_abstraction",
          "global_expansion_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.globalExpansionFramework.activateExpansionModule(
        GLOBAL_MARKET_INTELLIGENCE_ID,
      );
    }

    appendGmiLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Global Market Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `gmi-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GMI_METADATA_VERSION,
      },
    };
  }

  connectGlobalMarketIntelligence(
    _input: ConnectGlobalMarketIntelligenceInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `gmi-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GLOBAL_MARKET_INTELLIGENCE_ID,
      engineVersion: "PILLOW-GMI-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...GMI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: GMI_METADATA_VERSION,
    };

    appendGmiLog({
      event: "engine_connected",
      level: "info",
      details:
        "Global Market Intelligence connected — structural signals only; never recommend with unvalidated intelligence",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural market signals only — no live market feed APIs; never recommend with unvalidated intelligence",
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
            : !depsReady
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runValidated(
    action: GmiRunReport["action"],
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
    producer: () => MarketIntelligenceRecord,
  ): GmiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.unvalidatedRecommendationClaim !== "none" ||
        !record.neverRecommendWithUnvalidatedIntelligence
      ) {
        return this.failReport(
          action,
          ["Never generate market recommendations using unvalidated intelligence"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendGmiLog({
        event: action,
        level: "info",
        details: `${record.country}/${record.region}/${record.marketCategory} opp=${record.opportunityScore}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        marketRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGmiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorInternationalMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_international_markets", input, config, () =>
      this.monitoringEngine.monitorInternationalMarkets(input, config),
    );
  }

  monitorMarketTrends(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_market_trends", input, config, () =>
      this.trendEngine.monitorMarketTrends(input, config),
    );
  }

  monitorCustomerDemand(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_customer_demand", input, config, () =>
      this.monitoringEngine.monitorCustomerDemand(input, config),
    );
  }

  monitorCompetitorActivity(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_competitor_activity", input, config, () =>
      this.competitorEngine.monitorCompetitorActivity(input, config),
    );
  }

  monitorProductOpportunities(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_product_opportunities", input, config, () =>
      this.monitoringEngine.monitorProductOpportunities(input, config),
    );
  }

  monitorRegionalGrowth(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("monitor_regional_growth", input, config, () =>
      this.monitoringEngine.monitorRegionalGrowth(input, config),
    );
  }

  detectEmergingMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("detect_emerging_markets", input, config, () =>
      this.opportunityEngine.detectEmergingMarkets(input, config),
    );
  }

  detectDecliningMarkets(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("detect_declining_markets", input, config, () =>
      this.opportunityEngine.detectDecliningMarkets(input, config),
    );
  }

  rankGlobalOpportunities(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    return this.runValidated("rank_global_opportunities", input, config, () =>
      this.rankingEngine.rankGlobalOpportunities(input, config, this.marketRecords),
    );
  }

  recommendMarket(
    input: MarketAnalysisInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_market", validation.errors, Date.now() - started);
      }

      if (this.marketRecords.length === 0) {
        const seed = this.monitoringEngine.monitorInternationalMarkets(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.marketRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverRecommendWithUnvalidatedIntelligence === true &&
          r.unvalidatedRecommendationClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_market",
          ["No validated market intelligence records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendGmiLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} market recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_market",
        engineRecord,
        marketRecords: this.marketRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGmiLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_market", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunGmiDiagnosticsInput,
    config: GlobalMarketIntelligenceConfiguration,
  ): GmiRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `gmi-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_MARKET_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GMI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...GMI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GMI_METADATA_VERSION,
      } satisfies GlobalMarketIntelligenceEngineRecord);

    appendGmiLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.marketRecords.length} · emerging=${this.emergingCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      marketRecords: this.marketRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
