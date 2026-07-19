import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildConversionIntelligenceConfiguration,
  type ConversionIntelligenceConfiguration,
} from "./configuration.js";
import { appendCviLog, getCviLogs, resetCviLogsForTesting } from "./cvi-logging.js";
import { CONVERSION_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectConversionIntelligenceInput,
  ConversionCockpitSnapshot,
  ConversionIntelligenceState,
  ConversionRunReport,
  MeasureConversionInput,
  OptimizeFunnelInput,
  RecommendImprovementsInput,
  TrackFunnelInput,
} from "./types.js";
import { ConversionIntelligenceController } from "./conversion-intelligence-controller.js";
import {
  ConversionIntelligenceManager,
  type ConversionIntelligenceDependencies,
} from "./conversion-intelligence-manager.js";
import { ConversionAnalyticsEngine } from "./conversion-analytics-engine.js";

export interface ConversionIntelligenceOptions {
  configuration?: Partial<ConversionIntelligenceConfiguration>;
}

export type { ConversionIntelligenceDependencies };

/**
 * Conversion Intelligence (PILLOW-CVI-001 / R5-14).
 * Funnel optimization for higher conversion rates — structural only.
 */
export class ConversionIntelligence {
  private initializedAt: string | null = null;
  private readonly controller: ConversionIntelligenceController;
  private readonly reader: RepositoryReader;
  private readonly analytics = new ConversionAnalyticsEngine();

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ConversionIntelligenceDependencies,
    options: ConversionIntelligenceOptions = {},
  ) {
    const config = buildConversionIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ConversionIntelligenceManager(dependencies);
    this.controller = new ConversionIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ConversionIntelligenceState> {
    const doc = await this.reader.readText(CONVERSION_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Conversion Intelligence")) {
      throw new Error(
        `${CONVERSION_INTELLIGENCE_SYSTEM_PATH} missing — requires R5-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCviLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-14 Conversion Intelligence initialized",
    });
    return this.getState();
  }

  getState(): ConversionIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Conversion Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const conversions = this.controller.getManager().getConversionRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalConversionRecords: conversions.length,
      averageConversionRate: this.analytics.averageConversionRate(conversions),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CVI-001",
      missionId: "R5-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectConversionIntelligence(
    input: ConnectConversionIntelligenceInput = {},
  ): ConversionRunReport {
    return this.controller.connectConversionIntelligence(input);
  }

  trackFunnel(input: TrackFunnelInput): ConversionRunReport {
    return this.controller.trackFunnel(input);
  }

  trackDropOff(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.trackDropOff(input);
  }

  measureLandingPage(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.measureLandingPage(input);
  }

  measureCampaignConversion(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.measureCampaignConversion(input);
  }

  measureChannelConversion(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.measureChannelConversion(input);
  }

  detectBottlenecks(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.detectBottlenecks(input);
  }

  detectAbandonment(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.detectAbandonment(input);
  }

  calculateEfficiency(input: MeasureConversionInput = {}): ConversionRunReport {
    return this.controller.calculateEfficiency(input);
  }

  recommendImprovements(input: RecommendImprovementsInput = {}): ConversionRunReport {
    return this.controller.recommendImprovements(input);
  }

  optimizeFunnel(input: OptimizeFunnelInput = {}): ConversionRunReport {
    return this.controller.optimizeFunnel(input);
  }

  getLatestReport(): ConversionRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getConversionRecords() {
    return this.controller.getManager().getConversionRecords();
  }

  updateConfiguration(
    overrides: Partial<ConversionIntelligenceConfiguration>,
  ): ConversionIntelligenceState {
    const next = buildConversionIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Conversion Intelligence status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No conversion intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ConversionCockpitSnapshot {
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
      totalConversionRecords: state.health.totalConversionRecords,
      averageConversionRate: state.health.averageConversionRate,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getCviLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createConversionIntelligence(
  bootstrap: EmpireBootstrapContext,
  dependencies: ConversionIntelligenceDependencies,
  options?: ConversionIntelligenceOptions,
): ConversionIntelligence {
  return new ConversionIntelligence(bootstrap, dependencies, options);
}

export function resetConversionIntelligenceForTesting(): void {
  resetCviLogsForTesting();
  new ConversionIntelligenceManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    seoIntelligence: null,
    campaignManager: null,
    audienceIntelligence: null,
    attributionEngine: null,
    marketingAnalyticsDashboard: null,
    aiCampaignGenerator: null,
    budgetOptimizationEngine: null,
  }).resetForTesting();
}
