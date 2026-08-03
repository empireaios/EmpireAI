/** X4-10 — Executive Global Dashboard Manager. */

import type { GlobalExpansionFrameworkEngine } from "../global-expansion-framework/engine.js";
import type { CountryIntelligenceEngine } from "../country-intelligence-engine/engine.js";
import type { LocalizationEngine } from "../localization-engine/engine.js";
import type { LanguageIntelligenceEngine } from "../language-intelligence/engine.js";
import type { CurrencyIntelligenceEngine } from "../currency-intelligence/engine.js";
import type { RegionalComplianceEngine } from "../regional-compliance-engine/engine.js";
import type { GlobalTaxIntelligenceEngine } from "../global-tax-intelligence/engine.js";
import type { InternationalLogisticsEngine } from "../international-logistics-engine/engine.js";
import type { GlobalMarketIntelligenceEngine } from "../global-market-intelligence/engine.js";
import {
  EGD_CAPABILITIES,
  EGD_METADATA_VERSION,
  EXECUTIVE_GLOBAL_DASHBOARD_ID,
} from "./paths.js";
import type { ExecutiveGlobalDashboardConfiguration } from "./configuration.js";
import { appendEgdLog } from "./egd-logging.js";
import { GlobalDashboardEngine } from "./global-dashboard-engine.js";
import { GlobalAlertEngine } from "./global-alert-engine.js";
import { ExecutiveRecommendationEngine } from "./executive-recommendation-engine.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { DashboardValidator } from "./dashboard-validator.js";
import type {
  ConnectExecutiveGlobalDashboardInput,
  DashboardAnalysisInput,
  DashboardRecommendation,
  DashboardSnapshot,
  DashboardValidationReport,
  DashboardWidget,
  EgdRunReport,
  ExecutiveGlobalDashboardEngineRecord,
  RunEgdDiagnosticsInput,
} from "./types.js";

export type ExecutiveGlobalDashboardDependencies = {
  globalExpansionFramework?: GlobalExpansionFrameworkEngine | null;
  countryIntelligenceEngine?: CountryIntelligenceEngine | null;
  localizationEngine?: LocalizationEngine | null;
  languageIntelligence?: LanguageIntelligenceEngine | null;
  currencyIntelligence?: CurrencyIntelligenceEngine | null;
  regionalComplianceEngine?: RegionalComplianceEngine | null;
  globalTaxIntelligence?: GlobalTaxIntelligenceEngine | null;
  internationalLogisticsEngine?: InternationalLogisticsEngine | null;
  globalMarketIntelligence?: GlobalMarketIntelligenceEngine | null;
};

export class ExecutiveGlobalDashboardManager {
  private engineRecord: ExecutiveGlobalDashboardEngineRecord | null = null;
  private snapshots: DashboardSnapshot[] = [];
  private recommendations: DashboardRecommendation[] = [];

  private readonly dashboardEngine = new GlobalDashboardEngine();
  private readonly alertEngine = new GlobalAlertEngine();
  private readonly recommendationEngine = new ExecutiveRecommendationEngine();
  private readonly metadataGenerator = new DashboardMetadataGenerator();
  private readonly validator = new DashboardValidator();

  constructor(private readonly deps: ExecutiveGlobalDashboardDependencies = {}) {}

  getEngineRecord(): ExecutiveGlobalDashboardEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getSnapshots(): DashboardSnapshot[] {
    return this.snapshots.map((s) => ({
      ...s,
      executiveAlerts: s.executiveAlerts.map((a) => ({ ...a })),
      activeWidgets: [...s.activeWidgets],
    }));
  }

  getRecommendations(): DashboardRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  alertCount(): number {
    return this.alertEngine.alertCount(this.snapshots);
  }

  widgetCount(): number {
    const widgets = new Set(this.snapshots.flatMap((s) => s.activeWidgets));
    return widgets.size;
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.snapshots = [];
    this.recommendations = [];
  }

