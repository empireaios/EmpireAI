/** T5-10 — Per-mission T5 Autonomous Evolution validators. */

import { T5_MISSION_IDS } from "./paths.js";
import type { VisualIntelligenceCertificationConfiguration } from "./configuration.js";
import { appendCertificationLog } from "./certification-logging.js";
import type { MissionValidationResult, T5MissionId, VisualIntelligenceEngineBundle } from "./types.js";

const MISSION_NAMES: Record<T5MissionId, string> = {
  "T5-01": "Continuous Screen Observation",
  "T5-02": "Autonomous UX Audit",
  "T5-03": "UX Opportunity Discovery",
  "T5-04": "Productivity Intelligence",
  "T5-05": "Workflow Evolution",
  "T5-06": "Adaptive Interface",
  "T5-07": "Continuous UX Evolution",
  "T5-08": "Executive Workspace Intelligence",
  "T5-09": "Self-Improving UX",
};

function baseResult(missionId: T5MissionId, started: number): MissionValidationResult {
  return {
    missionId,
    missionName: MISSION_NAMES[missionId],
    passed: false,
    healthStatus: "unknown",
    readinessScore: 0,
    details: [],
    warnings: [],
    errors: [],
    evidenceReferences: [],
    durationMs: Date.now() - started,
  };
}

function validateEngine(
  missionId: T5MissionId,
  started: number,
  run: () => {
    state: { health: { status: string }; engineVersion?: string; missionId?: string };
    supervisor: { valid: boolean; readinessScore: number; notes: string[] };
    extra?: (result: MissionValidationResult) => void;
  },
  config: VisualIntelligenceCertificationConfiguration,
): MissionValidationResult {
  const result = baseResult(missionId, started);
  try {
    const { state, supervisor, extra } = run();
    result.healthStatus = state.health.status;
    result.readinessScore = supervisor.readinessScore;
    result.details.push(`Engine version: ${state.engineVersion ?? "unknown"}`);
    result.details.push(`Health: ${state.health.status}`);
    result.details.push(...supervisor.notes);
    result.evidenceReferences.push(`${missionId}:${state.engineVersion ?? "unknown"}`);

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

export class T5CapabilityValidator {
  validateMission(
    missionId: T5MissionId,
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ): MissionValidationResult {
    appendCertificationLog({
      event: "mission_validation_start",
      level: "info",
      details: `Validating ${missionId}`,
    });
    const started = Date.now();

    switch (missionId) {
      case "T5-01":
        return validateEngine("T5-01", started, () => ({
          state: engines.continuousScreenObservation.getState(),
          supervisor: engines.continuousScreenObservation.validateForSupervisorSync(),
        }), config);

      case "T5-02":
        return validateEngine("T5-02", started, () => ({
          state: engines.autonomousUxAudit.getState(),
          supervisor: engines.autonomousUxAudit.validateForSupervisorSync(),
        }), config);

      case "T5-03":
        return validateEngine("T5-03", started, () => ({
          state: engines.uxOpportunityDiscovery.getState(),
          supervisor: engines.uxOpportunityDiscovery.validateForSupervisorSync(),
        }), config);

      case "T5-04":
        return validateEngine("T5-04", started, () => ({
          state: engines.productivityIntelligence.getState(),
          supervisor: engines.productivityIntelligence.validateForSupervisorSync(),
        }), config);

      case "T5-05":
        return validateEngine("T5-05", started, () => ({
          state: engines.workflowEvolution.getState(),
          supervisor: engines.workflowEvolution.validateForSupervisorSync(),
        }), config);

      case "T5-06":
        return validateEngine("T5-06", started, () => ({
          state: engines.adaptiveInterface.getState(),
          supervisor: engines.adaptiveInterface.validateForSupervisorSync(),
        }), config);

      case "T5-07":
        return validateEngine("T5-07", started, () => ({
          state: engines.continuousUxEvolution.getState(),
          supervisor: engines.continuousUxEvolution.validateForSupervisorSync(),
        }), config);

      case "T5-08":
        return validateEngine("T5-08", started, () => ({
          state: engines.executiveWorkspaceIntelligence.getState(),
          supervisor: engines.executiveWorkspaceIntelligence.validateForSupervisorSync(),
        }), config);

      case "T5-09": {
        const result = validateEngine("T5-09", started, () => ({
          state: engines.selfImprovingUx.getState(),
          supervisor: engines.selfImprovingUx.validateForSupervisorSync(),
          extra: (r) => {
            const cfg = engines.selfImprovingUx.getState().configuration;
            if (!cfg.learnOnlyMode) {
              r.errors.push("Self-Improving UX must operate in learn-only mode");
            } else {
              r.details.push("Learn-only mode verified");
            }
          },
        }), config);
        return result;
      }

      default:
        return baseResult(missionId, started);
    }
  }

  validateAll(
    engines: VisualIntelligenceEngineBundle,
    config: VisualIntelligenceCertificationConfiguration,
  ): MissionValidationResult[] {
    return T5_MISSION_IDS.map((id) => this.validateMission(id, engines, config));
  }
}
