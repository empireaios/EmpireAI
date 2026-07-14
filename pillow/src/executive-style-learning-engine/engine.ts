import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import {
  appendExecutiveStyleLog,
  getExecutiveStyleLogs,
  resetExecutiveStyleLogsForTesting,
} from "./executive-style-logging.js";
import { StyleLearningController } from "./style-learning-controller.js";
import {
  buildExecutiveStyleLearningConfiguration,
  type ExecutiveStyleLearningConfiguration,
} from "./configuration.js";
import { EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutiveStyleLearningCockpitSnapshot,
  ExecutiveStyleLearningReport,
  ExecutiveStyleLearningState,
  ExecutiveStyleModel,
  PreferenceCategory,
  PreferenceRecord,
} from "./types.js";

export interface ExecutiveStyleLearningEngineOptions {
  configuration?: Partial<ExecutiveStyleLearningConfiguration>;
}

/**
 * Executive Style Learning Engine (PILLOW-ESL-001 / T2-03).
 * Learns the Grand King's UX preferences from approvals and rejections.
 */
export class ExecutiveStyleLearningEngine {
  private initializedAt: string | null = null;
  private readonly controller: StyleLearningController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    options: ExecutiveStyleLearningEngineOptions = {},
  ) {
    const config = buildExecutiveStyleLearningConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new StyleLearningController(designSystemIntelligence, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveStyleLearningState> {
    const doc = await this.reader.readText(EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH);
    if (!doc?.includes("Executive Style Learning")) {
      throw new Error(
        `${EXECUTIVE_STYLE_LEARNING_SYSTEM_PATH} missing — Executive Style Learning requires T2-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendExecutiveStyleLog({
      event: "executive_style_learning_initialized",
      level: "info",
      details: "Executive Style Learning Engine initialized",
    });
    return this.getState();
  }

  getState(): ExecutiveStyleLearningState {
    if (!this.initializedAt) {
      throw new Error(
        "Executive Style Learning Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      preferencesLearned: this.controller.preferencesLearned(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ESL-001",
      missionId: "T2-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestModel: this.controller.getLatestModel(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  recordApproval(input: {
    category: PreferenceCategory;
    description: string;
    value: string;
    referenceId: string;
  }): PreferenceRecord | null {
    return this.controller.recordApproval(input);
  }

  recordRejection(input: {
    category: PreferenceCategory;
    description: string;
    value: string;
    referenceId: string;
  }): PreferenceRecord | null {
    return this.controller.recordRejection(input);
  }

  runLearning(): ExecutiveStyleLearningReport {
    return this.controller.runLearning();
  }

  getLatestReport(): ExecutiveStyleLearningReport | null {
    return this.controller.getLatestReport();
  }

  getLatestModel(): ExecutiveStyleModel | null {
    return this.controller.getLatestModel();
  }

  getPreferences(): PreferenceRecord[] {
    return this.controller.getPreferences();
  }

  stopExecutiveStyleLearning(): ExecutiveStyleLearningState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveStyleLearningConfiguration>,
  ): ExecutiveStyleLearningState {
    const next = buildExecutiveStyleLearningConfiguration(this.bootstrap.repositoryRoot, {
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
        `Learning status: ${state.status}`,
        `Preferences learned: ${this.controller.preferencesLearned()}`,
        report
          ? `Last learning: ${report.validation.decision} · confidence ${report.model.confidenceScore}`
          : "No learning run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveStyleLearningCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const model = state.latestModel;

    return {
      learningStatus: state.status,
      healthStatus: state.health.status,
      preferenceModelVersion: model?.preferenceModelVersion ?? null,
      preferencesLearned: this.controller.preferencesLearned(),
      confidenceScore: model?.confidenceScore ?? 0,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalApprovals: state.performance.totalApprovals,
      totalRejections: state.performance.totalRejections,
      recentLogs: getExecutiveStyleLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createExecutiveStyleLearningEngine(
  bootstrap: EmpireBootstrapContext,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  options?: ExecutiveStyleLearningEngineOptions,
): ExecutiveStyleLearningEngine {
  return new ExecutiveStyleLearningEngine(bootstrap, designSystemIntelligence, options);
}

export function resetExecutiveStyleLearningForTesting(): void {
  resetExecutiveStyleLogsForTesting();
}
