/** X4-11 — Global Brand Manager. */

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
import {
  GBM_CAPABILITIES,
  GBM_METADATA_VERSION,
  GLOBAL_BRAND_MANAGEMENT_ID,
} from "./paths.js";
import type { GlobalBrandManagementConfiguration } from "./configuration.js";
import { appendGbmLog } from "./gbm-logging.js";
import { BrandGovernanceEngine } from "./brand-governance-engine.js";
import { BrandConsistencyEngine } from "./brand-consistency-engine.js";
import { RegionalBrandAdaptationEngine } from "./regional-brand-adaptation-engine.js";
import { BrandReputationEngine } from "./brand-reputation-engine.js";
import { BrandRecommendationEngine } from "./brand-recommendation-engine.js";
import { BrandMetadataGenerator } from "./brand-metadata-generator.js";
import { BrandValidator } from "./brand-validator.js";
import type {
  BrandAnalysisInput,
  BrandGovernanceRecord,
  BrandRecommendation,
  BrandValidationReport,
  ConnectGlobalBrandManagementInput,
  GbmRunReport,
  GlobalBrandManagementEngineRecord,
  RunGbmDiagnosticsInput,
} from "./types.js";

export type GlobalBrandManagementDependencies = {
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
};

export class GlobalBrandManager {
  private engineRecord: GlobalBrandManagementEngineRecord | null = null;
  private brandRecords: BrandGovernanceRecord[] = [];
  private recommendations: BrandRecommendation[] = [];

  private readonly governanceEngine = new BrandGovernanceEngine();
  private readonly consistencyEngine = new BrandConsistencyEngine();
  private readonly adaptationEngine = new RegionalBrandAdaptationEngine();
  private readonly reputationEngine = new BrandReputationEngine();
  private readonly recommendationEngine = new BrandRecommendationEngine();
  private readonly metadataGenerator = new BrandMetadataGenerator();
  private readonly validator = new BrandValidator();

  constructor(private readonly deps: GlobalBrandManagementDependencies = {}) {}

  getEngineRecord(): GlobalBrandManagementEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getBrandRecords(): BrandGovernanceRecord[] {
    return this.brandRecords.map((r) => ({ ...r }));
  }

  getRecommendations(): BrandRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  inconsistencyCount(): number {
    return this.consistencyEngine.inconsistencyCount(this.brandRecords);
  }

  reputationRiskCount(): number {
    return this.reputationEngine.reputationRiskCount(this.brandRecords);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.brandRecords = [];
    this.recommendations = [];
  }

