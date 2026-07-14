import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { PreferenceLearningEngine } from "../preference-learning/engine.js";
import type { ContinuousCollaborationEngine } from "../continuous-collaboration/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./certification-logging.js";
import { CertificationController } from "./certification-controller.js";
import {
  buildExecutiveCollaborationCertificationConfiguration,
  type ExecutiveCollaborationCertificationConfiguration,
} from "./configuration.js";
import { EXECUTIVE_COLLABORATION_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutiveCollaborationCertificationReport,
  ExecutiveCollaborationCertificationState,
  CertificationCockpitSnapshot,
} from "./types.js";

export interface ExecutiveCollaborationCertificationEngineOptions {
  configuration?: Partial<ExecutiveCollaborationCertificationConfiguration>;
}

/**
 * Executive Collaboration Certification Engine (PILLOW-EXC-001 / T4-10).
 * Validates the complete T4 Executive Collaboration pipeline (T4-01 through T4-09).
 */
export class ExecutiveCollaborationCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    naturalUxConversation: NaturalUxConversationEngine,
    voiceUxCommands: VoiceUxCommandsEngine,
    screenAnnotation: ScreenAnnotationEngine,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    sideBySideComparison: SideBySideComparisonEngine,
    explainDecisions: ExplainDecisionsEngine,
    approvalWorkflow: ApprovalWorkflowEngine,
    preferenceLearning: PreferenceLearningEngine,
    continuousCollaboration: ContinuousCollaborationEngine,
    autonomousBuilderCertification?: AutonomousBuilderCertificationEngine,
    options: ExecutiveCollaborationCertificationEngineOptions = {},
  ) {
    const config = buildExecutiveCollaborationCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CertificationController(
      bootstrap.repositoryRoot,
      {
        naturalUxConversation,
        voiceUxCommands,
        screenAnnotation,
        multiProposalGenerator,
        sideBySideComparison,
        explainDecisions,
        approvalWorkflow,
        preferenceLearning,
        continuousCollaboration,
        autonomousBuilderCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveCollaborationCertificationState> {
    const doc = await this.reader.readText(EXECUTIVE_COLLABORATION_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Executive Collaboration Certification")) {
      throw new Error(
        `${EXECUTIVE_COLLABORATION_CERTIFICATION_SYSTEM_PATH} missing — Executive Collaboration Certification requires T4-10 system doc.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    appendCertificationLog({
      event: "certification_engine_initialized",
      level: "info",
      details: "Executive Collaboration Certification Engine initialized",
    });
    return this.getState();
  }

  getState(): ExecutiveCollaborationCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Executive Collaboration Certification Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EXC-001",
      missionId: "T4-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async runCertification(): Promise<ExecutiveCollaborationCertificationReport> {
    return this.controller.runCertification();
  }

  getLatestReport(): ExecutiveCollaborationCertificationReport | null {
    return this.controller.getLatestReport();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveCollaborationCertificationConfiguration>,
  ): ExecutiveCollaborationCertificationState {
    const next = buildExecutiveCollaborationCertificationConfiguration(
      this.bootstrap.repositoryRoot,
      {
        ...this.controller.getConfiguration(),
        ...overrides,
      },
    );
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
      ? report.finalCertificationDecision === "pass"
        ? 100
        : report.finalCertificationDecision === "conditional"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last decision: ${report.finalCertificationDecision} · ${report.missionResults.filter((m) => m.passed).length}/${report.missionResults.length} missions passed`
          : "No certification run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const missionsPassed = report?.missionResults.filter((m) => m.passed).length ?? 0;
    const missionsFailed = report ? report.missionResults.length - missionsPassed : 0;

    return {
      certificationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.finalCertificationDecision ?? state.health.lastCertificationDecision,
      missionsPassed,
      missionsFailed,
      endToEndPassed: report?.endToEndValidationResult.passed ?? false,
      totalCertifications: state.performance.totalCertifications,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createExecutiveCollaborationCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  naturalUxConversation: NaturalUxConversationEngine,
  voiceUxCommands: VoiceUxCommandsEngine,
  screenAnnotation: ScreenAnnotationEngine,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  sideBySideComparison: SideBySideComparisonEngine,
  explainDecisions: ExplainDecisionsEngine,
  approvalWorkflow: ApprovalWorkflowEngine,
  preferenceLearning: PreferenceLearningEngine,
  continuousCollaboration: ContinuousCollaborationEngine,
  autonomousBuilderCertification?: AutonomousBuilderCertificationEngine,
  options?: ExecutiveCollaborationCertificationEngineOptions,
): ExecutiveCollaborationCertificationEngine {
  return new ExecutiveCollaborationCertificationEngine(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    approvalWorkflow,
    preferenceLearning,
    continuousCollaboration,
    autonomousBuilderCertification,
    options,
  );
}

export function resetExecutiveCollaborationCertificationForTesting(): void {
  resetCertificationLogsForTesting();
}
