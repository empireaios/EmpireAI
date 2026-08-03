/** X2-06 — Executive Portfolio Dashboard Manager. */

import type { EnterprisePortfolioFrameworkEngine } from "../enterprise-portfolio-framework/engine.js";
import type { MultiCompanyRegistry } from "../multi-company-registry/engine.js";
import type { PortfolioPerformanceEngine } from "../portfolio-performance-engine/engine.js";
import type { CrossBusinessKnowledgeEngine } from "../cross-business-knowledge-engine/engine.js";
import type { CapitalDistributionEngine } from "../capital-distribution-engine/engine.js";
import {
  EPD_CAPABILITIES,
  EPD_METADATA_VERSION,
  EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
} from "./paths.js";
import { appendEpdLog } from "./epd-logging.js";
import { ExecutiveDashboardEngine } from "./executive-dashboard-engine.js";
import { PortfolioKpiEngine } from "./portfolio-kpi-engine.js";
import { PortfolioAnalyticsAggregator } from "./portfolio-analytics-aggregator.js";
import { ExecutiveWidgetManager } from "./executive-widget-manager.js";
import { ExecutiveRecommendationEngine } from "./executive-recommendation-engine.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { DashboardValidator } from "./dashboard-validator.js";
import type { ExecutivePortfolioDashboardConfiguration } from "./configuration.js";
import type {
  AggregatePortfolioKpisInput,
  ConnectExecutiveDashboardInput,
  DashboardEngineRecord,
  DashboardRunReport,
  DrillDownInput,
  GenerateExecutiveAlertsInput,
  PortfolioDashboardSnapshot,
  RecommendExecutiveInput,
  RefreshDashboardInput,
  RunDashboardDiagnosticsInput,
} from "./types.js";

