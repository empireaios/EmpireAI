/** X4-02 — Country Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import {
  CIE_CAPABILITIES,
  CIE_METADATA_VERSION,
  COUNTRY_INTELLIGENCE_ENGINE_ID,
} from "./paths.js";
import type { CountryIntelligenceEngineConfiguration } from "./configuration.js";
import { appendCieLog } from "./cie-logging.js";
import { CountryEvaluationEngine } from "./country-evaluation-engine.js";
import { EconomicIntelligenceEngine } from "./economic-intelligence-engine.js";
import { MarketAnalysisEngine } from "./market-analysis-engine.js";
import { CommerceReadinessEngine } from "./commerce-readiness-engine.js";
import { CountryRankingEngine } from "./country-ranking-engine.js";
import { CountryRecommendationEngine } from "./country-recommendation-engine.js";
import { CountryMetadataGenerator } from "./country-metadata-generator.js";
import { CountryValidator } from "./country-validator.js";
import { compositeScore } from "./structural-signals.js";
import type {
  CieRunReport,
  ConnectCountryIntelligenceEngineInput,
  CountryAnalysisInput,
  CountryIntelligenceEngineRecord,
  CountryIntelligenceRecord,
  CountryRecommendation,
  CountryValidationReport,
  RunCieDiagnosticsInput,
} from "./types.js";

export type CountryIntelligenceEngineDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
};

export class CountryIntelligenceManager {
  private engineRecord: CountryIntelligenceEngineRecord | null = null;
  private countryRecords: CountryIntelligenceRecord[] = [];
  private recommendations: CountryRecommendation[] = [];

  private readonly evaluationEngine = new CountryEvaluationEngine();
  private readonly economicEngine = new EconomicIntelligenceEngine();
  private readonly marketEngine = new MarketAnalysisEngine();
  private readonly readinessEngine = new CommerceReadinessEngine();
  private readonly rankingEngine = new CountryRankingEngine();
  private readonly recommendationEngine = new CountryRecommendationEngine();
  private readonly metadataGenerator = new CountryMetadataGenerator();
  private readonly validator = new CountryValidator();

  constructor(private readonly deps: CountryIntelligenceEngineDependencies = {}) {}

  getEngineRecord(): CountryIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getCountryRecords(): CountryIntelligenceRecord[] {
    return this.countryRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): CountryRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  highPriorityCount(): number {
    return this.countryRecords.filter(
      (r) => r.expansionPriority === "critical" || r.expansionPriority === "high",
    ).length;
  }

  averageCompositeScore(): number {
    if (this.countryRecords.length === 0) return 0;
    const sum = this.countryRecords.reduce((acc, r) => acc + compositeScore(r), 0);
    return Math.round(sum / this.countryRecords.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.countryRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): CountryIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
    };
  }

  private requireConnected(): CountryIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Country Intelligence Engine not connected — call connectCountryIntelligenceEngine first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: CountryIntelligenceRecord): void {
    const idx = this.countryRecords.findIndex((r) => r.country === record.country);
    if (idx >= 0) this.countryRecords[idx] = record;
    else this.countryRecords.push(record);
  }

  failReport(
    action: CieRunReport["action"],
    errors: string[],
    durationMs: number,
  ): CieRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "cie-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: COUNTRY_INTELLIGENCE_ENGINE_ID,
        engineVersion: "PILLOW-CIE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...CIE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CIE_METADATA_VERSION,
      } satisfies CountryIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `cie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: CIE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: CountryIntelligenceEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: CountryValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: COUNTRY_INTELLIGENCE_ENGINE_ID,
        moduleVersion: CIE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-02",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "country.evaluated",
            "country.economic.monitored",
            "country.market.analyzed",
            "country.readiness.assessed",
            "country.ranked",
            "country.recommended",
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
        COUNTRY_INTELLIGENCE_ENGINE_ID,
      );
    }

    appendCieLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Country Intelligence Engine with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `cie-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: CIE_METADATA_VERSION,
      },
    };
  }

  connectCountryIntelligenceEngine(
    _input: ConnectCountryIntelligenceEngineInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();

    this.engineRecord = {
      engineRecordId: `cie-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: COUNTRY_INTELLIGENCE_ENGINE_ID,
      engineVersion: "PILLOW-CIE-001",
      currentOperationalState: "connected",
      healthStatus: presence.globalExpansionFramework ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...CIE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: CIE_METADATA_VERSION,
    };

    appendCieLog({
      event: "engine_connected",
      level: "info",
      details:
        "Country Intelligence Engine connected — structural signals only; never recommend unvalidated country data",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural country signals only — no live external economic APIs",
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
            : !presence.globalExpansionFramework
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  private runValidated(
    action: CieRunReport["action"],
    label: string,
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
    producer: () => CountryIntelligenceRecord,
  ): CieRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEvaluation(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendCieLog({
        event: action,
        level: "info",
        details: `${record.country} composite=${compositeScore(record)} priority=${record.expansionPriority}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        countryRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCieLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  evaluateCountry(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    return this.runValidated(
      "evaluate_country",
      "Country evaluation",
      input,
      config,
      () => this.evaluationEngine.evaluate(input, config),
    );
  }

  monitorEconomicIndicators(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    return this.runValidated(
      "monitor_economic_indicators",
      "Economic indicator monitoring",
      input,
      config,
      () => this.economicEngine.monitor(input, config),
    );
  }

  analyzeMarket(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    return this.runValidated(
      "analyze_market",
      "Market analysis",
      input,
      config,
      () => this.marketEngine.analyze(input, config),
    );
  }

  assessCommerceReadiness(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    return this.runValidated(
      "assess_commerce_readiness",
      "Commerce readiness assessment",
      input,
      config,
      () => this.readinessEngine.assess(input, config),
    );
  }

  rankCountries(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (!config.rankingRulesEnabled) {
        return this.failReport("rank_countries", ["Ranking rules disabled"], Date.now() - started);
      }
      const validation = this.validator.validateEvaluation("Country ranking", input, config);
      if (validation.decision === "fail") {
        return this.failReport("rank_countries", validation.errors, Date.now() - started);
      }

      if (this.countryRecords.length === 0) {
        const seed = this.evaluationEngine.evaluate(input, config);
        this.storeRecord(seed);
      }

      const ranked = this.rankingEngine.rank(this.countryRecords);
      this.countryRecords = ranked;
      engineRecord.currentOperationalState = "active";

      appendCieLog({
        event: "country_ranking",
        level: "info",
        details: `Ranked ${ranked.length} countries by expansion priority/score`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "rank_countries",
        engineRecord,
        countryRecords: ranked,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCieLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("rank_countries", [message], Date.now() - started);
    }
  }

  recommendCountries(
    input: CountryAnalysisInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEvaluation(
        "Country recommendations",
        input,
        config,
      );
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_countries", validation.errors, Date.now() - started);
      }

      if (this.countryRecords.length === 0) {
        const seed = this.evaluationEngine.evaluate(input, config);
        this.storeRecord(seed);
      }

      // Never recommend using unvalidated country data.
      const eligible = this.countryRecords.filter(
        (r) => r.validationStatus === "passed" || r.validationStatus === "partial",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_countries",
          ["Never recommend using unvalidated country data"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible);
      engineRecord.currentOperationalState = "active";

      appendCieLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} country recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_countries",
        engineRecord,
        countryRecords: this.countryRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendCieLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_countries", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunCieDiagnosticsInput,
    config: CountryIntelligenceEngineConfiguration,
  ): CieRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `cie-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: COUNTRY_INTELLIGENCE_ENGINE_ID,
        engineVersion: "PILLOW-CIE-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...CIE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: CIE_METADATA_VERSION,
      } satisfies CountryIntelligenceEngineRecord);

    appendCieLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · countries=${this.countryRecords.length} · highPriority=${this.highPriorityCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      countryRecords: this.countryRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
