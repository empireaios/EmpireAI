import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketingAnalyticsDashboardConfiguration,
  type MarketingAnalyticsDashboardConfiguration,
} from "./configuration.js";
import { appendMadLog, getMadLogs, resetMadLogsForTesting } from "./mad-logging.js";
import { MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateKpisInput,
  ConnectDashboardInput,
  DashboardCockpitSnapshot,
  GenerateExecutiveSummaryInput,
  MarketingAnalyticsDashboardState,
  DashboardRunReport,
  RefreshDashboardInput,
} from "./types.js";
import { MarketingAnalyticsDashboardController } from "./marketing-analytics-dashboard-controller.js";
import {
  MarketingAnalyticsDashboardManager,
  type MarketingAnalyticsDashboardDependencies,
} from "./marketing-analytics-dashboard-manager.js";

export interface MarketingAnalyticsDashboardOptions {
  configuration?: Partial<MarketingAnalyticsDashboardConfiguration>;
}

export type { MarketingAnalyticsDashboardDependencies };

/**
 * Marketing Analytics Dashboard (PILLOW-MAD-001 / R5-10).
 * Executive marketing cockpit for live campaign visibility — structural analytics only.
 */
export class MarketingAnalyticsDashboard {
  private initializedAt: string | null = null;
  private readonly controller: MarketingAnalyticsDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: MarketingAnalyticsDashboardDependencies,
    options: MarketingAnalyticsDashboardOptions = {},
  ) {
    const config = buildMarketingAnalyticsDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketingAnalyticsDashboardManager(dependencies);
    this.controller = new MarketingAnalyticsDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketingAnalyticsDashboardState> {
    const doc = await this.reader.readText(MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Marketing Analytics Dashboard")) {
      throw new Error(
        `${MARKETING_ANALYTICS_DASHBOARD_SYSTEM_PATH} missing — requires R5-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMadLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-10 Marketing Analytics Dashboard initialized",
    });
    return this.getState();
  }

  getState(): MarketingAnalyticsDashboardState {
    if (!this.initializedAt) {
      throw new Error("Marketing Analytics Dashboard not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const latestSnapshot = this.controller.getManager().getLatestSnapshot();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRefreshes: performance.dashboardRefreshes,
      latestOverallScore: latestSnapshot?.kpiSummary.overallScore ?? 0,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MAD-001",
      missionId: "R5-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      latestSnapshot,
      health,
      performance,
    };
  }

  connectDashboard(input: ConnectDashboardInput = {}): DashboardRunReport {
    return this.controller.connectDashboard(input);
  }

  refreshDashboard(input: RefreshDashboardInput = {}): DashboardRunReport {
    return this.controller.refreshDashboard(input);
  }

  aggregateKpis(input: AggregateKpisInput = {}): DashboardRunReport {
    return this.controller.aggregateKpis(input);
  }

  generateExecutiveSummary(input: GenerateExecutiveSummaryInput = {}): DashboardRunReport {
    return this.controller.generateExecutiveSummary(input);
  }

  getLatestReport(): DashboardRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestSnapshot() {
    return this.controller.getManager().getLatestSnapshot();
  }

  updateConfiguration(
    overrides: Partial<MarketingAnalyticsDashboardConfiguration>,
  ): MarketingAnalyticsDashboardState {
    const next = buildMarketingAnalyticsDashboardConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Marketing Analytics Dashboard status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DashboardCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      dashboardRefreshes: state.performance.dashboardRefreshes,
      latestOverallScore: state.latestSnapshot?.kpiSummary.overallScore ?? 0,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getMadLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMarketingAnalyticsDashboard(
  bootstrap: EmpireBootstrapContext,
  dependencies: MarketingAnalyticsDashboardDependencies,
  options?: MarketingAnalyticsDashboardOptions,
): MarketingAnalyticsDashboard {
  return new MarketingAnalyticsDashboard(bootstrap, dependencies, options);
}

export function resetMarketingAnalyticsDashboardForTesting(): void {
  resetMadLogsForTesting();
  new MarketingAnalyticsDashboardManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    seoIntelligence: null,
    campaignManager: null,
    audienceIntelligence: null,
    attributionEngine: null,
  }).resetForTesting();
}
