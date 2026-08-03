/** X2-19 — Enterprise Value Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import type { ExecutivePortfolioDashboard } from "../executive-portfolio-dashboard/engine.js";
import type { BusinessHealthRanking } from "../business-health-ranking/engine.js";
import type { PortfolioForecastEngine } from "../portfolio-forecast-engine/engine.js";
import type { AcquisitionEvaluationEngine } from "../acquisition-evaluation-engine/engine.js";
import type { PortfolioOptimizationEngine } from "../portfolio-optimization-engine/engine.js";
import type { PortfolioExpansionPlanner } from "../portfolio-expansion-planner/engine.js";
import {
  ENTERPRISE_VALUE_ENGINE_ID,
  EVE_CAPABILITIES,
  EVE_METADATA_VERSION,
} from "./paths.js";
import { appendEveLog } from "./eve-logging.js";
import { CompanyValuationEngine } from "./company-valuation-engine.js";
import { PortfolioValuationEngine } from "./portfolio-valuation-engine.js";
import { ValueGrowthEngine } from "./value-growth-engine.js";
import { ValuationAnalyticsEngine } from "./valuation-analytics-engine.js";
import { ValuationRecommendationEngine } from "./valuation-recommendation-engine.js";
import { ValuationValidator } from "./valuation-validator.js";
import { ValuationMetadataGenerator } from "./valuation-metadata-generator.js";
import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type {
  CalculateCompanyValuationInput,
  CalculateEnterpriseValueInput,
  CalculatePortfolioValuationInput,
  ConnectEnterpriseValueEngineInput,
  DetectValuationAnomaliesInput,
  EnterpriseValueEngineRecord,
  EstimateIntrinsicValueInput,
  EstimateMarketValueInput,
  GenerateValuationRecommendationsInput,
  MeasureValueGrowthInput,
  RunValuationDiagnosticsInput,
  TrackValuationHistoryInput,
  ValuationHistoryEntry,
  ValuationRecord,
  ValuationRunReport,
} from "./types.js";

export type EnterpriseValueEngineDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
  executivePortfolioDashboard: ExecutivePortfolioDashboard | null;
  businessHealthRanking: BusinessHealthRanking | null;
  portfolioForecastEngine: PortfolioForecastEngine | null;
  acquisitionEvaluationEngine: AcquisitionEvaluationEngine | null;
  portfolioOptimizationEngine: PortfolioOptimizationEngine | null;
  portfolioExpansionPlanner: PortfolioExpansionPlanner | null;
};

export class EnterpriseValueManager {
  private engineRecord: EnterpriseValueEngineRecord | null = null;
  private readonly records = new Map<string, ValuationRecord>();
  private readonly historyRing: ValuationHistoryEntry[] = [];
  private readonly maxHistory = 50;
  private anomalyCount = 0;
  private readonly companyValuation = new CompanyValuationEngine();
  private readonly portfolioValuation = new PortfolioValuationEngine();
  private readonly valueGrowth = new ValueGrowthEngine();
  private readonly analytics = new ValuationAnalyticsEngine();
  private readonly recommendations = new ValuationRecommendationEngine();
  private readonly validator = new ValuationValidator();
  private readonly metadataGenerator = new ValuationMetadataGenerator();

  constructor(private readonly deps: EnterpriseValueEngineDependencies) {}

  getEngineRecord(): EnterpriseValueEngineRecord | null {
    return this.engineRecord;
  }

  getValuationRecords(): ValuationRecord[] {
    return [...this.records.values()];
  }

  getHistory(): ValuationHistoryEntry[] {
    return [...this.historyRing];
  }

  getAnomalyCount(): number {
    return this.anomalyCount;
  }

  highConfidenceCount(config: EnterpriseValueEngineConfiguration): number {
    return this.getValuationRecords().filter(
      (r) => r.confidenceScore >= config.highConfidenceThreshold,
    ).length;
  }

  averageConfidenceScore(): number {
    const list = this.getValuationRecords();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, r) => sum + r.confidenceScore, 0) / list.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.records.clear();
    this.historyRing.length = 0;
    this.anomalyCount = 0;
    this.analytics.resetForTesting();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): EnterpriseValueEngineRecord["dependencyPresence"] {
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
      executivePortfolioDashboard: this.deps.executivePortfolioDashboard
        ? this.probe(() => this.deps.executivePortfolioDashboard!.getState())
        : false,
      businessHealthRanking: this.deps.businessHealthRanking
        ? this.probe(() => this.deps.businessHealthRanking!.getState())
        : false,
      portfolioForecastEngine: this.deps.portfolioForecastEngine
        ? this.probe(() => this.deps.portfolioForecastEngine!.getState())
        : false,
      acquisitionEvaluationEngine: this.deps.acquisitionEvaluationEngine
        ? this.probe(() => this.deps.acquisitionEvaluationEngine!.getState())
        : false,
      portfolioOptimizationEngine: this.deps.portfolioOptimizationEngine
        ? this.probe(() => this.deps.portfolioOptimizationEngine!.getState())
        : false,
      portfolioExpansionPlanner: this.deps.portfolioExpansionPlanner
        ? this.probe(() => this.deps.portfolioExpansionPlanner!.getState())
        : false,
    };
  }

  private requireConnected(): EnterpriseValueEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Enterprise Value Engine not connected — call connectEnterpriseValueEngine first",
      );
    }
    return this.engineRecord;
  }

  private store(record: ValuationRecord): ValuationRecord {
    const key = `${record.portfolioReference}::${record.companyReference ?? "portfolio"}::${record.enterpriseValueId}`;
    this.records.set(key, { ...record });
    return { ...record };
  }

  private pushHistory(entry: ValuationHistoryEntry): ValuationHistoryEntry {
    this.historyRing.push(entry);
    if (this.historyRing.length > this.maxHistory) {
      this.historyRing.splice(0, this.historyRing.length - this.maxHistory);
    }
    return { ...entry };
  }

  private defaultPortfolio(input?: { portfolioReference?: string }): string {
    return input?.portfolioReference?.trim() || "portfolio-enterprise";
  }

  private defaultCompany(input?: { companyReference?: string | null }): string {
    return input?.companyReference?.trim() || "company-default";
  }

  failReport(
    action: ValuationRunReport["action"],
    errors: string[],
    durationMs: number,
  ): ValuationRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "eve-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: ENTERPRISE_VALUE_ENGINE_ID,
        engineVersion: "PILLOW-EVE-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...EVE_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: EVE_METADATA_VERSION,
      } satisfies EnterpriseValueEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `eve-vrpt-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: EVE_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: EnterpriseValueEngineConfiguration): {
    frameworkModuleId: string | null;
    validation: ValuationRunReport["validation"];
  } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: ENTERPRISE_VALUE_ENGINE_ID,
        moduleVersion: EVE_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-19",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "valuation.calculated",
            "valuation.growth_measured",
            "valuation.anomaly_detected",
            "valuation.recommended",
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
        ENTERPRISE_VALUE_ENGINE_ID,
      );
    }

    appendEveLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Enterprise Value Engine with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `eve-vrpt-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: EVE_METADATA_VERSION,
      },
    };
  }

  connectEnterpriseValueEngine(
    _input: ConnectEnterpriseValueEngineInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
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
      engineRecordId: `eve-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: ENTERPRISE_VALUE_ENGINE_ID,
      engineVersion: "PILLOW-EVE-001",
      currentOperationalState: "connected",
      healthStatus: corePresent ? (connectedCount >= 5 ? "healthy" : "degraded") : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...EVE_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: EVE_METADATA_VERSION,
    };

    appendEveLog({
      event: "engine_connected",
      level: "info",
      details: "Enterprise Value Engine connected — estimated values are not guaranteed market prices",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Estimated values are structural signals only — not guaranteed market prices",
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

  calculateEnterpriseValue(
    input: CalculateEnterpriseValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateEnterpriseValue(input, config);
      if (validation.decision === "fail") {
        return this.failReport("calculate_enterprise_value", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = input.companyReference ?? null;
      const methodology = config.valuationMethodology;

      const companyRecord = companyReference
        ? this.companyValuation.calculate({
            portfolioReference,
            companyReference,
            methodology,
            config,
          })
        : null;

      const portfolioRecord = this.portfolioValuation.calculate({
        portfolioReference,
        methodology,
        config,
        companyRecords: companyRecord ? [companyRecord] : this.getValuationRecords(),
      });

      const record = this.store(
        this.portfolioValuation.calculateEnterprise({
          portfolioReference,
          companyReference,
          methodology,
          config,
          portfolioRecord,
          companyRecord,
        }),
      );

      appendEveLog({
        event: "enterprise_value_calculation",
        level: "info",
        details: `Enterprise value ${record.enterpriseValuation} (not guaranteed market price) portfolio=${portfolioReference}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "calculate_enterprise_value",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "calculate_enterprise_value",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  calculateCompanyValuation(
    input: CalculateCompanyValuationInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateCompanyValuation(input, config);
      if (validation.decision === "fail") {
        return this.failReport("calculate_company_valuation", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = this.defaultCompany(input);
      const record = this.store(
        this.companyValuation.calculate({
          portfolioReference,
          companyReference,
          methodology: config.valuationMethodology,
          config,
        }),
      );

      appendEveLog({
        event: "company_valuation",
        level: "info",
        details: `Company valuation ${record.companyValuation} company=${companyReference} (not guaranteed market price)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "calculate_company_valuation",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "calculate_company_valuation",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  calculatePortfolioValuation(
    input: CalculatePortfolioValuationInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validatePortfolioValuation(input, config);
      if (validation.decision === "fail") {
        return this.failReport(
          "calculate_portfolio_valuation",
          validation.errors,
          Date.now() - started,
        );
      }

      const portfolioReference = this.defaultPortfolio(input);
      const record = this.store(
        this.portfolioValuation.calculate({
          portfolioReference,
          methodology: config.valuationMethodology,
          config,
          companyRecords: this.getValuationRecords().filter(
            (r) => r.portfolioReference === portfolioReference && r.companyReference,
          ),
        }),
      );

      appendEveLog({
        event: "portfolio_valuation",
        level: "info",
        details: `Portfolio valuation ${record.portfolioValuation} portfolio=${portfolioReference} (not guaranteed market price)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "calculate_portfolio_valuation",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "calculate_portfolio_valuation",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  estimateIntrinsic(
    input: EstimateIntrinsicValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateIntrinsic(input, config);
      if (validation.decision === "fail") {
        return this.failReport("estimate_intrinsic", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = this.defaultCompany(input);
      const record = this.store(
        this.companyValuation.estimateIntrinsic({
          portfolioReference,
          companyReference,
          config,
        }),
      );

      appendEveLog({
        event: "intrinsic_estimation",
        level: "info",
        details: `Intrinsic estimate ${record.companyValuation} (not guaranteed market price)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "estimate_intrinsic",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "estimate_intrinsic",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  estimateMarket(
    input: EstimateMarketValueInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateMarket(input, config);
      if (validation.decision === "fail") {
        return this.failReport("estimate_market", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = this.defaultCompany(input);
      const record = this.store(
        this.companyValuation.estimateMarket({
          portfolioReference,
          companyReference,
          config,
        }),
      );

      appendEveLog({
        event: "market_estimation",
        level: "info",
        details: `Market estimate ${record.companyValuation} (not guaranteed market price)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "estimate_market",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "estimate_market",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  measureValueGrowth(
    input: MeasureValueGrowthInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateValueGrowth(input, config);
      if (validation.decision === "fail") {
        return this.failReport("measure_value_growth", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = input.companyReference ?? null;
      const existing =
        this.getValuationRecords().find(
          (r) =>
            r.portfolioReference === portfolioReference &&
            r.companyReference === companyReference,
        ) ??
        this.store(
          companyReference
            ? this.companyValuation.calculate({
                portfolioReference,
                companyReference,
                methodology: config.valuationMethodology,
                config,
              })
            : this.portfolioValuation.calculate({
                portfolioReference,
                methodology: config.valuationMethodology,
                config,
              }),
        );

      const history = this.analytics.getHistory({ portfolioReference, companyReference });
      const record = this.store(
        this.valueGrowth.measure({ current: existing, history }),
      );

      appendEveLog({
        event: "value_growth_measurement",
        level: "info",
        details: `Value growth rate ${record.valueGrowthRate}% portfolio=${portfolioReference}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "measure_value_growth",
        engineRecord,
        valuationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "measure_value_growth",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  trackHistory(
    input: TrackValuationHistoryInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateTrackHistory(input, config);
      if (validation.decision === "fail") {
        return this.failReport("track_history", validation.errors, Date.now() - started);
      }

      const portfolioReference = this.defaultPortfolio(input);
      const companyReference = input.companyReference ?? null;
      const scoped = this.getValuationRecords().filter((r) => {
        if (r.portfolioReference !== portfolioReference) return false;
        if (companyReference !== null && r.companyReference !== companyReference) return false;
        return true;
      });

      const historyEntries = scoped.map((record) =>
        this.pushHistory(this.analytics.trackHistory(record)),
      );

      appendEveLog({
        event: "history_tracking",
        level: "info",
        details: `Tracked ${historyEntries.length} valuation history entries (ring buffer max ${this.maxHistory})`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "track_history",
        engineRecord,
        valuationRecords: scoped,
        historyEntries,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "track_history",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  detectAnomalies(
    input: DetectValuationAnomaliesInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateAnomalies(input, config);
      if (validation.decision === "fail") {
        return this.failReport("detect_anomalies", validation.errors, Date.now() - started);
      }

      const portfolioReference = input.portfolioReference;
      const companyReference = input.companyReference;
      const { anomalies, updatedRecords } = this.analytics.detectAnomalies({
        records: this.getValuationRecords(),
        config,
        portfolioReference,
        companyReference,
      });

      const stored = updatedRecords.map((r) => this.store(r));
      this.anomalyCount = anomalies.length;

      appendEveLog({
        event: "anomaly_detection",
        level: anomalies.length ? "warn" : "info",
        details: `Detected ${anomalies.length} valuation anomalies (structural signals only)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "detect_anomalies",
        engineRecord,
        valuationRecords: stored,
        anomalies,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "detect_anomalies",
        [error instanceof Error ? error.message : String(error)],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: GenerateValuationRecommendationsInput,
    config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
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
        records: this.getValuationRecords(),
        config,
        portfolioReference: input.portfolioReference,
        companyReference: input.companyReference,
      });

      appendEveLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${recs.length} valuation recommendations (not guaranteed market prices)`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "generate_recommendations",
        engineRecord,
        valuationRecords: this.getValuationRecords(),
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
    _input: RunValuationDiagnosticsInput,
    _config: EnterpriseValueEngineConfiguration,
  ): ValuationRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const records = this.getValuationRecords();
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        valuationRecords: records,
        historyEntries: this.getHistory(),
        validation: {
          validationReportId: `eve-vrpt-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: records.length ? [] : ["No valuation records yet"],
          durationMs: Date.now() - started,
          metadataVersion: EVE_METADATA_VERSION,
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
