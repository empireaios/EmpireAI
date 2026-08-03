/** X3-09 — Executive Scaling Dashboard Manager. */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";
import type { WorkforceIntelligenceEngine } from "../workforce-intelligence/engine.js";
import {
  EXECUTIVE_SCALING_DASHBOARD_ID,
  ESD_CAPABILITIES,
  ESD_METADATA_VERSION,
} from "./paths.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import { appendEsdLog } from "./esd-logging.js";
import { ScalingMetricsAggregator } from "./scaling-metrics-aggregator.js";
import { ExecutiveWidgetManager } from "./executive-widget-manager.js";
import { ExecutiveAlertEngine } from "./executive-alert-engine.js";
import { ExecutiveRecommendationEngine } from "./executive-recommendation-engine.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { DashboardValidator } from "./dashboard-validator.js";
import type {
  ConnectExecutiveScalingDashboardInput,
  ExecutiveDashboardSnapshot,
  ExecutiveDashboardValidationReport,
  ExecutiveScalingDashboardEngineRecord,
  ExecutiveScalingDashboardInput,
  ExecutiveScalingRecommendation,
  EsdRunReport,
  RunEsdDiagnosticsInput,
} from "./types.js";

export type ExecutiveScalingDashboardDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
  financialScaleEngine?: FinancialScaleEngine | null;
  workforceIntelligence?: WorkforceIntelligenceEngine | null;
};

export class ExecutiveScalingDashboardManager {
  private engineRecord: ExecutiveScalingDashboardEngineRecord | null = null;
  private dashboardSnapshots: ExecutiveDashboardSnapshot[] = [];
  private recommendations: ExecutiveScalingRecommendation[] = [];
  private lastAlerts: string[] = [];

  private readonly aggregator: ScalingMetricsAggregator;
  private readonly widgets: ExecutiveWidgetManager;
  private readonly alertEngine = new ExecutiveAlertEngine();
  private readonly recommendationEngine = new ExecutiveRecommendationEngine();
  private readonly metadataGenerator = new DashboardMetadataGenerator();
  private readonly validator = new DashboardValidator();

  constructor(private readonly deps: ExecutiveScalingDashboardDependencies = {}) {
    this.aggregator = new ScalingMetricsAggregator(deps);
    this.widgets = new ExecutiveWidgetManager(this.aggregator);
  }

  getEngineRecord(): ExecutiveScalingDashboardEngineRecord | null {
    return this.engineRecord ? { ...this.engineRecord } : null;
  }

  getDashboardSnapshots(): ExecutiveDashboardSnapshot[] {
    return this.dashboardSnapshots.map((r) => ({ ...r }));
  }

  getRecommendations(): ExecutiveScalingRecommendation[] {
    return this.recommendations.map((r) => ({ ...r }));
  }

  getLastAlerts(): string[] {
    return [...this.lastAlerts];
  }

  alertCount(): number {
    return this.lastAlerts.filter((a) => /alert|watch|partial|below/i.test(a)).length;
  }

