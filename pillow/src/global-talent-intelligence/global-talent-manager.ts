/** X4-13 — Global Talent Intelligence Manager. */

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
import {
  GLOBAL_TALENT_INTELLIGENCE_ID,
  TAL_CAPABILITIES,
  TAL_METADATA_VERSION,
} from "./paths.js";
import type { GlobalTalentIntelligenceConfiguration } from "./configuration.js";
import { appendTalLog } from "./tal-logging.js";
import { GlobalWorkforceRegistry } from "./global-workforce-registry.js";
import { RegionalTalentEngine } from "./regional-talent-engine.js";
import { WorkforceCapabilityEngine } from "./workforce-capability-engine.js";
import { WorkforceAnalyticsEngine } from "./workforce-analytics-engine.js";
import { WorkforceRecommendationEngine } from "./workforce-recommendation-engine.js";
import { WorkforceMetadataGenerator } from "./workforce-metadata-generator.js";
import { WorkforceValidator } from "./workforce-validator.js";
import type {
  ConnectGlobalTalentIntelligenceInput,
  GlobalTalentIntelligenceEngineRecord,
  RunTalDiagnosticsInput,
  TalRunReport,
  WorkforceAnalysisInput,
  WorkforceIntelligenceRecord,
  WorkforceRecommendation,
  WorkforceValidationReport,
} from "./types.js";

export type GlobalTalentIntelligenceDependencies = {
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
};

export class GlobalTalentManager {
  private engineRecord: GlobalTalentIntelligenceEngineRecord | null = null;
  private workforceRecords: WorkforceIntelligenceRecord[] = [];
  private recommendations: WorkforceRecommendation[] = [];

  private readonly workforceRegistry = new GlobalWorkforceRegistry();
  private readonly regionalTalentEngine = new RegionalTalentEngine();
  private readonly capabilityEngine = new WorkforceCapabilityEngine();
  private readonly analyticsEngine = new WorkforceAnalyticsEngine();
  private readonly recommendationEngine = new WorkforceRecommendationEngine();
  private readonly metadataGenerator = new WorkforceMetadataGenerator();
  private readonly validator = new WorkforceValidator();

  constructor(private readonly deps: GlobalTalentIntelligenceDependencies = {}) {}

  getEngineRecord(): GlobalTalentIntelligenceEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getWorkforceRecords(): WorkforceIntelligenceRecord[] {
    return this.workforceRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): WorkforceRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  shortageCount(): number {
    return this.analyticsEngine.shortageCount(this.workforceRecords);
  }

