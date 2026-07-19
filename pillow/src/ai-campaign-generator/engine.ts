import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAiCampaignGeneratorConfiguration,
  type AiCampaignGeneratorConfiguration,
} from "./configuration.js";
import { appendAcgLog, getAcgLogs, resetAcgLogsForTesting } from "./acg-logging.js";
import { AI_CAMPAIGN_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  AiCampaignCockpitSnapshot,
  AiCampaignGeneratorState,
  AiCampaignRunReport,
  ConnectAiCampaignGeneratorInput,
  GenerateCampaignInput,
  GenerateStrategyInput,
  RecommendInput,
} from "./types.js";
import { AiCampaignGeneratorController } from "./ai-campaign-generator-controller.js";
import {
  AiCampaignGeneratorManager,
  type AiCampaignGeneratorDependencies,
} from "./ai-campaign-generator-manager.js";

export interface AiCampaignGeneratorOptions {
  configuration?: Partial<AiCampaignGeneratorConfiguration>;
}

export type { AiCampaignGeneratorDependencies };

/**
 * AI Campaign Generator (PILLOW-ACG-001 / R5-12).
 * Pillow campaign planning — structural AI recommendations; never auto-publishes.
 */
export class AiCampaignGenerator {
  private initializedAt: string | null = null;
  private readonly controller: AiCampaignGeneratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AiCampaignGeneratorDependencies,
    options: AiCampaignGeneratorOptions = {},
  ) {
    const config = buildAiCampaignGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AiCampaignGeneratorManager(dependencies);
    this.controller = new AiCampaignGeneratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AiCampaignGeneratorState> {
    const doc = await this.reader.readText(AI_CAMPAIGN_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("AI Campaign Generator")) {
      throw new Error(
        `${AI_CAMPAIGN_GENERATOR_SYSTEM_PATH} missing — AI Campaign Generator requires R5-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAcgLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-12 AI Campaign Generator initialized",
    });
    return this.getState();
  }

  getState(): AiCampaignGeneratorState {
    if (!this.initializedAt) {
      throw new Error("AI Campaign Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const campaigns = this.controller.getManager().getCampaignRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCampaignsGenerated: campaigns.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ACG-001",
      missionId: "R5-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAiCampaignGenerator(input: ConnectAiCampaignGeneratorInput = {}): AiCampaignRunReport {
    return this.controller.connectAiCampaignGenerator(input);
  }

  generateCampaign(input: GenerateCampaignInput = {}): AiCampaignRunReport {
    return this.controller.generateCampaign(input);
  }

  generateStrategy(input: GenerateStrategyInput = {}): AiCampaignRunReport {
    return this.controller.generateStrategy(input);
  }

  generateObjective(input: GenerateStrategyInput = {}): AiCampaignRunReport {
    return this.controller.generateObjective(input);
  }

  recommendChannels(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendChannels(input);
  }

  recommendAudience(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendAudience(input);
  }

  recommendBudget(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendBudget(input);
  }

  recommendSchedule(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendSchedule(input);
  }

  recommendKeywords(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendKeywords(input);
  }

  recommendCreatives(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.recommendCreatives(input);
  }

  generateSummary(input: RecommendInput = {}): AiCampaignRunReport {
    return this.controller.generateSummary(input);
  }

  getLatestReport(): AiCampaignRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCampaignRecords() {
    return this.controller.getManager().getCampaignRecords();
  }

  updateConfiguration(
    overrides: Partial<AiCampaignGeneratorConfiguration>,
  ): AiCampaignGeneratorState {
    const next = buildAiCampaignGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `AI Campaign Generator status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No AI campaign operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AiCampaignCockpitSnapshot {
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
      campaignsGenerated: state.performance.campaignsGenerated,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getAcgLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAiCampaignGenerator(
  bootstrap: EmpireBootstrapContext,
  dependencies: AiCampaignGeneratorDependencies,
  options?: AiCampaignGeneratorOptions,
): AiCampaignGenerator {
  return new AiCampaignGenerator(bootstrap, dependencies, options);
}

export function resetAiCampaignGeneratorForTesting(): void {
  resetAcgLogsForTesting();
  new AiCampaignGeneratorManager({
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
    creativeAssetManager: null,
  }).resetForTesting();
}
