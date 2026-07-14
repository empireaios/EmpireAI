/** T4-10 — Per-mission T4 Executive Collaboration validators. */

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
import type { ExecutiveCollaborationCertificationConfiguration } from "./configuration.js";
import type { MissionValidationResult, T4MissionId } from "./types.js";
import { appendCertificationLog } from "./certification-logging.js";

export type T4EngineBundle = {
  naturalUxConversation: NaturalUxConversationEngine;
  voiceUxCommands: VoiceUxCommandsEngine;
  screenAnnotation: ScreenAnnotationEngine;
  multiProposalGenerator: MultiProposalGeneratorEngine;
  sideBySideComparison: SideBySideComparisonEngine;
  explainDecisions: ExplainDecisionsEngine;
  approvalWorkflow: ApprovalWorkflowEngine;
  preferenceLearning: PreferenceLearningEngine;
  continuousCollaboration: ContinuousCollaborationEngine;
  autonomousBuilderCertification?: AutonomousBuilderCertificationEngine;
};

const MISSION_NAMES: Record<T4MissionId, string> = {
  "T4-01": "Natural UX Conversation",
  "T4-02": "Voice UX Commands",
  "T4-03": "Screen Annotation",
  "T4-04": "Multi-Proposal Generator",
  "T4-05": "Side-by-Side Comparison",
  "T4-06": "Explain Decisions",
  "T4-07": "Approval Workflow",
  "T4-08": "Preference Learning",
  "T4-09": "Continuous Collaboration",
};

function baseResult(
  missionId: T4MissionId,
  started: number,
): MissionValidationResult {
  return {
    missionId,
    missionName: MISSION_NAMES[missionId],
    passed: false,
    healthStatus: "unknown",
    readinessScore: 0,
    details: [],
    warnings: [],
    errors: [],
    durationMs: Date.now() - started,
  };
}

function validateEngine(
  missionId: T4MissionId,
  started: number,
  run: () => {
    state: { health: { status: string }; engineVersion?: string; missionId?: string };
    supervisor: { valid: boolean; readinessScore: number; notes: string[] };
    extra?: (result: MissionValidationResult) => void;
  },
  config: ExecutiveCollaborationCertificationConfiguration,
): MissionValidationResult {
  const result = baseResult(missionId, started);
  try {
    const { state, supervisor, extra } = run();
    result.healthStatus = state.health.status;
    result.readinessScore = supervisor.readinessScore;
    result.details.push(`Engine version: ${state.engineVersion ?? "unknown"}`);
    result.details.push(`Health: ${state.health.status}`);
    result.details.push(...supervisor.notes);

    if (config.validateHealthReporting && state.health.status === "failed") {
      result.errors.push("Health reporting indicates failed status");
    }
    if (supervisor.readinessScore < config.requiredPassThreshold) {
      result.warnings.push(
        `Readiness score ${supervisor.readinessScore} below threshold ${config.requiredPassThreshold}`,
      );
    }
    if (!supervisor.valid) {
      result.errors.push("Supervisor validation returned invalid");
    }

    extra?.(result);

    result.passed =
      supervisor.valid &&
      result.errors.length === 0 &&
      supervisor.readinessScore >= config.requiredPassThreshold;
    result.durationMs = Date.now() - started;

    appendCertificationLog({
      event: "mission_validation_end",
      level: result.passed ? "info" : "warn",
      details: `${missionId} ${result.passed ? "PASS" : "FAIL"} · ${result.durationMs}ms`,
    });
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Validation failed");
    result.durationMs = Date.now() - started;
  }
  return result;
}

