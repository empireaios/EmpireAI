/** R3-16 — Executive Financial Dashboard Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import type { FinancialForecastEngine } from "../financial-forecast-engine/engine.js";
import type { BudgetManagementEngine } from "../budget-management-engine/engine.js";
import type { FinancialRiskMonitor } from "../financial-risk-monitor/engine.js";
import { EXECUTIVE_FINANCIAL_DASHBOARD_ID, EFD_METADATA_VERSION } from "./paths.js";
import { appendEfdLog } from "./efd-logging.js";
import { DashboardRegistry } from "./dashboard-registry.js";
import { DashboardDataSource } from "./dashboard-data-source.js";
import { FinancialDashboardEngine } from "./financial-dashboard-engine.js";
import { FinancialKpiEngine } from "./financial-kpi-engine.js";
import { DashboardWidgetManager } from "./dashboard-widget-manager.js";
import { DashboardMetadataGenerator } from "./dashboard-metadata-generator.js";
import { DashboardValidator } from "./dashboard-validator.js";
import { DashboardRetryManager } from "./dashboard-retry-manager.js";
import type { ExecutiveFinancialDashboardConfiguration } from "./configuration.js";
import type {
  AggregateFinancialKpisInput,
  ConnectExecutiveFinancialDashboardInput,
  DashboardSnapshot,
  DashboardWidget,
  ExecutiveDashboardRunReport,
  ExecutiveFinancialDashboardRecord,
  GenerateExecutiveSummaryInput,
  GetDashboardWidgetsInput,
  RefreshExecutiveDashboardInput,
} from "./types.js";

export class ExecutiveFinancialDashboardManager {
  private engineRecord: ExecutiveFinancialDashboardRecord | null = null;
  private readonly registry = new DashboardRegistry();
  private readonly validator = new DashboardValidator();
  private readonly metadataGenerator = new DashboardMetadataGenerator();
  private readonly dashboardEngine = new FinancialDashboardEngine();
  private readonly kpiEngine = new FinancialKpiEngine();
  private readonly widgetManager = new DashboardWidgetManager();
  private readonly retryManager = new DashboardRetryManager();
  private readonly dataSource: DashboardDataSource;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
    private readonly financialForecastEngine: FinancialForecastEngine | null,
    private readonly budgetManagementEngine: BudgetManagementEngine | null,
    private readonly financialRiskMonitor: FinancialRiskMonitor | null,
  ) {
    this.dataSource = new DashboardDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      cashFlowMonitor,
      financialForecastEngine,
      budgetManagementEngine,
      financialRiskMonitor,
    );
  }

  getEngineRecord(): ExecutiveFinancialDashboardRecord | null {
    return this.engineRecord;
  }

  getSnapshots() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    return {
      reConnected: this.isConnected(this.revenueEngine?.getEngineRecord?.()),
      exConnected: this.isConnected(this.expenseEngine?.getEngineRecord?.()),
      pcConnected: this.isConnected(this.profitCalculationEngine?.getEngineRecord?.()),
      cfConnected: this.isConnected(this.cashFlowMonitor?.getMonitorRecord?.()),
      fctConnected: this.isConnected(this.financialForecastEngine?.getEngineRecord?.()),
      bmgConnected: this.isConnected(this.budgetManagementEngine?.getEngineRecord?.()),
      frmConnected: this.isConnected(this.financialRiskMonitor?.getEngineRecord?.()),
    };
  }

  registerWithFramework(
    config: ExecutiveFinancialDashboardConfiguration,
  ): { frameworkModuleId: string | null; validation: ExecutiveDashboardRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: EXECUTIVE_FINANCIAL_DASHBOARD_ID,
        moduleVersion: EFD_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-16",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://executive-financial-dashboard",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["dashboard.refreshed", "dashboard.summary", "dashboard.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendEfdLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered executive financial dashboard with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `efd-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: EFD_METADATA_VERSION,
      },
    };
  }

  connectExecutiveFinancialDashboard(
    _input: ConnectExecutiveFinancialDashboardInput,
    config: ExecutiveFinancialDashboardConfiguration,
  ): ExecutiveDashboardRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, cfConnected, fctConnected, bmgConnected, frmConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(EXECUTIVE_FINANCIAL_DASHBOARD_ID);
    }

    const allConnected = reConnected && exConnected && cfConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      cashFlowMonitorConnected: cfConnected,
      financialForecastEngineConnected: fctConnected,
      budgetManagementEngineConnected: bmgConnected,
      financialRiskMonitorConnected: frmConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!cfConnected) validation.warnings.push("Cash Flow Monitor not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      snapshots: [],
      widgets: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private buildDashboardSnapshot(
    config: ExecutiveFinancialDashboardConfiguration,
  ): { snapshot: DashboardSnapshot | null; widgets: DashboardWidget[]; error: string | null; warnings: string[] } {
    const data = this.dataSource.aggregate();
    const snapshot = this.dashboardEngine.buildSnapshot(data, config);
    const snapshotValidation = this.validator.validateSnapshot(snapshot, config);
    if (snapshotValidation.decision === "fail") {
      return {
        snapshot: null,
        widgets: [],
        error: snapshotValidation.errors.join("; "),
        warnings: [...data.warnings, ...snapshotValidation.warnings],
      };
    }
    const widgets = this.widgetManager.buildWidgets(snapshot, data, config);
    return {
      snapshot,
      widgets,
      error: null,
      warnings: [...data.warnings, ...snapshotValidation.warnings],
    };
  }

  private runDashboardAction(
    action: ExecutiveDashboardRunReport["action"],
    fn: () => {
      snapshots: DashboardSnapshot[];
      widgets: DashboardWidget[];
      error: string | null;
      warnings: string[];
    },
    config: ExecutiveFinancialDashboardConfiguration,
    eventTopic?: string,
  ): ExecutiveDashboardRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Executive financial dashboard not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    if (this.framework && result.snapshots.length > 0 && eventTopic) {
      for (const snapshot of result.snapshots) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: EXECUTIVE_FINANCIAL_DASHBOARD_ID,
          topic: eventTopic,
          payloadRef: snapshot.dashboardId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      snapshots: result.snapshots,
      widgets: result.widgets,
      validation,
      durationMs: Date.now() - started,
    });
  }

  refreshExecutiveDashboard(
    input: RefreshExecutiveDashboardInput,
    config: ExecutiveFinancialDashboardConfiguration,
  ): ExecutiveDashboardRunReport {
    const refreshKey = `refresh:${Math.floor(Date.now() / config.dashboardRefreshFrequencyMs)}`;
    if (!input.forceRefresh && this.registry.hasRefreshKey(refreshKey)) {
      return this.runDashboardAction(
        "refresh_dashboard",
        () => ({
          snapshots: [],
          widgets: [],
          error: "Duplicate dashboard refresh within frequency window",
          warnings: [],
        }),
        config,
      );
    }

    return this.runDashboardAction(
      "refresh_dashboard",
      () => {
        const result = this.buildDashboardSnapshot(config);
        if (result.snapshot) {
          this.registry.store(result.snapshot, refreshKey);
          appendEfdLog({
            event: "dashboard_refresh",
            level: "info",
            details: `Dashboard ${result.snapshot.dashboardId} refreshed`,
          });
        }
        return {
          snapshots: result.snapshot ? [result.snapshot] : [],
          widgets: result.widgets,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "dashboard.refreshed",
    );
  }

  generateExecutiveSummary(
    _input: GenerateExecutiveSummaryInput,
    config: ExecutiveFinancialDashboardConfiguration,
  ): ExecutiveDashboardRunReport {
    return this.runDashboardAction(
      "generate_summary",
      () => {
        const result = this.buildDashboardSnapshot(config);
        if (result.snapshot) {
          const summary = this.dashboardEngine.buildExecutiveSummary(result.snapshot);
          this.registry.store(result.snapshot);
          appendEfdLog({
            event: "executive_summary",
            level: "info",
            details: summary,
          });
        }
        return {
          snapshots: result.snapshot ? [result.snapshot] : [],
          widgets: result.widgets,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "dashboard.summary",
    );
  }

  aggregateFinancialKpis(
    _input: AggregateFinancialKpisInput,
    config: ExecutiveFinancialDashboardConfiguration,
  ): ExecutiveDashboardRunReport {
    return this.runDashboardAction(
      "aggregate_kpis",
      () => {
        const data = this.dataSource.aggregate();
        const kpis = this.kpiEngine.aggregate(data, config);
        const snapshot = this.dashboardEngine.buildSnapshot(data, config);
        snapshot.kpiSummary = { kpis };
        this.registry.store(snapshot);

        appendEfdLog({
          event: "kpi_aggregation",
          level: "info",
          details: `Aggregated ${kpis.length} KPIs`,
        });

        return {
          snapshots: [snapshot],
          widgets: this.widgetManager.buildWidgets(snapshot, data, config, ["kpi"]),
          error: null,
          warnings: data.warnings,
        };
      },
      config,
    );
  }

  getDashboardWidgets(
    input: GetDashboardWidgetsInput,
    config: ExecutiveFinancialDashboardConfiguration,
  ): ExecutiveDashboardRunReport {
    return this.runDashboardAction(
      "get_widgets",
      () => {
        const latest = this.registry.latest();
        if (!latest) {
          const refreshed = this.buildDashboardSnapshot(config);
          if (!refreshed.snapshot) {
            return {
              snapshots: [],
              widgets: [],
              error: refreshed.error ?? "No dashboard snapshot available",
              warnings: refreshed.warnings,
            };
          }
          this.registry.store(refreshed.snapshot);
          const widgets = this.widgetManager.buildWidgets(
            refreshed.snapshot,
            this.dataSource.aggregate(),
            config,
            input.widgetTypes,
          );
          return {
            snapshots: [refreshed.snapshot],
            widgets,
            error: null,
            warnings: refreshed.warnings,
          };
        }

        const data = this.dataSource.aggregate();
        const widgets = this.widgetManager.buildWidgets(latest, data, config, input.widgetTypes);
        return {
          snapshots: [latest],
          widgets,
          error: null,
          warnings: data.warnings,
        };
      },
      config,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
