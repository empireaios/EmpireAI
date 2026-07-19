import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAudienceIntelligenceConfiguration,
  type AudienceIntelligenceConfiguration,
} from "./configuration.js";
import { appendAudLog, getAudLogs, resetAudLogsForTesting } from "./aud-logging.js";
import { AUDIENCE_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeAudienceInput,
  AudienceCockpitSnapshot,
  AudienceIntelligenceState,
  AudienceRunReport,
  BuildAudienceInput,
  ConnectAudienceIntelligenceInput,
  DetectOverlapInput,
  GenerateAudienceRecommendationsInput,
} from "./types.js";
import { AudienceIntelligenceController } from "./audience-intelligence-controller.js";
import {
  AudienceIntelligenceManager,
  type AudienceIntelligenceDependencies,
} from "./audience-intelligence-manager.js";

export interface AudienceIntelligenceEngineOptions {
  configuration?: Partial<AudienceIntelligenceConfiguration>;
}

export type { AudienceIntelligenceDependencies };

/**
 * Audience Intelligence Engine (PILLOW-AUD-001 / R5-08).
 * Audience analysis for better targeting — structural analytics, PII redacted.
 */
export class AudienceIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: AudienceIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AudienceIntelligenceDependencies,
    options: AudienceIntelligenceEngineOptions = {},
  ) {
    const config = buildAudienceIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AudienceIntelligenceManager(dependencies);
    this.controller = new AudienceIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AudienceIntelligenceState> {
    const doc = await this.reader.readText(AUDIENCE_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Audience Intelligence")) {
      throw new Error(
        `${AUDIENCE_INTELLIGENCE_SYSTEM_PATH} missing — Audience Intelligence requires R5-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAudLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-08 Audience Intelligence initialized",
    });
    return this.getState();
  }

  getState(): AudienceIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Audience Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const audiences = this.controller.getManager().getAudienceRecords();
    const averageQualityScore =
      audiences.length === 0
        ? 0
        : audiences.reduce((sum, a) => sum + a.audienceQualityScore, 0) / audiences.length;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalAudiences: audiences.length,
      averageQualityScore,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AUD-001",
      missionId: "R5-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAudienceIntelligence(input: ConnectAudienceIntelligenceInput = {}): AudienceRunReport {
    return this.controller.connectAudienceIntelligence(input);
  }

  buildAudience(input: BuildAudienceInput): AudienceRunReport {
    return this.controller.buildAudience(input);
  }

  analyzeDemographics(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.analyzeDemographics(input);
  }

  analyzeInterests(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.analyzeInterests(input);
  }

  analyzeBehaviour(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.analyzeBehaviour(input);
  }

  analyzeIntent(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.analyzeIntent(input);
  }

  measureEngagement(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.measureEngagement(input);
  }

  measureQuality(input: AnalyzeAudienceInput): AudienceRunReport {
    return this.controller.measureQuality(input);
  }

  detectOverlap(input: DetectOverlapInput = {}): AudienceRunReport {
    return this.controller.detectOverlap(input);
  }

  generateRecommendations(
    input: GenerateAudienceRecommendationsInput = {},
  ): AudienceRunReport {
    return this.controller.generateRecommendations(input);
  }

  getLatestReport(): AudienceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getAudienceRecords() {
    return this.controller.getManager().getAudienceRecords();
  }

  updateConfiguration(
    overrides: Partial<AudienceIntelligenceConfiguration>,
  ): AudienceIntelligenceState {
    const next = buildAudienceIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Audience Intelligence status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No audience operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AudienceCockpitSnapshot {
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
      audiencesBuilt: state.performance.audiencesBuilt,
      averageQualityScore: state.health.averageQualityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getAudLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAudienceIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AudienceIntelligenceDependencies,
  options?: AudienceIntelligenceEngineOptions,
): AudienceIntelligenceEngine {
  return new AudienceIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetAudienceIntelligenceForTesting(): void {
  resetAudLogsForTesting();
  new AudienceIntelligenceManager({
    marketingFramework: null,
    customerSegmentation: null,
    customerJourney: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    campaignManager: null,
  }).resetForTesting();
}