  opportunityCount(): number {
    return this.analyticsEngine.opportunityCount(this.workforceRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.workforceRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): GlobalTalentIntelligenceEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): GlobalTalentIntelligenceEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Global Talent Intelligence not connected — call connectGlobalTalentIntelligence first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: WorkforceIntelligenceRecord): void {
    const key = `${record.region}::${record.workforceCategory}`;
    const idx = this.workforceRecords.findIndex(
      (r) => `${r.region}::${r.workforceCategory}` === key,
    );
    if (idx >= 0) this.workforceRecords[idx] = record;
    else this.workforceRecords.push(record);
  }

  failReport(
    action: TalRunReport["action"],
    errors: string[],
    durationMs: number,
  ): TalRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "tal-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_TALENT_INTELLIGENCE_ID,
        engineVersion: "PILLOW-TAL-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...TAL_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: TAL_METADATA_VERSION,
      } satisfies GlobalTalentIntelligenceEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `tal-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: TAL_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: GlobalTalentIntelligenceConfiguration): {
    frameworkModuleId: string | null;
    validation: WorkforceValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: GLOBAL_TALENT_INTELLIGENCE_ID,
        moduleVersion: TAL_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-13",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "workforce.availability",
            "workforce.regional_talent",
            "workforce.capability",
            "workforce.performance",
            "workforce.cost",
            "workforce.utilization",
            "workforce.shortage",
            "workforce.opportunity",
            "workforce.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(GLOBAL_TALENT_INTELLIGENCE_ID);
    }

    appendTalLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Global Talent Intelligence with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `tal-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: TAL_METADATA_VERSION,
      },
    };
  }

  connectGlobalTalentIntelligence(
    _input: ConnectGlobalTalentIntelligenceInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `tal-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GLOBAL_TALENT_INTELLIGENCE_ID,
      engineVersion: "PILLOW-TAL-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...TAL_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: TAL_METADATA_VERSION,
    };

    appendTalLog({
      event: "workforce_monitoring",
      level: "info",
      details:
        "Global Talent Intelligence connected — structural signals only; never make workforce decisions using unvalidated intelligence",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural workforce signals only — no live HR APIs; never make workforce decisions using unvalidated intelligence",
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
    action: TalRunReport["action"],
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
    producer: () => WorkforceIntelligenceRecord,
  ): TalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.unvalidatedDecisionClaim !== "none" ||
        !record.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence
      ) {
        return this.failReport(
          action,
          ["Never make workforce decisions using unvalidated intelligence"],
          Date.now() - started,
        );
      }
      if (record.decisionStatus === "validated_ready" && input.validated !== true) {
        return this.failReport(
          action,
          ["Workforce decisions require validated=true"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendTalLog({
        event: action,
        level: "info",
        details: `${record.region}/${record.workforceCategory} decision=${record.decisionStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        workforceRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendTalLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  monitorGlobalWorkforceAvailability(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_global_workforce_availability", input, config, () =>
      this.workforceRegistry.monitorGlobalWorkforceAvailability(input, config),
    );
  }

  monitorRegionalTalentMarkets(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_regional_talent_markets", input, config, () =>
      this.regionalTalentEngine.monitorRegionalTalentMarkets(input, config),
    );
  }

  monitorWorkforceCapabilities(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_workforce_capabilities", input, config, () =>
      this.capabilityEngine.monitorWorkforceCapabilities(input, config),
    );
  }

  monitorWorkforcePerformance(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_workforce_performance", input, config, () =>
      this.capabilityEngine.monitorWorkforcePerformance(input, config),
    );
  }

  monitorWorkforceCosts(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_workforce_costs", input, config, () =>
      this.analyticsEngine.monitorWorkforceCosts(input, config),
    );
  }

  monitorWorkforceUtilization(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("monitor_workforce_utilization", input, config, () =>
      this.analyticsEngine.monitorWorkforceUtilization(input, config),
    );
  }

  detectWorkforceShortages(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("detect_workforce_shortages", input, config, () =>
      this.analyticsEngine.detectWorkforceShortages(input, config),
    );
  }

  detectWorkforceOpportunities(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    return this.runValidated("detect_workforce_opportunities", input, config, () =>
      this.analyticsEngine.detectWorkforceOpportunities(input, config),
    );
  }

  recommendWorkforce(
    input: WorkforceAnalysisInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_workforce", validation.errors, Date.now() - started);
      }

      if (this.workforceRecords.length === 0) {
        const seed = this.workforceRegistry.monitorGlobalWorkforceAvailability(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.workforceRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverMakeWorkforceDecisionsUsingUnvalidatedIntelligence === true &&
          r.unvalidatedDecisionClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_workforce",
          ["No validated workforce intelligence records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendTalLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} workforce recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_workforce",
        engineRecord,
        workforceRecords: this.workforceRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendTalLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_workforce", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunTalDiagnosticsInput,
    config: GlobalTalentIntelligenceConfiguration,
  ): TalRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `tal-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_TALENT_INTELLIGENCE_ID,
        engineVersion: "PILLOW-TAL-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...TAL_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: TAL_METADATA_VERSION,
      } satisfies GlobalTalentIntelligenceEngineRecord);

    appendTalLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.workforceRecords.length} · shortages=${this.shortageCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      workforceRecords: this.workforceRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