  private dependencyPresence(): GlobalBrandManagementEngineRecord["dependencyPresence"] {
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
    };
  }

  private requireConnected(): GlobalBrandManagementEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Global Brand Management not connected — call connectGlobalBrandManagement first",
      );
    }
    return this.engineRecord;
  }

  private storeRecord(record: BrandGovernanceRecord): void {
    const key = `${record.brandReference}::${record.region}::${record.brandCategory}`;
    const idx = this.brandRecords.findIndex(
      (r) => `${r.brandReference}::${r.region}::${r.brandCategory}` === key,
    );
    if (idx >= 0) this.brandRecords[idx] = record;
    else this.brandRecords.push(record);
  }

  failReport(
    action: GbmRunReport["action"],
    errors: string[],
    durationMs: number,
  ): GbmRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "gbm-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_BRAND_MANAGEMENT_ID,
        engineVersion: "PILLOW-GBM-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...GBM_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GBM_METADATA_VERSION,
      } satisfies GlobalBrandManagementEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `gbm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: GBM_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: GlobalBrandManagementConfiguration): {
    frameworkModuleId: string | null;
    validation: BrandValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: GLOBAL_BRAND_MANAGEMENT_ID,
        moduleVersion: GBM_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-11",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "brand.identity",
            "brand.adaptation",
            "brand.consistency",
            "brand.performance",
            "brand.reputation",
            "brand.compliance",
            "brand.inconsistency",
            "brand.reputation_risk",
            "brand.recommended",
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
      this.deps.globalExpansionFramework.activateExpansionModule(GLOBAL_BRAND_MANAGEMENT_ID);
    }

    appendGbmLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Global Brand Management with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `gbm-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: GBM_METADATA_VERSION,
      },
    };
  }

  connectGlobalBrandManagement(
    _input: ConnectGlobalBrandManagementInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `gbm-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: GLOBAL_BRAND_MANAGEMENT_ID,
      engineVersion: "PILLOW-GBM-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...GBM_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: GBM_METADATA_VERSION,
    };

    appendGbmLog({
      event: "engine_connected",
      level: "info",
      details:
        "Global Brand Management connected — structural signals only; never modify protected assets without authorization",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Structural brand signals only — no live brand asset APIs; never modify protected assets without authorization",
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
    action: GbmRunReport["action"],
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
    producer: () => BrandGovernanceRecord,
  ): GbmRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const record = producer();
      if (
        record.protectedAssetModificationClaim !== "none" ||
        !record.neverModifyProtectedBrandAssetsWithoutAuthorization
      ) {
        return this.failReport(
          action,
          ["Never modify protected brand assets without authorization"],
          Date.now() - started,
        );
      }
      // Safety: even when authorization is requested, structural mode never claims modification.
      if (
        record.protectedAssetModificationAttempted &&
        record.protectedAssetModificationClaim !== "none"
      ) {
        return this.failReport(
          action,
          ["Protected brand asset modification claim must remain none"],
          Date.now() - started,
        );
      }
      this.storeRecord(record);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendGbmLog({
        event: action,
        level: "info",
        details: `${record.brandReference}/${record.region}/${record.brandCategory} status=${record.complianceStatus}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        brandRecords: [record],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGbmLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  manageWorldwideIdentity(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("manage_worldwide_identity", input, config, () =>
      this.governanceEngine.manageWorldwideIdentity(input, config),
    );
  }

  manageRegionalAdaptations(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("manage_regional_adaptations", input, config, () =>
      this.adaptationEngine.manageRegionalAdaptations(input, config),
    );
  }

  manageBrandConsistency(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("manage_brand_consistency", input, config, () =>
      this.consistencyEngine.manageBrandConsistency(input, config),
    );
  }

  monitorBrandPerformance(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("monitor_brand_performance", input, config, () =>
      this.reputationEngine.monitorBrandPerformance(input, config),
    );
  }

  monitorBrandReputation(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("monitor_brand_reputation", input, config, () =>
      this.reputationEngine.monitorBrandReputation(input, config),
    );
  }

  monitorBrandCompliance(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("monitor_brand_compliance", input, config, () =>
      this.governanceEngine.monitorBrandCompliance(input, config),
    );
  }

  detectBrandInconsistencies(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("detect_brand_inconsistencies", input, config, () =>
      this.consistencyEngine.detectBrandInconsistencies(input, config),
    );
  }

  detectReputationRisks(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    return this.runValidated("detect_reputation_risks", input, config, () =>
      this.reputationEngine.detectReputationRisks(input, config),
    );
  }

  recommendBrand(
    input: BrandAnalysisInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport("recommend_brand", validation.errors, Date.now() - started);
      }

      if (this.brandRecords.length === 0) {
        const seed = this.governanceEngine.manageWorldwideIdentity(input, config);
        this.storeRecord(seed);
      }

      const eligible = this.brandRecords.filter(
        (r) =>
          (r.validationStatus === "passed" || r.validationStatus === "partial") &&
          r.neverModifyProtectedBrandAssetsWithoutAuthorization === true &&
          r.protectedAssetModificationClaim === "none",
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "recommend_brand",
          ["No validated brand governance records available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      engineRecord.currentOperationalState = "active";

      appendGbmLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} brand recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "recommend_brand",
        engineRecord,
        brandRecords: this.brandRecords,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendGbmLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport("recommend_brand", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunGbmDiagnosticsInput,
    config: GlobalBrandManagementConfiguration,
  ): GbmRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `gbm-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: GLOBAL_BRAND_MANAGEMENT_ID,
        engineVersion: "PILLOW-GBM-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...GBM_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: GBM_METADATA_VERSION,
      } satisfies GlobalBrandManagementEngineRecord);

    appendGbmLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · records=${this.brandRecords.length} · inconsistencies=${this.inconsistencyCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      brandRecords: this.brandRecords,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
