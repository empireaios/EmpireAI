import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCrossBusinessKnowledgeEngineConfiguration,
  type CrossBusinessKnowledgeEngineConfiguration,
} from "./configuration.js";
import { appendCbkLog, getCbkLogs, resetCbkLogsForTesting } from "./cbk-logging.js";
import { CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ClassifyKnowledgeInput,
  CollectKnowledgeInput,
  ConnectCrossBusinessKnowledgeInput,
  CrossBusinessKnowledgeEngineState,
  DetectDuplicateKnowledgeInput,
  KnowledgeCockpitSnapshot,
  KnowledgeRunReport,
  RankKnowledgeInput,
  RecommendKnowledgeInput,
  RunKnowledgeDiagnosticsInput,
  ShareKnowledgeInput,
} from "./types.js";
import { CrossBusinessKnowledgeController } from "./cross-business-knowledge-controller.js";
import {
  CrossBusinessKnowledgeManager,
  type CrossBusinessKnowledgeEngineDependencies,
} from "./cross-business-knowledge-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CrossBusinessKnowledgeEngineOptions {
  configuration?: Partial<CrossBusinessKnowledgeEngineConfiguration>;
}

export type { CrossBusinessKnowledgeEngineDependencies };

/**
 * Cross-Business Knowledge Engine (PILLOW-CBK-001 / X2-04).
 * Enterprise-wide knowledge sharing — structural signals only.
 */
export class CrossBusinessKnowledgeEngine {
  private initializedAt: string | null = null;
  private readonly controller: CrossBusinessKnowledgeController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CrossBusinessKnowledgeEngineDependencies,
    options: CrossBusinessKnowledgeEngineOptions = {},
  ) {
    const config = buildCrossBusinessKnowledgeEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CrossBusinessKnowledgeManager(dependencies);
    this.controller = new CrossBusinessKnowledgeController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CrossBusinessKnowledgeEngineState> {
    const doc = await this.reader.readText(CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Cross-Business Knowledge Engine")) {
      throw new Error(
        `${CROSS_BUSINESS_KNOWLEDGE_ENGINE_SYSTEM_PATH} missing — Cross-Business Knowledge Engine requires X2-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCbkLog({
      event: "CROSS_BUSINESS_KNOWLEDGE_ENGINE_ready",
      level: "info",
      details: "X2-04 Cross-Business Knowledge Engine initialized",
    });
    return this.getState();
  }

  getState(): CrossBusinessKnowledgeEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Cross-Business Knowledge Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const knowledge = this.controller.getManager().getKnowledgeRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalKnowledgeRecords: knowledge.length,
      sharedKnowledgeRecords: this.controller.getManager().sharedKnowledgeCount(),
      duplicateSignals: this.controller.getManager().duplicateSignalCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CBK-001",
      missionId: "X2-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCrossBusinessKnowledgeEngine(
    input: ConnectCrossBusinessKnowledgeInput = {},
  ): KnowledgeRunReport {
    return this.controller.connectCrossBusinessKnowledgeEngine(input);
  }

  collectKnowledge(input: CollectKnowledgeInput): KnowledgeRunReport {
    return this.controller.collectKnowledge(input);
  }

  classifyKnowledge(input: ClassifyKnowledgeInput): KnowledgeRunReport {
    return this.controller.classifyKnowledge(input);
  }

  shareKnowledge(input: ShareKnowledgeInput): KnowledgeRunReport {
    return this.controller.shareKnowledge(input);
  }

  detectDuplicates(input: DetectDuplicateKnowledgeInput = {}): KnowledgeRunReport {
    return this.controller.detectDuplicates(input);
  }

  rankKnowledge(input: RankKnowledgeInput = {}): KnowledgeRunReport {
    return this.controller.rankKnowledge(input);
  }

  generateRecommendations(input: RecommendKnowledgeInput = {}): KnowledgeRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunKnowledgeDiagnosticsInput = {}): KnowledgeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): KnowledgeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getKnowledgeRecords() {
    return this.controller.getManager().getKnowledgeRecords();
  }

  updateConfiguration(
    overrides: Partial<CrossBusinessKnowledgeEngineConfiguration>,
  ): CrossBusinessKnowledgeEngineState {
    const next = buildCrossBusinessKnowledgeEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Engine status: ${state.status}`,
        `Knowledge records: ${state.health.totalKnowledgeRecords}`,
        `Shared: ${state.health.sharedKnowledgeRecords}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No knowledge operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): KnowledgeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalKnowledgeRecords: state.health.totalKnowledgeRecords,
      sharedKnowledgeRecords: state.health.sharedKnowledgeRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.multiCompanyRegistry ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0),
      recentLogs: getCbkLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCrossBusinessKnowledgeEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CrossBusinessKnowledgeEngineDependencies,
  options?: CrossBusinessKnowledgeEngineOptions,
): CrossBusinessKnowledgeEngine {
  return new CrossBusinessKnowledgeEngine(bootstrap, dependencies, options);
}

export function resetCrossBusinessKnowledgeEngineForTesting(): void {
  resetCbkLogsForTesting();
  new CrossBusinessKnowledgeManager({
    enterprisePortfolioFramework: null,
    multiCompanyRegistry: null,
    portfolioPerformanceEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
