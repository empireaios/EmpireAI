import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildViralTrendIntelligenceConfiguration,
  type ViralTrendIntelligenceConfiguration,
} from "./configuration.js";
import { appendVtiLog, getVtiLogs, resetVtiLogsForTesting } from "./vti-logging.js";
import { VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectViralTrendIntelligenceInput,
  DiscoverTrendsInput,
  MonitorTrendsInput,
  PredictTrendsInput,
  RecommendTrendsInput,
  TrendCockpitSnapshot,
  TrendRunReport,
  ViralTrendIntelligenceState,
} from "./types.js";
import { ViralTrendIntelligenceController } from "./viral-trend-intelligence-controller.js";
import {
  ViralTrendIntelligenceManager,
  type ViralTrendIntelligenceDependencies,
} from "./viral-trend-intelligence-manager.js";
import { TrendAnalyticsEngine } from "./trend-analytics-engine.js";

export interface ViralTrendIntelligenceOptions {
  configuration?: Partial<ViralTrendIntelligenceConfiguration>;
}

export type { ViralTrendIntelligenceDependencies };

/**
 * Viral Trend Intelligence (PILLOW-VTI-001 / R5-16).
 * Trend discovery for early trend detection — authorized public signals only.
 */
export class ViralTrendIntelligence {
  private initializedAt: string | null = null;
  private readonly controller: ViralTrendIntelligenceController;
  private readonly reader: RepositoryReader;
  private readonly analytics = new TrendAnalyticsEngine();

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ViralTrendIntelligenceDependencies,
    options: ViralTrendIntelligenceOptions = {},
  ) {
    const config = buildViralTrendIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ViralTrendIntelligenceManager(dependencies);
    this.controller = new ViralTrendIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ViralTrendIntelligenceState> {
    const doc = await this.reader.readText(VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Viral Trend Intelligence")) {
      throw new Error(
        `${VIRAL_TREND_INTELLIGENCE_SYSTEM_PATH} missing — requires R5-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendVtiLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-16 Viral Trend Intelligence initialized",
    });
    return this.getState();
  }

  getState(): ViralTrendIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Viral Trend Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const trends = this.controller.getManager().getTrendRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalTrendRecords: trends.length,
      averageTrendScore: this.analytics.averageScore(trends),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-VTI-001",
      missionId: "R5-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectViralTrendIntelligence(
    input: ConnectViralTrendIntelligenceInput = {},
  ): TrendRunReport {
    return this.controller.connectViralTrendIntelligence(input);
  }

  discoverTrends(input: DiscoverTrendsInput = {}): TrendRunReport {
    return this.controller.discoverTrends(input);
  }

  monitorKeywords(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.monitorKeywords(input);
  }

  monitorHashtags(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.monitorHashtags(input);
  }

  monitorProducts(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.monitorProducts(input);
  }

  monitorContent(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.monitorContent(input);
  }

  monitorCreators(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.monitorCreators(input);
  }

  detectAcceleration(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.detectAcceleration(input);
  }

  detectDecline(input: MonitorTrendsInput = {}): TrendRunReport {
    return this.controller.detectDecline(input);
  }

  predictTrends(input: PredictTrendsInput = {}): TrendRunReport {
    return this.controller.predictTrends(input);
  }

  recommendTrends(input: RecommendTrendsInput = {}): TrendRunReport {
    return this.controller.recommendTrends(input);
  }

  getLatestReport(): TrendRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTrendRecords() {
    return this.controller.getManager().getTrendRecords();
  }

  updateConfiguration(
    overrides: Partial<ViralTrendIntelligenceConfiguration>,
  ): ViralTrendIntelligenceState {
    const next = buildViralTrendIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Viral Trend Intelligence status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No viral trend intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TrendCockpitSnapshot {
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
      totalTrendRecords: state.health.totalTrendRecords,
      averageTrendScore: state.health.averageTrendScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getVtiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createViralTrendIntelligence(
  bootstrap: EmpireBootstrapContext,
  dependencies: ViralTrendIntelligenceDependencies,
  options?: ViralTrendIntelligenceOptions,
): ViralTrendIntelligence {
  return new ViralTrendIntelligence(bootstrap, dependencies, options);
}

export function resetViralTrendIntelligenceForTesting(): void {
  resetVtiLogsForTesting();
  new ViralTrendIntelligenceManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    seoIntelligence: null,
    audienceIntelligence: null,
    marketingAnalyticsDashboard: null,
    competitorMarketingMonitor: null,
  }).resetForTesting();
}