  averageReadiness(): number {
    if (this.dashboardSnapshots.length === 0) return 0;
    const latest = this.dashboardSnapshots[this.dashboardSnapshots.length - 1]!;
    const scores = [
      latest.scalingSummary.readinessScore,
      latest.opportunitySummary.readinessScore,
      latest.capacitySummary.readinessScore,
      latest.marketingSummary.readinessScore,
      latest.supplierSummary.readinessScore,
      latest.financialSummary.readinessScore,
      latest.workforceSummary.readinessScore,
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.dashboardSnapshots = [];
    this.recommendations = [];
    this.lastAlerts = [];
  }

  private dependencyPresence(): ExecutiveScalingDashboardEngineRecord["dependencyPresence"] {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),
      financialScaleEngine: Boolean(this.deps.financialScaleEngine),
      workforceIntelligence: Boolean(this.deps.workforceIntelligence),
    };
  }

  private requireConnected(): ExecutiveScalingDashboardEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "disconnected") {
      throw new Error(
        "Executive Scaling Dashboard not connected — call connectExecutiveScalingDashboard first",
      );
    }
    return this.engineRecord;
  }

  private storeSnapshot(snapshot: ExecutiveDashboardSnapshot): void {
    const idx = this.dashboardSnapshots.findIndex(
      (r) => r.companyReference === snapshot.companyReference,
    );
    if (idx >= 0) this.dashboardSnapshots[idx] = snapshot;
    else this.dashboardSnapshots.push(snapshot);
  }

  failReport(
    action: EsdRunReport["action"],
    errors: string[],
    durationMs: number,
  ): EsdRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "esd-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: EXECUTIVE_SCALING_DASHBOARD_ID,
        engineVersion: "PILLOW-ESD-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...ESD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: ESD_METADATA_VERSION,
      } satisfies ExecutiveScalingDashboardEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      validation: {
        validationReportId: `esd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: ESD_METADATA_VERSION,
      },
      durationMs,
    });
  }

  registerWithFramework(config: ExecutiveScalingDashboardConfiguration): {
    frameworkModuleId: string | null;
    validation: ExecutiveDashboardValidationReport;
  } {
    if (!this.deps.autonomousScalingFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.autonomousScalingFramework.registerScalingModule({
      definition: {
        scalingModuleIdentifier: EXECUTIVE_SCALING_DASHBOARD_ID,
        moduleVersion: ESD_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X3-09",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "executive.dashboard.refreshed",
            "executive.alerts.generated",
            "executive.recommendations.generated",
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
          "scaling_module_registration",
          "scaling_lifecycle_management",
          "scaling_event_routing",
          "scaling_data_abstraction",
          "scaling_validation",
          "diagnostics",
        ],
      },
      forceRegister: true,
    });

    if (report.validation.decision !== "fail") {
      this.deps.autonomousScalingFramework.activateScalingModule(
        EXECUTIVE_SCALING_DASHBOARD_ID,
      );
    }

    appendEsdLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Executive Scaling Dashboard with ASF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.scalingFrameworkId ?? null,
      validation: {
        validationReportId: `esd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: ESD_METADATA_VERSION,
      },
    };
  }

  connectExecutiveScalingDashboard(
    _input: ConnectExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const corePresent = presence.autonomousScalingFramework;
    const connectedCount = Object.values(presence).filter(Boolean).length;

    this.engineRecord = {
      engineRecordId: `esd-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_SCALING_DASHBOARD_ID,
      engineVersion: "PILLOW-ESD-001",
      currentOperationalState: "connected",
      healthStatus: corePresent
        ? connectedCount >= 8
          ? "healthy"
          : "degraded"
        : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...ESD_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: ESD_METADATA_VERSION,
    };

    appendEsdLog({
      event: "engine_connected",
      level: "info",
      details:
        "Executive Scaling Dashboard connected — never expose restricted enterprise information; structural signals only",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...Object.entries(presence)
        .filter(([, ok]) => !ok)
        .map(([key]) => `${key} unavailable`),
      "Never expose restricted enterprise information",
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

  private runWidgetOp(
    action: EsdRunReport["action"],
    label: string,
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
    produce: () => ExecutiveDashboardSnapshot,
    logEvent: string,
  ): EsdRunReport {
    const started = Date.now();
    try {
      if (!config.widgetRulesEnabled && action.startsWith("get_")) {
        return this.failReport(action, ["Widget rules disabled"], Date.now() - started);
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDashboard(label, input, config);
      if (validation.decision === "fail") {
        return this.failReport(action, validation.errors, Date.now() - started);
      }

      const snapshot = produce();
      this.storeSnapshot(snapshot);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendEsdLog({
        event: logEvent,
        level: "info",
        details: `${label} · ${snapshot.companyReference} · scaling=${snapshot.scalingSummary.readinessScore} · capacity=${snapshot.capacitySummary.readinessScore}`,
      });

      return this.metadataGenerator.buildRunReport({
        action,
        engineRecord,
        dashboardSnapshots: [snapshot],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEsdLog({ event: "dashboard_failure", level: "error", details: message });
      return this.failReport(action, [message], Date.now() - started);
    }
  }

  refreshDashboard(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    const started = Date.now();
    try {
      if (!config.dashboardRefreshEnabled || !config.aggregationRulesEnabled) {
        return this.failReport(
          "refresh_dashboard",
          ["Dashboard refresh or aggregation rules disabled"],
          Date.now() - started,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDashboard("Dashboard refresh", input, config);
      if (validation.decision === "fail") {
        return this.failReport("refresh_dashboard", validation.errors, Date.now() - started);
      }

      const snapshot = this.aggregator.aggregate(input, config);
      this.lastAlerts = this.alertEngine.generate([snapshot], config);
      const withAlerts = this.alertEngine.attachAlerts(snapshot, this.lastAlerts);
      this.storeSnapshot(withAlerts);
      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      appendEsdLog({
        event: "dashboard_refresh",
        level: "info",
        details: `Refreshed cockpit · ${withAlerts.companyReference} · alerts=${this.lastAlerts.length}`,
      });

      return this.metadataGenerator.buildRunReport({
        action: "refresh_dashboard",
        engineRecord,
        dashboardSnapshots: [withAlerts],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEsdLog({ event: "dashboard_failure", level: "error", details: message });
      return this.failReport("refresh_dashboard", [message], Date.now() - started);
    }
  }

  getScalingStatus(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_scaling_status",
      "Scaling status display",
      input,
      config,
      () => this.widgets.getScalingStatus(input, config),
      "widget_query",
    );
  }

  getScalingOpportunities(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_scaling_opportunities",
      "Scaling opportunities display",
      input,
      config,
      () => this.widgets.getScalingOpportunities(input, config),
      "widget_query",
    );
  }

  getScalingDecisions(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_scaling_decisions",
      "Scaling decisions display",
      input,
      config,
      () => this.widgets.getScalingDecisions(input, config),
      "widget_query",
    );
  }

  getOperationalCapacity(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_operational_capacity",
      "Operational capacity display",
      input,
      config,
      () => this.widgets.getOperationalCapacity(input, config),
      "widget_query",
    );
  }

  getMarketingGrowth(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_marketing_growth",
      "Marketing growth display",
      input,
      config,
      () => this.widgets.getMarketingGrowth(input, config),
      "widget_query",
    );
  }

  getSupplierReadiness(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_supplier_readiness",
      "Supplier readiness display",
      input,
      config,
      () => this.widgets.getSupplierReadiness(input, config),
      "widget_query",
    );
  }

  getFinancialReadiness(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_financial_readiness",
      "Financial readiness display",
      input,
      config,
      () => this.widgets.getFinancialReadiness(input, config),
      "widget_query",
    );
  }

  getWorkforceUtilization(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    return this.runWidgetOp(
      "get_workforce_utilization",
      "Workforce utilization display",
      input,
      config,
      () => this.widgets.getWorkforceUtilization(input, config),
      "widget_query",
    );
  }

  getExecutiveAlerts(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDashboard("Executive alerts", input, config);
      if (validation.decision === "fail") {
        return this.failReport("get_executive_alerts", validation.errors, Date.now() - started);
      }
      if (this.dashboardSnapshots.length === 0) {
        this.storeSnapshot(this.aggregator.aggregate(input, config));
      }
      this.lastAlerts = this.alertEngine.generate(this.dashboardSnapshots, config);
      const latest = this.dashboardSnapshots[this.dashboardSnapshots.length - 1]!;
      const withAlerts = this.alertEngine.attachAlerts(latest, this.lastAlerts);
      this.storeSnapshot(withAlerts);
      engineRecord.currentOperationalState = "active";
      appendEsdLog({
        event: "executive_alerts",
        level: "info",
        details: `Generated ${this.lastAlerts.length} executive alerts`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "get_executive_alerts",
        engineRecord,
        dashboardSnapshots: [withAlerts],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEsdLog({ event: "dashboard_failure", level: "error", details: message });
      return this.failReport("get_executive_alerts", [message], Date.now() - started);
    }
  }

  getScalingRecommendations(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    const started = Date.now();
    try {
      if (!config.recommendationRulesEnabled) {
        return this.failReport(
          "get_scaling_recommendations",
          ["Recommendation rules disabled"],
          0,
        );
      }
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDashboard(
        "Scaling recommendations",
        input,
        config,
      );
      if (validation.decision === "fail") {
        return this.failReport(
          "get_scaling_recommendations",
          validation.errors,
          Date.now() - started,
        );
      }
      if (this.dashboardSnapshots.length === 0) {
        this.storeSnapshot(this.aggregator.aggregate(input, config));
      }
      this.recommendations = this.recommendationEngine.generate(
        this.dashboardSnapshots,
        config,
      );
      engineRecord.currentOperationalState = "active";
      appendEsdLog({
        event: "scaling_recommendations",
        level: "info",
        details: `Generated ${this.recommendations.length} scaling recommendations`,
      });
      return this.metadataGenerator.buildRunReport({
        action: "get_scaling_recommendations",
        engineRecord,
        dashboardSnapshots: this.dashboardSnapshots,
        recommendations: this.recommendations,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      appendEsdLog({ event: "dashboard_failure", level: "error", details: message });
      return this.failReport("get_scaling_recommendations", [message], Date.now() - started);
    }
  }

  runDiagnostics(
    _input: RunEsdDiagnosticsInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): EsdRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: `esd-eng-diag-${Date.now()}`,
        timestamp: new Date().toISOString(),
        engineId: EXECUTIVE_SCALING_DASHBOARD_ID,
        engineVersion: "PILLOW-ESD-001",
        currentOperationalState: "connected",
        healthStatus: "healthy",
        validationStatus: "passed",
        supportedCapabilities: [...ESD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: ESD_METADATA_VERSION,
      } satisfies ExecutiveScalingDashboardEngineRecord);

    appendEsdLog({
      event: "diagnostics",
      level: "info",
      details: `Diagnostics · snapshots=${this.dashboardSnapshots.length} · alerts=${this.alertCount()} · avgReadiness=${this.averageReadiness()}%`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "diagnostics",
      engineRecord,
      dashboardSnapshots: this.dashboardSnapshots,
      recommendations: this.recommendations,
      validation: configValidation,
      durationMs: Date.now() - started,
    });
  }
}
