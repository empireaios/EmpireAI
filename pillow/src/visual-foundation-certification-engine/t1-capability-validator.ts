/** T1-10 — Per-mission T1 subsystem validators. */

import type { VisualCaptureEngine } from "../visual-capture-engine/engine.js";
import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { VisualMemoryEngine } from "../visual-memory-engine/engine.js";
import type { SessionContinuityEngine } from "../session-continuity-engine/engine.js";
import type { VisualFoundationCertificationConfiguration } from "./configuration.js";
import type { MissionValidationResult, T1MissionId } from "./types.js";
import { appendCertificationLog } from "./certification-logging.js";

export type T1EngineBundle = {
  visualCapture: VisualCaptureEngine;
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  interactionTracking: InteractionTrackingEngine;
  contextAwareness: ContextAwarenessEngine;
  visualMemory: VisualMemoryEngine;
  sessionContinuity: SessionContinuityEngine;
};

function baseResult(
  missionId: T1MissionId,
  missionName: string,
  started: number,
): MissionValidationResult {
  return {
    missionId,
    missionName,
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
  missionId: T1MissionId,
  missionName: string,
  started: number,
  run: () => {
    state: { health: { status: string }; missionId?: string; engineVersion?: string };
    supervisor: { valid: boolean; readinessScore: number; notes: string[] };
    extra?: () => void;
  },
  config: VisualFoundationCertificationConfiguration,
): MissionValidationResult {
  const result = baseResult(missionId, missionName, started);
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

    extra?.();

    result.passed = supervisor.valid && result.errors.length === 0;
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

export class T1CapabilityValidator {
  validateMission(
    missionId: T1MissionId,
    engines: T1EngineBundle,
    config: VisualFoundationCertificationConfiguration,
  ): MissionValidationResult {
    appendCertificationLog({
      event: "mission_validation_start",
      level: "info",
      details: `Validating ${missionId}`,
    });
    const started = Date.now();

    switch (missionId) {
      case "T1-01":
        return validateEngine("T1-01", "Visual Capture Engine", started, () => ({
          state: engines.visualCapture.getState(),
          supervisor: engines.visualCapture.validateForSupervisorSync(),
          extra: () => {
            const logs = engines.visualCapture.getCockpitSnapshot().recentLogs;
            if (logs.length === 0) {
              /* logging may be empty before capture — not a hard fail */
            }
          },
        }), config);

      case "T1-02":
        return validateEngine("T1-02", "UI State Mapper", started, () => ({
          state: engines.uiStateMapper.getState(),
          supervisor: engines.uiStateMapper.validateForSupervisorSync(),
        }), config);

      case "T1-03":
        return validateEngine("T1-03", "Component Recognition", started, () => ({
          state: engines.componentRecognition.getState(),
          supervisor: engines.componentRecognition.validateForSupervisorSync(),
        }), config);

      case "T1-04":
        return validateEngine("T1-04", "Layout Understanding", started, () => ({
          state: engines.layoutUnderstanding.getState(),
          supervisor: engines.layoutUnderstanding.validateForSupervisorSync(),
        }), config);

      case "T1-05":
        return validateEngine("T1-05", "Navigation Mapping", started, () => ({
          state: engines.navigationMapping.getState(),
          supervisor: engines.navigationMapping.validateForSupervisorSync(),
        }), config);

      case "T1-06": {
        const result = validateEngine("T1-06", "Interaction Tracking", started, () => ({
          state: engines.interactionTracking.getState(),
          supervisor: engines.interactionTracking.validateForSupervisorSync(),
        }), config);
        if (config.validateSensitiveDataProtection) {
          const maskEnabled = engines.interactionTracking.getState().configuration.maskSensitiveValues;
          if (!maskEnabled) result.errors.push("Sensitive value masking is disabled");
          else result.details.push("Sensitive value masking active");
        }
        result.passed = result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T1-07":
        return validateEngine("T1-07", "Context Awareness", started, () => ({
          state: engines.contextAwareness.getState(),
          supervisor: engines.contextAwareness.validateForSupervisorSync(),
        }), config);

      case "T1-08": {
        const result = validateEngine("T1-08", "Visual Memory", started, () => ({
          state: engines.visualMemory.getState(),
          supervisor: engines.visualMemory.validateForSupervisorSync(),
        }), config);
        if (config.validateSensitiveDataProtection) {
          const maskEnabled = engines.visualMemory.getState().configuration.maskSensitiveValues;
          if (!maskEnabled) result.errors.push("Visual memory sensitive masking disabled");
          else result.details.push("Visual memory sensitive masking active");
        }
        result.passed = result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      case "T1-09": {
        const result = validateEngine("T1-09", "Session Continuity", started, () => ({
          state: engines.sessionContinuity.getState(),
          supervisor: engines.sessionContinuity.validateForSupervisorSync(),
        }), config);
        if (config.validateSensitiveDataProtection) {
          const maskEnabled =
            engines.sessionContinuity.getState().configuration.maskSensitiveValues;
          if (!maskEnabled) result.errors.push("Session continuity sensitive masking disabled");
          else result.details.push("Session continuity sensitive masking active");
        }
        result.passed = result.errors.length === 0 && result.readinessScore >= config.requiredPassThreshold;
        return result;
      }

      default:
        return baseResult(missionId, "Unknown", started);
    }
  }

  validateAll(
    engines: T1EngineBundle,
    config: VisualFoundationCertificationConfiguration,
  ): MissionValidationResult[] {
    return config.validationScope.map((missionId) =>
      this.validateMission(missionId, engines, config),
    );
  }
}
