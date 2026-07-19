import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCompetitorMarketingMonitorConfiguration,
  type CompetitorMarketingMonitorConfiguration,
} from "./configuration.js";
import { appendCmmLog, getCmmLogs, resetCmmLogsForTesting } from "./cmm-logging.js";
import { COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  CompetitorCockpitSnapshot,
  CompetitorMarketingMonitorState,
  CompetitorRunReport,
  ConnectCompetitorMarketingMonitorInput,
  DiscoverCompetitorsInput,
  GenerateIntelligenceInput,
  MonitorCompetitorsInput,
} from "./types.js";
import { CompetitorMarketingController } from "./competitor-marketing-controller.js";
import {
  CompetitorMarketingManager,
  type CompetitorMarketingMonitorDependencies,
} from "./competitor-marketing-manager.js";
import { CompetitiveAnalysisEngine } from "./competitive-analysis-engine.js";

export interface CompetitorMarketingMonitorOptions {
  configuration?: Partial<CompetitorMarketingMonitorConfiguration>;
}

export type { CompetitorMarketingMonitorDependencies };

/**
 * Competitor Marketing Monitor (PILLOW-CMM-001 / R5-15).
 * Competitor tracking for market awareness — authorized public signals only.
 */
export class CompetitorMarketingMonitor {
  private initializedAt: string | null = null;
  private readonly controller: CompetitorMarketingController;
  private readonly reader: RepositoryReader;
  private readonly analysis = new CompetitiveAnalysisEngine();

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CompetitorMarketingMonitorDependencies,
    options: CompetitorMarketingMonitorOptions = {},
  ) {
    const config = buildCompetitorMarketingMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CompetitorMarketingManager(dependencies);
    this.controller = new CompetitorMarketingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CompetitorMarketingMonitorState> {
    const doc = await this.reader.readText(COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Competitor Marketing Monitor")) {
      throw new Error(
        `${COMPETITOR_MARKETING_MONITOR_SYSTEM_PATH} missing — requires R5-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCmmLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-15 Competitor Marketing Monitor initialized",
    });
    return this.getState();
  }

  getState(): CompetitorMarketingMonitorState {
    if (!this.initializedAt) {
      throw new Error("Competitor Marketing Monitor not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const competitors = this.controller.getManager().getCompetitorRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCompetitorRecords: competitors.length,
      averageCompetitiveScore: this.analysis.averageScore(competitors),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CMM-001",
      missionId: "R5-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCompetitorMarketingMonitor(
    input: ConnectCompetitorMarketingMonitorInput = {},
  ): CompetitorRunReport {
    return this.controller.connectCompetitorMarketingMonitor(input);
  }

  discoverCompetitors(input: DiscoverCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.discoverCompetitors(input);
  }

  monitorCampaigns(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorCampaigns(input);
  }

  monitorAdvertisements(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorAdvertisements(input);
  }

  monitorKeywords(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorKeywords(input);
  }

  monitorSeoRankings(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorSeoRankings(input);
  }

  monitorLandingPages(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorLandingPages(input);
  }

  monitorPromotions(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.monitorPromotions(input);
  }

  detectStrategyChanges(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.detectStrategyChanges(input);
  }

  detectEmergingCompetitors(input: MonitorCompetitorsInput = {}): CompetitorRunReport {
    return this.controller.detectEmergingCompetitors(input);
  }

  generateCompetitiveIntelligence(input: GenerateIntelligenceInput = {}): CompetitorRunReport {
    return this.controller.generateCompetitiveIntelligence(input);
  }

  getLatestReport(): CompetitorRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCompetitorRecords() {
    return this.controller.getManager().getCompetitorRecords();
  }

  updateConfiguration(
    overrides: Partial<CompetitorMarketingMonitorConfiguration>,
  ): CompetitorMarketingMonitorState {
    const next = buildCompetitorMarketingMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Competitor Marketing Monitor status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No competitor monitoring operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CompetitorCockpitSnapshot {
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
      totalCompetitorRecords: state.health.totalCompetitorRecords,
      averageCompetitiveScore: state.health.averageCompetitiveScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getCmmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCompetitorMarketingMonitor(
  bootstrap: EmpireBootstrapContext,
  dependencies: CompetitorMarketingMonitorDependencies,
  options?: CompetitorMarketingMonitorOptions,
): CompetitorMarketingMonitor {
  return new CompetitorMarketingMonitor(bootstrap, dependencies, options);
}

export function resetCompetitorMarketingMonitorForTesting(): void {
  resetCmmLogsForTesting();
  new CompetitorMarketingManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    seoIntelligence: null,
    campaignManager: null,
    audienceIntelligence: null,
    marketingAnalyticsDashboard: null,
    conversionIntelligence: null,
  }).resetForTesting();
}