export type ExecutivePortfolioDashboardDependencies = {
  enterprisePortfolioFramework: EnterprisePortfolioFrameworkEngine | null;
  multiCompanyRegistry: MultiCompanyRegistry | null;
  portfolioPerformanceEngine: PortfolioPerformanceEngine | null;
  crossBusinessKnowledgeEngine: CrossBusinessKnowledgeEngine | null;
  capitalDistributionEngine: CapitalDistributionEngine | null;
};

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export class ExecutivePortfolioDashboardManager {
  private engineRecord: DashboardEngineRecord | null = null;
  private readonly widgets = new ExecutiveWidgetManager();
  private readonly dashboardEngine = new ExecutiveDashboardEngine(this.widgets);
  private readonly kpiEngine = new PortfolioKpiEngine();
  private readonly aggregator = new PortfolioAnalyticsAggregator();
  private readonly recommendations = new ExecutiveRecommendationEngine();
  private readonly validator = new DashboardValidator();
  private readonly metadataGenerator = new DashboardMetadataGenerator();

  constructor(private readonly deps: ExecutivePortfolioDashboardDependencies) {}

  getEngineRecord(): DashboardEngineRecord | null {
    return this.engineRecord;
  }

  getLatestSnapshot(): PortfolioDashboardSnapshot | null {
    return this.dashboardEngine.getLatestSnapshot();
  }

  private probe(getter: () => unknown): boolean {
    try {
      getter();
      return true;
    } catch {
      return false;
    }
  }

  private dependencyPresence(): DashboardEngineRecord["dependencyPresence"] {
    return {
      enterprisePortfolioFramework: this.deps.enterprisePortfolioFramework
        ? this.probe(() => this.deps.enterprisePortfolioFramework!.getState())
        : false,
      multiCompanyRegistry: this.deps.multiCompanyRegistry
        ? this.probe(() => this.deps.multiCompanyRegistry!.getState())
        : false,
      portfolioPerformanceEngine: this.deps.portfolioPerformanceEngine
        ? this.probe(() => this.deps.portfolioPerformanceEngine!.getState())
        : false,
      crossBusinessKnowledgeEngine: this.deps.crossBusinessKnowledgeEngine
        ? this.probe(() => this.deps.crossBusinessKnowledgeEngine!.getState())
        : false,
      capitalDistributionEngine: this.deps.capitalDistributionEngine
        ? this.probe(() => this.deps.capitalDistributionEngine!.getState())
        : false,
    };
  }

  private requireConnected(): DashboardEngineRecord {
    if (!this.engineRecord || this.engineRecord.currentOperationalState === "failed") {
      throw new Error(
        "Executive Portfolio Dashboard not connected — call connectExecutivePortfolioDashboard first",
      );
    }
    return this.engineRecord;
  }

  private failReport(
    action: DashboardRunReport["action"],
    errors: string[],
    durationMs: number,
  ): DashboardRunReport {
    const engineRecord =
      this.engineRecord ??
      ({
        engineRecordId: "epd-eng-pending",
        timestamp: new Date().toISOString(),
        engineId: EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
        engineVersion: "PILLOW-EPD-001",
        currentOperationalState: "failed",
        healthStatus: "failed",
        validationStatus: "failed",
        supportedCapabilities: [...EPD_CAPABILITIES],
        frameworkModuleId: null,
        dependencyPresence: this.dependencyPresence(),
        metadataVersion: EPD_METADATA_VERSION,
      } satisfies DashboardEngineRecord);

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      snapshot: null,
      validation: {
        validationReportId: `epd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: "fail",
        errors,
        warnings: [],
        durationMs,
        metadataVersion: EPD_METADATA_VERSION,
      },
      durationMs,
    });
  }

  private collectSourceData(config: ExecutivePortfolioDashboardConfiguration) {
    const epfState = safe(() => this.deps.enterprisePortfolioFramework?.getState() ?? null, null);
    const mcrState = safe(() => this.deps.multiCompanyRegistry?.getState() ?? null, null);
    const ppeState = safe(() => this.deps.portfolioPerformanceEngine?.getState() ?? null, null);
    const cbkState = safe(() => this.deps.crossBusinessKnowledgeEngine?.getState() ?? null, null);
    const cdeState = safe(() => this.deps.capitalDistributionEngine?.getState() ?? null, null);

    const companies = safe(
      () => this.deps.multiCompanyRegistry?.getCompanyRecords() ?? [],
      [],
    );
    const performanceRecords = safe(
      () => this.deps.portfolioPerformanceEngine?.getPerformanceRecords() ?? [],
      [],
    );
    const knowledgeRecords = safe(
      () => this.deps.crossBusinessKnowledgeEngine?.getKnowledgeRecords() ?? [],
      [],
    );
    const allocations = safe(
      () => this.deps.capitalDistributionEngine?.getAllocationRecords() ?? [],
      [],
    );

    const portfolio = this.aggregator.aggregatePortfolio({
      registeredModules: epfState?.registeredModules.length ?? 0,
      activeModules: epfState?.health.activeModules ?? 0,
      frameworkHealthScore: epfState?.health.healthScore ?? 0,
      frameworkStatus: epfState?.status ?? "unavailable",
    });

    const companySummary = this.aggregator.aggregateCompanies({
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.operationalStatus === "active").length,
      categoriesTracked: new Set(companies.map((c) => c.companyCategory)).size,
    });

    const avgPerf =
      performanceRecords.length > 0
        ? Math.round(
            performanceRecords.reduce((s, r) => s + r.overallPerformanceScore, 0) /
              performanceRecords.length,
          )
        : 0;
    const top =
      [...performanceRecords].sort(
        (a, b) => b.overallPerformanceScore - a.overallPerformanceScore,
      )[0] ?? null;
    const spread =
      performanceRecords.length > 1
        ? (top?.overallPerformanceScore ?? 0) -
          Math.min(...performanceRecords.map((r) => r.overallPerformanceScore))
        : 0;

    const avgGrowth =
      performanceRecords.length > 0
        ? Math.round(
            performanceRecords.reduce((s, r) => s + r.growthMetrics.growthIndex, 0) /
              performanceRecords.length,
          )
        : knowledgeRecords.length > 0
          ? 55
          : 0;

    const totalApproved = allocations.reduce((s, a) => s + a.approvedAllocation, 0);
    const capitalEfficiencyHint =
      allocations.length > 0
        ? Math.round(
            allocations.reduce((s, a) => s + a.capitalEfficiency, 0) / allocations.length,
          )
        : 50;
    const knowledgeReuseHint =
      knowledgeRecords.length > 0
        ? Math.round(
            knowledgeRecords.reduce((s, k) => s + k.reusabilityScore, 0) /
              knowledgeRecords.length,
          )
        : 50;

    const kpis = config.kpiSelectionRulesEnabled
      ? this.kpiEngine.aggregate({
          companiesMeasured: performanceRecords.length,
          averagePerformanceScore: avgPerf,
          topPerformerReference: top?.companyReference ?? null,
          portfolioSpread: spread,
          capitalEfficiencyHint,
          knowledgeReuseHint,
        })
      : {
          companiesMeasured: performanceRecords.length,
          averagePerformanceScore: avgPerf,
          topPerformerReference: top?.companyReference ?? null,
          portfolioSpread: spread,
          overallKpiScore: avgPerf,
        };

    const capital = this.aggregator.aggregateCapital({
      availablePoolUnits: cdeState?.health.availablePoolUnits ?? 0,
      allocationCount: allocations.length,
      totalApprovedUnits: totalApproved,
      highRiskSignals: cdeState?.health.highRiskSignals ?? 0,
    });

    const growth = this.aggregator.aggregateGrowth({
      knowledgeAssets: knowledgeRecords.length,
      sharedKnowledge: cbkState?.health.sharedKnowledgeRecords ?? 0,
      averageGrowthIndex: avgGrowth,
    });

    const health = this.aggregator.aggregateHealth({
      companyHealthScore: mcrState?.health.healthScore ?? 0,
      performanceHealthScore: ppeState?.health.healthScore ?? 0,
      capitalHealthScore: cdeState?.health.healthScore ?? 0,
      knowledgeHealthScore: cbkState?.health.healthScore ?? 0,
      frameworkHealthScore: epfState?.health.healthScore ?? 0,
    });

    return { portfolio, companySummary, kpis, capital, growth, health };
  }

  registerWithFramework(
    config: ExecutivePortfolioDashboardConfiguration,
  ): { frameworkModuleId: string | null; validation: DashboardRunReport["validation"] } {
    if (!this.deps.enterprisePortfolioFramework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.deps.enterprisePortfolioFramework.registerPortfolioModule({
      definition: {
        portfolioModuleIdentifier: EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
        moduleVersion: EPD_METADATA_VERSION,
        moduleType: "integration",
        integrationMissionId: "X2-06",
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "dashboard.refreshed",
            "dashboard.alert",
            "dashboard.recommended",
            "dashboard.drill_down",
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
        EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
      );
    }

    appendEpdLog({
      event: "framework_registration",
      level: "info",
      details: `Registered Executive Portfolio Dashboard with EPF: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.portfolioFrameworkId ?? null,
      validation: {
        validationReportId: `epd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: EPD_METADATA_VERSION,
      },
    };
  }

  connectExecutivePortfolioDashboard(
    _input: ConnectExecutiveDashboardInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    const configValidation = this.validator.validateConfiguration(config);
    if (configValidation.decision === "fail") {
      return this.failReport("connect", configValidation.errors, Date.now() - started);
    }

    const framework = this.registerWithFramework(config);
    const presence = this.dependencyPresence();
    const connectedCount = Object.values(presence).filter(Boolean).length;
    const allPresent = connectedCount === 5;

    this.engineRecord = {
      engineRecordId: `epd-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: EXECUTIVE_PORTFOLIO_DASHBOARD_ID,
      engineVersion: "PILLOW-EPD-001",
      currentOperationalState: "connected",
      healthStatus: allPresent ? "healthy" : "degraded",
      validationStatus:
        framework.validation.decision === "fail"
          ? "failed"
          : framework.validation.decision === "partial"
            ? "partial"
            : "passed",
      supportedCapabilities: [...EPD_CAPABILITIES],
      frameworkModuleId: framework.frameworkModuleId,
      dependencyPresence: presence,
      metadataVersion: EPD_METADATA_VERSION,
    };

    appendEpdLog({
      event: "engine_connected",
      level: "info",
      details: "Executive Portfolio Dashboard connected",
    });

    const warnings = [
      ...framework.validation.warnings,
      ...configValidation.warnings,
      ...(presence.enterprisePortfolioFramework ? [] : ["EPF unavailable"]),
      ...(presence.multiCompanyRegistry ? [] : ["Multi-Company Registry unavailable"]),
      ...(presence.portfolioPerformanceEngine ? [] : ["Portfolio Performance unavailable"]),
      ...(presence.crossBusinessKnowledgeEngine ? [] : ["Cross-Business Knowledge unavailable"]),
      ...(presence.capitalDistributionEngine ? [] : ["Capital Distribution unavailable"]),
    ];

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: this.engineRecord,
      snapshot: null,
      validation: {
        ...framework.validation,
        warnings,
        decision:
          framework.validation.decision === "fail"
            ? "fail"
            : !allPresent
              ? "partial"
              : framework.validation.decision,
      },
      durationMs: Date.now() - started,
    });
  }

  refreshDashboard(
    input: RefreshDashboardInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateRefresh(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "refresh",
          engineRecord,
          snapshot: null,
          validation,
          durationMs: Date.now() - started,
        });
      }

      const source = this.collectSourceData(config);
      const alerts = config.executiveAlertRulesEnabled
        ? this.recommendations.generateAlerts({
            health: source.health,
            kpis: source.kpis,
            capital: source.capital,
            alertHealthScoreThreshold: config.alertHealthScoreThreshold,
          })
        : [];
      const recs = this.recommendations.generateRecommendations({
        health: source.health,
        kpis: source.kpis,
        capital: source.capital,
        alerts,
      });

      const snapshot = this.dashboardEngine.buildSnapshot({
        portfolio: source.portfolio,
        companies: source.companySummary,
        kpis: source.kpis,
        capital: source.capital,
        growth: source.growth,
        health: source.health,
        alerts,
        recommendations: recs,
      });

      const snapshotValidation = this.validator.validateSnapshot(snapshot);
      if (snapshotValidation.decision === "fail") {
        validation.decision = "fail";
        validation.errors.push(...snapshotValidation.errors);
      } else if (
        source.companySummary.totalCompanies === 0 &&
        source.kpis.companiesMeasured === 0
      ) {
        validation.decision = "partial";
        validation.warnings.push("Missing enterprise data — dashboard partially populated");
      }

      engineRecord.currentOperationalState = "active";
      engineRecord.timestamp = new Date().toISOString();

      return this.metadataGenerator.buildRunReport({
        action: "refresh",
        engineRecord,
        snapshot,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "refresh",
        [error instanceof Error ? error.message : "Dashboard refresh failed"],
        Date.now() - started,
      );
    }
  }

  aggregatePortfolioKpis(
    input: AggregatePortfolioKpisInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "aggregate_kpis",
          ["KPI aggregation requires validated=true"],
          Date.now() - started,
        );
      }
      const source = this.collectSourceData(config);
      const snapshot =
        this.dashboardEngine.getLatestSnapshot() ??
        this.dashboardEngine.buildSnapshot({
          portfolio: source.portfolio,
          companies: source.companySummary,
          kpis: source.kpis,
          capital: source.capital,
          growth: source.growth,
          health: source.health,
          alerts: [],
          recommendations: [],
        });
      snapshot.portfolioKpiSummary = source.kpis;
      return this.metadataGenerator.buildRunReport({
        action: "aggregate_kpis",
        engineRecord,
        snapshot,
        validation: {
          validationReportId: `epd-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: source.kpis.companiesMeasured === 0 ? "partial" : "pass",
          errors: [],
          warnings:
            source.kpis.companiesMeasured === 0
              ? ["KPI calculation limited — no performance records"]
              : [],
          durationMs: Date.now() - started,
          metadataVersion: EPD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "aggregate_kpis",
        [error instanceof Error ? error.message : "KPI calculation failed"],
        Date.now() - started,
      );
    }
  }

  generateExecutiveAlerts(
    input: GenerateExecutiveAlertsInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "generate_alerts",
          ["Executive alert generation requires validated=true"],
          Date.now() - started,
        );
      }
      const source = this.collectSourceData(config);
      const alerts = this.recommendations.generateAlerts({
        health: source.health,
        kpis: source.kpis,
        capital: source.capital,
        alertHealthScoreThreshold: config.alertHealthScoreThreshold,
      });
      const snapshot =
        this.dashboardEngine.getLatestSnapshot() ??
        this.dashboardEngine.buildSnapshot({
          portfolio: source.portfolio,
          companies: source.companySummary,
          kpis: source.kpis,
          capital: source.capital,
          growth: source.growth,
          health: source.health,
          alerts,
          recommendations: [],
        });
      snapshot.executiveAlerts = alerts;
      return this.metadataGenerator.buildRunReport({
        action: "generate_alerts",
        engineRecord,
        snapshot,
        validation: {
          validationReportId: `epd-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: EPD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "generate_alerts",
        [error instanceof Error ? error.message : "Alert generation failed"],
        Date.now() - started,
      );
    }
  }

  generateRecommendations(
    input: RecommendExecutiveInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      if (input.validated !== true) {
        return this.failReport(
          "recommend",
          ["Executive recommendations require validated=true"],
          Date.now() - started,
        );
      }
      const source = this.collectSourceData(config);
      const alerts = this.recommendations.generateAlerts({
        health: source.health,
        kpis: source.kpis,
        capital: source.capital,
        alertHealthScoreThreshold: config.alertHealthScoreThreshold,
      });
      const recs = this.recommendations.generateRecommendations({
        health: source.health,
        kpis: source.kpis,
        capital: source.capital,
        alerts,
      });
      const snapshot =
        this.dashboardEngine.getLatestSnapshot() ??
        this.dashboardEngine.buildSnapshot({
          portfolio: source.portfolio,
          companies: source.companySummary,
          kpis: source.kpis,
          capital: source.capital,
          growth: source.growth,
          health: source.health,
          alerts,
          recommendations: recs,
        });
      snapshot.executiveRecommendations = recs;
      return this.metadataGenerator.buildRunReport({
        action: "recommend",
        engineRecord,
        snapshot,
        validation: {
          validationReportId: `epd-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: "pass",
          errors: [],
          warnings: [],
          durationMs: Date.now() - started,
          metadataVersion: EPD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "recommend",
        [error instanceof Error ? error.message : "Recommendation generation failed"],
        Date.now() - started,
      );
    }
  }

  drillDown(
    input: DrillDownInput,
    config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const validation = this.validator.validateDrillDown(input, config);
      if (validation.decision === "fail") {
        return this.metadataGenerator.buildRunReport({
          action: "drill_down",
          engineRecord,
          snapshot: null,
          validation,
          durationMs: Date.now() - started,
        });
      }

      let snapshot = this.dashboardEngine.getLatestSnapshot();
      if (!snapshot) {
        const refresh = this.refreshDashboard({ validated: true }, config);
        snapshot = refresh.snapshot;
      }
      if (!snapshot) {
        return this.failReport("drill_down", ["No dashboard snapshot available"], Date.now() - started);
      }

      const drillDown = this.dashboardEngine.buildDrillDown({
        focus: input.focus,
        focusReference: input.focusReference,
        snapshot,
      });
      snapshot.drillDown = drillDown;

      return this.metadataGenerator.buildRunReport({
        action: "drill_down",
        engineRecord,
        snapshot,
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "drill_down",
        [error instanceof Error ? error.message : "Drill-down failed"],
        Date.now() - started,
      );
    }
  }

  runDiagnostics(
    input: RunDashboardDiagnosticsInput,
    _config: ExecutivePortfolioDashboardConfiguration,
  ): DashboardRunReport {
    const started = Date.now();
    try {
      const engineRecord = this.requireConnected();
      const snapshot = this.dashboardEngine.getLatestSnapshot();
      const errors: string[] = [];
      const warnings: string[] = [];
      if (!snapshot) {
        errors.push("Missing enterprise data — no dashboard snapshot");
      }
      if (input.focusReference && snapshot?.drillDown?.focusReference !== input.focusReference) {
        warnings.push("Requested focus reference not currently drilled down");
      }
      return this.metadataGenerator.buildRunReport({
        action: "diagnostics",
        engineRecord,
        snapshot,
        validation: {
          validationReportId: `epd-val-${Date.now()}`,
          validationTimestamp: new Date().toISOString(),
          decision: errors.length > 0 ? "fail" : warnings.length > 0 ? "partial" : "pass",
          errors,
          warnings,
          durationMs: Date.now() - started,
          metadataVersion: EPD_METADATA_VERSION,
        },
        durationMs: Date.now() - started,
      });
    } catch (error) {
      return this.failReport(
        "diagnostics",
        [error instanceof Error ? error.message : "Diagnostics failed"],
        Date.now() - started,
      );
    }
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.dashboardEngine.resetForTesting();
  }
}
