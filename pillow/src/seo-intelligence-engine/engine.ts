import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketingFrameworkEngine } from "../marketing-framework/engine.js";
import type { CustomerJourneyIntelligenceEngine } from "../customer-journey-intelligence-engine/engine.js";
import {
  buildSeoIntelligenceConfiguration,
  type SeoIntelligenceConfiguration,
} from "./configuration.js";
import { appendSieLog, getSieLogs, resetSieLogsForTesting } from "./sie-logging.js";
import { SEO_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzePageInput,
  ConnectSeoEngineInput,
  DetectIssuesInput,
  GenerateRecommendationsInput,
  ManageKeywordInput,
  ManageSeoProjectInput,
  MonitorOrganicPerformanceInput,
  OptimizeMetadataInput,
  RecommendInternalLinksInput,
  SeoCockpitSnapshot,
  SeoIntelligenceState,
  SeoRunReport,
  TrackRankingInput,
} from "./types.js";
import { SeoIntelligenceController } from "./seo-intelligence-controller.js";
import { SeoIntelligenceManager } from "./seo-intelligence-manager.js";

export interface SeoIntelligenceEngineOptions {
  configuration?: Partial<SeoIntelligenceConfiguration>;
}

/**
 * SEO Intelligence Engine (PILLOW-SIE-001 / R5-06).
 * Search optimization via Marketing Framework + Customer Journey Intelligence — structural analysis.
 */
export class SeoIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: SeoIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketingFramework: MarketingFrameworkEngine,
    journeyIntelligence: CustomerJourneyIntelligenceEngine | null,
    options: SeoIntelligenceEngineOptions = {},
  ) {
    const config = buildSeoIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SeoIntelligenceManager(marketingFramework, journeyIntelligence);
    this.controller = new SeoIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SeoIntelligenceState> {
    const doc = await this.reader.readText(SEO_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("SEO Intelligence")) {
      throw new Error(
        `${SEO_INTELLIGENCE_SYSTEM_PATH} missing — SEO Intelligence Engine requires R5-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSieLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-06 SEO Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): SeoIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("SEO Intelligence Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalProjects: this.controller.getManager().getProjectCount(),
      totalPagesAnalyzed: performance.pagesAnalyzed,
      totalKeywords: this.controller.getManager().getKeywordCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SIE-001",
      missionId: "R5-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSeoEngine(input: ConnectSeoEngineInput = {}): SeoRunReport {
    return this.controller.connectSeoEngine(input);
  }

  manageProject(input: ManageSeoProjectInput): SeoRunReport {
    return this.controller.manageProject(input);
  }

  analyzePage(input: AnalyzePageInput): SeoRunReport {
    return this.controller.analyzePage(input);
  }

  manageKeyword(input: ManageKeywordInput): SeoRunReport {
    return this.controller.manageKeyword(input);
  }

  trackRanking(input: TrackRankingInput = {}): SeoRunReport {
    return this.controller.trackRanking(input);
  }

  detectIssues(input: DetectIssuesInput = {}): SeoRunReport {
    return this.controller.detectIssues(input);
  }

  optimizeMetadata(input: OptimizeMetadataInput): SeoRunReport {
    return this.controller.optimizeMetadata(input);
  }

  recommendInternalLinks(input: RecommendInternalLinksInput): SeoRunReport {
    return this.controller.recommendInternalLinks(input);
  }

  generateRecommendations(input: GenerateRecommendationsInput = {}): SeoRunReport {
    return this.controller.generateRecommendations(input);
  }

  monitorOrganicPerformance(input: MonitorOrganicPerformanceInput = {}): SeoRunReport {
    return this.controller.monitorOrganicPerformance(input);
  }

  getLatestReport(): SeoRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSeoRecords() {
    return this.controller.getManager().getSeoRecords();
  }

  updateConfiguration(
    overrides: Partial<SeoIntelligenceConfiguration>,
  ): SeoIntelligenceState {
    const next = buildSeoIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `SEO status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No SEO operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SeoCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      pagesAnalyzed: state.performance.pagesAnalyzed,
      keywordsTracked: state.performance.keywordsTracked,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      journeyIntelligenceConnected: Boolean(record?.journeyIntelligenceConnected),
      recentLogs: getSieLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSeoIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  marketingFramework: MarketingFrameworkEngine,
  journeyIntelligence: CustomerJourneyIntelligenceEngine | null,
  options?: SeoIntelligenceEngineOptions,
): SeoIntelligenceEngine {
  return new SeoIntelligenceEngine(
    bootstrap,
    marketingFramework,
    journeyIntelligence,
    options,
  );
}

export function resetSeoIntelligenceEngineForTesting(): void {
  resetSieLogsForTesting();
  new SeoIntelligenceManager(null, null).resetForTesting();
}