  private dependencyPresence(): ExecutiveGlobalDashboardEngineRecord["dependencyPresence"] {
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
    };
  }

  private dependencyReadyCount(): number {
    return Object.values(this.dependencyPresence()).filter(Boolean).length;
  }

  private requireConnected(): ExecutiveGlobalDashboardEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Executive Global Dashboard not connected — call connectExecutiveGlobalDashboard first",
      );
    }
    return this.engineRecord;
  }

  private storeSnapshot(snapshot: DashboardSnapshot): void {
    const key = `${snapshot.companyReference}::${snapshot.activeWidgets.join(",")}`;
    const idx = this.snapshots.findIndex(
      (s) => `${s.companyReference}::${s.activeWidgets.join(",")}` === key,
    );
    if (idx >= 0) this.snapshots[idx] = snapshot;
    else this.snapshots.push(snapshot);
  }

  failReport(
    action: EgdRunReport["action"],
    errors: string[],
    durationMs: number,
  ): EgdRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "egd-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: EXECUTIVE_GLOBAL_DASHBOARD_ID,
        engineVersion: "PILLOW-EGD-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...EGD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: EGD_METADATA_VERSION,
      } satisfies ExecutiveGlobalDashboardEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `egd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: EGD_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: ExecutiveGlobalDashboardConfiguration): {
    frameworkModuleId: string | null;
    validation: DashboardValidationReport;
  } {
    if (!this.deps.globalExpansionFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.globalExpansionFramework.registerExpansionModule({
      definition: {
        expansionModuleIdentifier: EXECUTIVE_GLOBAL_DASHBOARD_ID,
        moduleVersion: EGD_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X4-10",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "dashboard.worldwide",
            "dashboard.country",
            "dashboard.regional",
            "dashboard.market",
            "dashboard.logistics",
            "dashboard.compliance",
            "dashboard.taxation",
            "dashboard.localization",
            "dashboard.alerts",
            "dashboard.recommendations",
            "dashboard.refresh",
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
        EXECUTIVE_GLOBAL_DASHBOARD_ID,
      );
    }

    appendEgdLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Executive Global Dashboard with GEF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.expansionFrameworkId ?? null,
      validation: {
        validationReportId: `egd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: EGD_METADATA_VERSION,
      },
    };
  }

  connectExecutiveGlobalDashboard(
    _input: ConnectExecutiveGlobalDashboardInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const depsReady = Object.values(presence).every(Boolean);

    this.engineRecord = {
      engineRecordId: `egd-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_GLOBAL_DASHBOARD_ID,
      engineVersion: "PILLOW-EGD-001",
      currentOperationalState: "connected",
      healthStatus: depsReady ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...EGD_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: EGD_METADATA_VERSION,
    };

    appendEgdLog({
      event: "engine_connected",
      level: "info",
      details:
        "Executive Global Dashboard connected — structural visibility only; never expose restricted information",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      `Refresh frequency ${config.dashboardRefreshFrequencyMs}ms`,
      "Structural dashboard signals only — no live UI rendering APIs; authorized access required",
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
    action: EgdRunReport["action"],
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
    producer: () => DashboardSnapshot,
  ): EgdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }
      const snapshot = producer();
      if (
        snapshot.restrictedInformationExposureClaim !== "none" ||
        !snapshot.neverExposeRestrictedEnterpriseInformation ||
        !snapshot.authorizedAccess
      ) {
        return this.failReport(
          action,
          ["Never expose restricted enterprise information to unauthorized users"],
          Date.now() - started,
        );
      }
      this.storeSnapshot(snapshot);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();
      appendEgdLog({
        event: action,
        level: "info",
        details: `${snapshot.companyReference} widgets=${snapshot.activeWidgets.length} alerts=${snapshot.executiveAlerts.length}`,
      });
      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        snapshots: [snapshot],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEgdLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  private displayWidget(
    action: EgdRunReport["action"],
    widget: DashboardWidget,
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.runValidated(action, input, config, () =>
      this.dashboardEngine.displayWidget(
        widget,
        input,
        config,
        this.dependencyReadyCount(),
      ),
    );
  }

  displayWorldwideOperations(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_worldwide_operations",
      "worldwide_operations",
      input,
      config,
    );
  }

  displayCountryExpansion(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_country_expansion",
      "country_expansion",
      input,
      config,
    );
  }

  displayRegionalPerformance(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_regional_performance",
      "regional_performance",
      input,
      config,
    );
  }

  displayMarketOpportunities(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_market_opportunities",
      "market_opportunities",
      input,
      config,
    );
  }

  displayLogisticsPerformance(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_logistics_performance",
      "logistics_performance",
      input,
      config,
    );
  }

  displayComplianceStatus(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_compliance_status",
      "compliance_status",
      input,
      config,
    );
  }

  displayTaxationStatus(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_taxation_status",
      "taxation_status",
      input,
      config,
    );
  }

  displayLocalizationReadiness(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.displayWidget(
      "display_localization_readiness",
      "localization_readiness",
      input,
      config,
    );
  }

  displayExecutiveAlerts(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.runValidated("display_executive_alerts", input, config, () =>
      this.alertEngine.displayExecutiveAlerts(input, config, this.dependencyReadyCount()),
    );
  }

  displayGlobalRecommendations(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateInput(input, config);
      if (validation.decision === "fail") {
        this.recommendations = [];
        return this.failReport(
          "display_global_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }

      if (this.snapshots.length === 0) {
        const seed = this.dashboardEngine.refreshDashboard(
          input,
          config,
          this.dependencyReadyCount(),
        );
        this.storeSnapshot(seed);
      }

      const eligible = this.snapshots.filter(
        (s) =>
          (s.validationStatus === "passed" || s.validationStatus === "partial") &&
          s.neverExposeRestrictedEnterpriseInformation === true &&
          s.restrictedInformationExposureClaim === "none" &&
          s.authorizedAccess === true,
      );
      if (eligible.length === 0) {
        this.recommendations = [];
        return this.failReport(
          "display_global_recommendations",
          ["No validated dashboard snapshots available for recommendations"],
          Date.now() - started,
        );
      }

      this.recommendations = this.recommendationEngine.generate(eligible, config);
      const widgetSnapshot = this.dashboardEngine.displayWidget(
        "global_recommendations",
        input,
        config,
        this.dependencyReadyCount(),
      );
      this.storeSnapshot(widgetSnapshot);
      engineRecord.currentOperationalState = "active";

      appendEgdLog({
        event: "recommendation_generation",
        level: "info",
        details: `Generated ${this.recommendations.length} executive recommendations`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "display_global_recommendations",
        engineRecord,
        snapshots: [widgetSnapshot],
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEgdLog({ event: "engine_failure", level: "error", details: message });
      return this.failReport(
        "display_global_recommendations",
        [message],
        Date.now() - started,
      );
    }
  }

  refreshDashboard(
    input: DashboardAnalysisInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    return this.runValidated("refresh_dashboard", input, config, () =>
      this.dashboardEngine.refreshDashboard(input, config, this.dependencyReadyCount()),
    );
  }

  runDiagnostics(
    _input: RunEgdDiagnosticsInput,
    config: ExecutiveGlobalDashboardConfiguration,
  ): EgdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `egd-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: EXECUTIVE_GLOBAL_DASHBOARD_ID,
        engineVersion: "PILLOW-EGD-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...EGD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: EGD_METADATA_VERSION,
      } satisfies ExecutiveGlobalDashboardEngineRecord);

    appendEgdLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · snapshots=${this.snapshots.length} · alerts=${this.alertCount()}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      snapshots: this.snapshots,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
