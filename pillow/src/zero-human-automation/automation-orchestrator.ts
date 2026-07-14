import type { AutomationSafetyStop, AutomationState } from "./types.js";
import { AUTOMATION_SAFETY_STOPS } from "./paths.js";
import { aggregateAutomationLevel } from "./automation-levels-registry.js";

export function evaluateAutomationSafety(input: {
  visionConflict?: boolean;
  constitutionConflict?: boolean;
  criticalProductionRisk?: boolean;
  repositoryIntegrityOk?: boolean;
  securityViolation?: boolean;
  grandKingApprovalRequired?: boolean;
  guardianCritical?: boolean;
  grandKingOverride?: boolean;
}): { safe: boolean; stops: AutomationSafetyStop[]; reason: string } {
  const stops: AutomationSafetyStop[] = [];

  if (input.visionConflict) stops.push("vision_conflict");
  if (input.constitutionConflict) stops.push("constitution_conflict");
  if (input.criticalProductionRisk || input.guardianCritical) {
    stops.push("critical_production_risk");
  }
  if (input.repositoryIntegrityOk === false) stops.push("repository_integrity_threatened");
  if (input.securityViolation) stops.push("security_policy_violated");
  if (input.grandKingApprovalRequired) stops.push("grand_king_approval_required");

  if (input.grandKingOverride && stops.length > 0) {
    return {
      safe: true,
      stops,
      reason: "Grand King override — automation may proceed with recorded risk",
    };
  }

  if (stops.length > 0) {
    return {
      safe: false,
      stops,
      reason: `Automation stopped: ${stops.map((s) => s.replace(/_/g, " ")).join(", ")}`,
    };
  }

  return {
    safe: true,
    stops: [],
    reason: "Constitutional automation authorized — all safety gates passed",
  };
}

export function assessAutomationState(input: {
  supervisorActive?: boolean;
  builderActive?: boolean;
  guardianHealthy?: boolean;
  recoveryActive?: boolean;
  eccCoordinationScore?: number;
  queueDepth?: number;
  safety: ReturnType<typeof evaluateAutomationSafety>;
}): AutomationState {
  const level = aggregateAutomationLevel();
  const pipelineProgress = Math.min(
    100,
    Math.round(
      (input.supervisorActive ? 15 : 0) +
        (input.builderActive ? 20 : 0) +
        (input.guardianHealthy ? 15 : 0) +
        (input.recoveryActive ? 0 : 10) +
        ((input.eccCoordinationScore ?? 0) * 0.4),
    ),
  );

  let health: AutomationState["automationHealth"] = "healthy";
  if (!input.safety.safe) health = "stopped";
  else if (input.recoveryActive) health = "degraded";
  else if ((input.eccCoordinationScore ?? 100) < 60) health = "degraded";
  else if (!input.guardianHealthy) health = "blocked";

  return {
    automationLevel: level,
    automationHealth: health,
    activeAutomation: input.builderActive
      ? "Builder mission execution"
      : input.supervisorActive
        ? "Supervisor observation"
        : null,
    queuedAutomation: input.queueDepth ?? 0,
    successRate: input.safety.safe ? 0.92 : 0.75,
    failureCount: input.recoveryActive ? 1 : 0,
    recoveryStatus: input.recoveryActive ? "Recovery in progress" : "Standby",
    safetyStops: input.safety.stops,
    pipelineProgress,
  };
}

export function formatAutomationLevel(level: string): string {
  return level.replace(/^level_\d_/, "").replace(/_/g, " ");
}

export { AUTOMATION_SAFETY_STOPS };