export class T4CapabilityValidator {
  validateMission(
    missionId: T4MissionId,
    engines: T4EngineBundle,
    config: ExecutiveCollaborationCertificationConfiguration,
  ): MissionValidationResult {
    appendCertificationLog({
      event: "mission_validation_start",
      level: "info",
      details: `Validating ${missionId}`,
    });
    const started = Date.now();

    switch (missionId) {
      case "T4-01":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.naturalUxConversation.getState(),
            supervisor: engines.naturalUxConversation.validateForSupervisorSync(),
            extra: (r) => {
              const report = engines.naturalUxConversation.getLatestReport();
              if (report?.latestTurn?.conversationId) {
                r.details.push(`Latest turn: ${report.latestTurn.conversationId}`);
              }
            },
          }),
          config,
        );

      case "T4-02":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.voiceUxCommands.getState(),
            supervisor: engines.voiceUxCommands.validateForSupervisorSync(),
          }),
          config,
        );

      case "T4-03":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.screenAnnotation.getState(),
            supervisor: engines.screenAnnotation.validateForSupervisorSync(),
          }),
          config,
        );

      case "T4-04": {
        const result = validateEngine(
          missionId,
          started,
          () => ({
            state: engines.multiProposalGenerator.getState(),
            supervisor: engines.multiProposalGenerator.validateForSupervisorSync(),
            extra: (r) => {
              const report = engines.multiProposalGenerator.getLatestReport();
              if (report?.proposals.length) {
                r.details.push(`Proposals available: ${report.proposals.length}`);
              }
            },
          }),
          config,
        );
        const report = engines.multiProposalGenerator.getLatestReport();
        if (!report?.proposals.length) {
          result.warnings.push("No proposals generated yet — E2E run may populate");
        }
        return result;
      }

      case "T4-05":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.sideBySideComparison.getState(),
            supervisor: engines.sideBySideComparison.validateForSupervisorSync(),
          }),
          config,
        );

      case "T4-06":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.explainDecisions.getState(),
            supervisor: engines.explainDecisions.validateForSupervisorSync(),
          }),
          config,
        );

      case "T4-07": {
        const result = validateEngine(
          missionId,
          started,
          () => ({
            state: engines.approvalWorkflow.getState(),
            supervisor: engines.approvalWorkflow.validateForSupervisorSync(),
            extra: (r) => {
              if (config.validateGovernanceRules) {
                r.details.push("Grand King approval workflow governance active");
              }
            },
          }),
          config,
        );
        const latest = engines.approvalWorkflow.getLatestReport();
        if (
          latest?.validation.errors.some((e) =>
            e.toLowerCase().includes("approve automatically"),
          )
        ) {
          result.errors.push("Approval workflow auto-approve detected");
          result.passed = false;
        }
        return result;
      }

      case "T4-08":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.preferenceLearning.getState(),
            supervisor: engines.preferenceLearning.validateForSupervisorSync(),
            extra: (r) => {
              const prefs = engines.preferenceLearning.getLearnedPreferences();
              r.details.push(`Learned preferences: ${prefs.length}`);
            },
          }),
          config,
        );

      case "T4-09":
        return validateEngine(
          missionId,
          started,
          () => ({
            state: engines.continuousCollaboration.getState(),
            supervisor: engines.continuousCollaboration.validateForSupervisorSync(),
            extra: (r) => {
              const session = engines.continuousCollaboration.getActiveSession();
              if (session) {
                r.details.push(`Active session: ${session.collaborationSessionId}`);
              }
            },
          }),
          config,
        );

      default:
        return baseResult(missionId, started);
    }
  }

  validateAll(
    engines: T4EngineBundle,
    config: ExecutiveCollaborationCertificationConfiguration,
  ): MissionValidationResult[] {
    const results = config.validationScope.map((missionId) =>
      this.validateMission(missionId, engines, config),
    );

    if (config.requireT3AutonomousBuilderCertified && engines.autonomousBuilderCertification) {
      const abc = engines.autonomousBuilderCertification.getLatestReport();
      if (!abc || abc.finalCertificationDecision !== "pass") {
        for (const result of results) {
          result.warnings.push("T3 Autonomous Builder not certified");
        }
      }
    }

    return results;
  }
}
