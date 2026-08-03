/** X4-14 — Global Risk Intelligence Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import type { GlobalTaxIntelligenceEngine } from "../global-tax-intelligence/engine.js";
import type { InternationalLogisticsEngine } from "../international-logistics-engine/engine.js";
import type { GlobalMarketIntelligenceEngine } from "../global-market-intelligence/engine.js";
import type { ExecutiveGlobalDashboardEngine } from "../executive-global-dashboard/engine.js";
import type { GlobalBrandManagementEngine } from "../global-brand-management/engine.js";
import type { InternationalPartnershipEngine } from "../international-partnership-engine/engine.js";
import type { GlobalTalentIntelligenceEngine } from "../global-talent-intelligence/engine.js";
import {
  GLOBAL_RISK_INTELLIGENCE_ID,
  GRI_CAPABILITIES,
  GRI_METADATA_VERSION,
} from "./paths.js";
import type { GlobalRiskIntelligenceConfiguration } from "./configuration.js";
import { appendRgoLog } from "./gri-logging.js";
import { RegionalPerformanceEngine } from "./regional-risk-analysis-engine.js";
import { RegionalRevenueEngine } from "./economic-risk-engine.js";
import { RegionalProfitabilityEngine } from "./regulatory-risk-engine.js";
import { RegionalOpportunityEngine } from "./global-risk-monitoring-engine.js";
import { RegionalOptimizationEngine } from "./risk-prioritization-engine.js";
import { RegionalRecommendationEngine } from "./risk-recommendation-engine.js";
import { RegionalMetadataGenerator } from "./global-risk-metadata-generator.js";
import { RegionalValidator } from "./global-risk-validator.js";
import type {
  ConnectGlobalRiskIntelligenceInput,
  GlobalRiskIntelligenceEngineRecord,
  RegionalGrowthRecommendation,
  RegionalOptimizationInput,
  RegionalOptimizationRecord,
  RegionalValidationReport,
  RgoRunReport,
  RunRgoDiagnosticsInput,
} from "./types.js";

export type GlobalRiskIntelligenceDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
  globalTaxIntelligence?: GlobalTaxIntelligenceEngine | null;
  internationalLogisticsEngine?: InternationalLogisticsEngine | null;
  globalMarketIntelligence?: GlobalMarketIntelligenceEngine | null;
  executiveGlobalDashboard?: ExecutiveGlobalDashboardEngine | null;
  globalBrandManagement?: GlobalBrandManagementEngine | null;
  internationalPartnershipEngine?: InternationalPartnershipEngine | null;
  globalTalentIntelligence?: GlobalTalentIntelligenceEngine | null;
};

export class RegionalGrowthManager {
  private engineRecord: GlobalRiskIntelligenceEngineRecord | null = null;
  private optimizationRecords: RegionalOptimizationRecord[] = [];
  private recommendations: RegionalGrowthRecommendation[] = [];

  private readonly performanceEngine = new RegionalPerformanceEngine();
  private readonly revenueEngine = new RegionalRevenueEngine();
  private readonly profitabilityEngine = new RegionalProfitabilityEngine();
  private readonly opportunityEngine = new RegionalOpportunityEngine();
  private readonly optimizationEngine = new RegionalOptimizationEngine();
  private readonly recommendationEngine = new RegionalRecommendationEngine();
  private readonly metadataGenerator = new RegionalMetadataGenerator();
  private readonly validator = new RegionalValidator();

  constructor(private readonly deps: GlobalRiskIntelligenceDependencies = {}) {}

  getEngineRecord(): GlobalRiskIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getOptimizationRecords(): RegionalOptimizationRecord[] {
    return this.optimizationRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): RegionalGrowthRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  opportunityCount(): number {
    return this.opportunityEngine.opportunityCount(this.optimizationRecords);
  }

  bottleneckCount(): number {
    return this.opportunityEngine.bottleneckCount(this.optimizationRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.optimizationRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): GlobalRiskIntelligenceEngineRecord["dependencyPresence"] {
    return {
      globalExpansionFramework: Boolean(this.deps.globalExpansionFramework),
      countryIntelligenceEngine: Boolean(this.deps.countryIntelligenceEngine),
      localizationEngine: Boolean(this.deps.localizationEngine),
      languageIntelligence: Boolean(this.deps.languageIntelligence),
      currencyIntelligence: Boolean(this.deps.currencyIntelligence),
      regionalComplianceEngine: Boolean(this.deps.regionalComplianceEngine),
      globalTaxIntelligence: Boolean(this.deps.globalTaxIntelligence),
      internationalLogisticsEngine: Boolean(this.deps.internationalLogisticsEngine),
      globalMarketIntelligence: Boolean(this.deps.globalMarketIntelligence),
      executiveGlobalDashboard: Boolean(this.deps.executiveGlobalDashboard),
      globalBrandManagement: Boolean(this.deps.globalBrandManagement),
      internationalPartnershipEngine: Boolean(this.deps.internationalPartnershipEngine),
      globalTalentIntelligence: Boolean(this.deps.globalTalentIntelligence),
    };
  }

  private requireConnected(): GlobalRiskIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Global Risk Intelligence not connected — call connectGlobalRiskIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: RegionalOptimizationRecord): void {
    const key = `${record.region}::${record.optimizationCategory}`;
    const idx = this.optimizationRecords.findIndex(
      (r) => `${r.region}::${r.optimizationCategory}` === key,
    );
    if (idx >= 0) this.optimizationRecords[idx] = record;
    else this.optimizationRecords.push(record);
  }

  failReport(
    action: RgoRunReport["action"],
    errors: string[],
    durationMs: number,
  ): RgoRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "gri-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_RISK_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GRI-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...GRI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GRI_METADATA_VERSION,
      } satisfies GlobalRiskIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `gri-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: GRI_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: GlobalRiskIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: RegionalValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: GLOBAL_RISK_INTELLIGENCE_ID,
        moduleVersion: GRI_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-14",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "regional.performance",
            "regional.revenue",
            "regional.profitability",
            "regional.customer_growth",
            "regional.efficiency",
            "regional.opportunity",
            "regional.bottleneck",
            "regional.priority",
            "regional.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(GLOBAL_RISK_INTELLIGENCE_ID);
    }

    appendRgoLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Global Risk Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `gri-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GRI_METADATA_VERSION,
      },
    };
  }

  connectGlobalRiskIntelligence(
    _input: ConnectGlobalRiskIntelligenceInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `gri-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GLOBAL_RISK_INTELLIGENCE_ID,
      engineVersion: "PILLOW-GRI-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...GRI_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: GRI_METADATA_VERSION,
    };

    appendRgoLog({
      event: "regional_monitoring",
      level: "info",
      details:
        "Global Risk Intelligence connected — structural signals only; never optimize using unvalidated regional intelligence",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural regional signals only — no live market APIs; never optimize using unvalidated regional intelligence",
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
    action: RgoRunReport["action"],
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
    producer: () => RegionalOptimizationRecord,
  ): RgoRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.unvalidatedOptimizationClaim !== "none" ||
        !record.neverOptimizeUsingUnvalidatedRegionalIntelligence
      ) {
        return this.failReport(
          action,
          ["Never optimize using unvalidated regional intelligence"],
          Date.now() - started,
        );
      }
      if (record.optimizationStatus === "validated_ready" && input.validated !== true) {
        return this.failReport(
          action,
          ["Regional optimization requires validated=true"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendRgoLog({
        event: action,
        level: "info",
        details: `${record.region}/${record.optimizationCategory} priority=${record.optimizationPriority}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        optimizationRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRgoLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorRegionalBusinessPerformance(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("monitor_regional_business_performance", input, config, () =>
      this.performanceEngine.monitorRegionalBusinessPerformance(input, config),
    );
  }

  monitorRegionalRevenueGrowth(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("monitor_regional_revenue_growth", input, config, () =>
      this.revenueEngine.monitorRegionalRevenueGrowth(input, config),
    );
  }

  monitorRegionalProfitability(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("monitor_regional_profitability", input, config, () =>
      this.profitabilityEngine.monitorRegionalProfitability(input, config),
    );
  }

  monitorRegionalCustomerGrowth(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("monitor_regional_customer_growth", input, config, () =>
      this.revenueEngine.monitorRegionalCustomerGrowth(input, config),
    );
  }

  monitorRegionalOperationalEfficiency(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("monitor_regional_operational_efficiency", input, config, () =>
      this.performanceEngine.monitorRegionalOperationalEfficiency(input, config),
    );
  }

  detectRegionalGrowthOpportunities(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("detect_regional_growth_opportunities", input, config, () =>
      this.opportunityEngine.detectRegionalGrowthOpportunities(input, config),
    );
  }

  detectRegionalPerformanceBottlenecks(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("detect_regional_performance_bottlenecks", input, config, () =>
      this.opportunityEngine.detectRegionalPerformanceBottlenecks(input, config),
    );
  }

  rankRegionalOptimizationPriorities(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    return this.runValidated("rank_regional_optimization_priorities", input, config, () =>
      this.optimizationEngine.rankRegionalOptimizationPriorities(input, config),
    );
  }

  recommendRegionalGrowth(
    input: RegionalOptimizationInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport(
          "recommend_regional_growth",
          validation.errors,
          Date.now() - started,
        );
      }

      if (this.optimizationRecords.length === 0) {
        const seed = this.performanceEngine.monitorRegionalBusinessPerformance(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.optimizationRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverOptimizeUsingUnvalidatedRegionalIntelligence === true &&
          r.unvalidatedOptimizationClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_regional_growth",
          ["No validated regional optimization records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendRgoLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} regional growth recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_regional_growth",
        engineRecord,
        optimizationRecords: this.optimizationRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendRgoLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_regional_growth", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunRgoDiagnosticsInput,
    config: GlobalRiskIntelligenceConfiguration,
  ): RgoRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `gri-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_RISK_INTELLIGENCE_ID,
        engineVersion: "PILLOW-GRI-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...GRI_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GRI_METADATA_VERSION,
      } satisfies GlobalRiskIntelligenceEngineRecord);

    appendRgoLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.optimizationRecords.length} · bottlenecks=${this.bottleneckCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      optimizationRecords: this.optimizationRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
